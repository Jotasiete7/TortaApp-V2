import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '../../services/supabase';
import { Megaphone, Award } from 'lucide-react';
import { emojiService } from '../../services/emojiService';
import { useTranslation } from 'react-i18next';

// Tipos estendidos para incluir novos campos
interface TickerMessageExtended {
    id: string;
    text: string;
    color: 'green' | 'red' | 'yellow' | 'cyan' | 'purple';
    paid: boolean;
    created_at: string;
    expires_at?: string | null;
    created_by?: string | null;
    created_by_nick?: string | null;
    user_first_badge_id?: string | null;
}

// Tip Keys matching JSON keys
const TIP_KEYS = Array.from({ length: 15 }, (_, i) => String(i + 1));

// Helper para renderizar texto com links
const renderMessageWithLinks = (text: string): React.ReactNode[] => {
    const urlRegex = /(https?:\/\/[^\s]+)/g;
    const parts = text.split(urlRegex);

    return parts.map((part, index) => {
        if (part.match(urlRegex)) {
            return (
                <a
                    key={index}
                    href={part}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-400 hover:text-blue-300 underline transition-colors"
                    onClick={(e) => e.stopPropagation()}
                >
                    {part}
                </a>
            );
        }
        return <span key={index}>{part}</span>;
    });
};

// Helper to merge adjacent strings from emoji service
const parseAndMerge = (text: string) => {
    const rawParts = emojiService.parseText(text);
    const mergedParts: (string | { type: 'emoji', path: string, alt: string })[] = [];

    rawParts.forEach(part => {
        const last = mergedParts[mergedParts.length - 1];
        if (typeof part === 'string' && typeof last === 'string') {
            mergedParts[mergedParts.length - 1] = last + part;
        } else {
            mergedParts.push(part);
        }
    });

    return mergedParts;
};

// 🎲 Helper to shuffle array (Fisher-Yates algorithm)
const shuffleArray = <T,>(array: T[]): T[] => {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
};

// 🎲 Helper to generate random interval between 3-7 minutes
const getRandomInterval = (): number => {
    const minMinutes = 3;
    const maxMinutes = 7;
    const randomMinutes = Math.random() * (maxMinutes - minMinutes) + minMinutes;
    return randomMinutes * 60 * 1000; // Convert to milliseconds
};

export const NewsTicker: React.FC = () => {
    const { t } = useTranslation('common');
    const [messages, setMessages] = useState<TickerMessageExtended[]>([]);
    const [emojisLoaded, setEmojisLoaded] = useState(false);
    const [currentTipIndex, setCurrentTipIndex] = useState(0);
    const [tipJustChanged, setTipJustChanged] = useState(false);

    // Using simple keys now
    const [shuffledKeys, setShuffledKeys] = useState<string[]>([]);

    const [speed, setSpeed] = useState<number>(() => {
        const saved = localStorage.getItem('ticker_speed');
        return saved ? parseFloat(saved) : 1;
    });

    // ✅ Ref to store timer and prevent multiple simultaneous timers
    const timerRef = useRef<NodeJS.Timeout | null>(null);

    useEffect(() => {
        emojiService.loadEmojis().then(() => setEmojisLoaded(true));

        // 🎲 Shuffle tips keys on load
        setShuffledKeys(shuffleArray(TIP_KEYS));

        fetchMessages();

        // Realtime subscription
        const channel = supabase
            .channel('ticker-updates')
            .on(
                'postgres_changes',
                {
                    event: '*',
                    schema: 'public',
                    table: 'ticker_messages'
                },
                () => {
                    fetchMessages();
                }
            )
            .subscribe();

        // 🎯 AUTO-REFRESH: Polling a cada 60 segundos
        const refreshInterval = setInterval(() => {
            fetchMessages();
        }, 60000);

        return () => {
            supabase.removeChannel(channel);
            clearInterval(refreshInterval);
        };
    }, []);

    // ✅ Separate effect for tips rotation
    useEffect(() => {
        if (shuffledKeys.length === 0) return;

        // 🎲 Function to schedule next tip rotation with random interval
        const scheduleNextTip = () => {
            // ✅ Clear any existing timer first
            if (timerRef.current) {
                clearTimeout(timerRef.current);
                timerRef.current = null;
            }

            const randomInterval = getRandomInterval();
            console.log(`🎲 Next tip in ${(randomInterval / 60000).toFixed(1)} minutes`);

            timerRef.current = setTimeout(() => {
                setCurrentTipIndex(prev => {
                    const nextIndex = prev + 1;
                    // 🎲 When we reach the end, reshuffle and start over
                    if (nextIndex >= shuffledKeys.length) {
                        setShuffledKeys(shuffleArray(TIP_KEYS));
                        return 0;
                    }
                    return nextIndex;
                });
                setTipJustChanged(true);
                setTimeout(() => setTipJustChanged(false), 60000);

                // Schedule next
                scheduleNextTip();
            }, randomInterval);
        };

        // Start the first random interval
        scheduleNextTip();

        return () => {
            if (timerRef.current) {
                clearTimeout(timerRef.current);
                timerRef.current = null;
            }
        };
    }, [shuffledKeys]);

    useEffect(() => {
        const handleStorageChange = (e: StorageEvent) => {
            if (e.key === 'ticker_speed' && e.newValue) {
                setSpeed(parseFloat(e.newValue));
            }
        };
        window.addEventListener('storage', handleStorageChange);
        return () => window.removeEventListener('storage', handleStorageChange);
    }, []);

    const fetchMessages = async () => {
        const { data, error } = await supabase
            .from('ticker_messages')
            .select('*')
            .order('created_at', { ascending: false })
            .limit(20);

        if (!error && data) {
            const now = new Date();
            const validMessages = data.filter(msg => {
                if (!msg.expires_at) return true;
                return new Date(msg.expires_at) > now;
            });

            setMessages(validMessages);
        }
    };

    if (!emojisLoaded) {
        return null;
    }

    // Pick tip key and translate
    const currentTipKey = shuffledKeys.length > 0 ? shuffledKeys[currentTipIndex % shuffledKeys.length] : null;
    const tipNumber = String(currentTipIndex + 1).padStart(2, '0');
    // Use t() to get text. Assuming keys in json are "1", "2"... 
    const tipText = currentTipKey ? t(`tips.${currentTipKey}`) : '';
    const numberedTip = currentTipKey ? `Tip #${tipNumber}: ${tipText}` : '';

    const tipMessage: TickerMessageExtended = {
        id: 'rotating-tip',
        text: numberedTip,
        color: 'purple',
        paid: false,
        created_at: new Date().toISOString(),
        expires_at: null,
        created_by: null,
        created_by_nick: null,
        user_first_badge_id: null
    };
    const messagesWithTip = [...messages, tipMessage];

    const colorMap = {
        green: 'text-emerald-400',
        red: 'text-rose-400',
        yellow: 'text-yellow-400',
        cyan: 'text-cyan-400',
        purple: 'text-purple-400'
    };


    return (
        <div className="fixed top-0 left-0 right-0 h-8 bg-slate-950 border-b border-slate-800/50 z-[60] overflow-hidden shadow-sm">
            <div className="flex items-center h-full">
                {/* Ícone fixo à esquerda */}
                <div className="flex-shrink-0 px-3 bg-amber-600 h-full flex items-center justify-center z-20 shadow-lg shadow-amber-900/20">
                    <Megaphone className="w-4 h-4 text-white" />
                </div>

                {/* Container do Marquee */}
                <div className="flex-1 overflow-hidden relative h-full flex items-center">
                    <div className="animate-marquee whitespace-nowrap flex items-center h-full">
                        {[...messagesWithTip, ...messagesWithTip].map((msg, index) => (
                            <div key={`${msg.id}-${index}`} className="flex items-center mx-8 h-full">
                                {/* Badge/Label */}
                                {msg.paid && (
                                    msg.created_by_nick ? (
                                        // SHOUT COMUNITÁRIO
                                        <div className="mr-3 px-2 py-0.5 bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 text-xs font-bold rounded flex items-center gap-1.5 h-6">
                                            {msg.user_first_badge_id && (
                                                <Award className="w-3.5 h-3.5" />
                                            )}
                                            <span className="leading-none pt-0.5">{msg.created_by_nick}</span>
                                        </div>
                                    ) : (
                                        // ANÚNCIO ADMIN
                                        <div className="mr-3 px-2 py-0.5 bg-amber-500 text-black text-xs font-bold rounded flex items-center h-5">
                                            {t('ticker.paid')}
                                        </div>
                                    )
                                )}

                                {/* Mensagem */}
                                <div className={`${colorMap[msg.color]} font-medium text-sm flex items-center h-full ${msg.id === 'rotating-tip' && tipJustChanged ? 'animate-pulse' : ''}`}>
                                    {parseAndMerge(msg.text).map((part, i) => (
                                        typeof part === 'string' ? (
                                            <span key={i}>
                                                {renderMessageWithLinks(part)}
                                            </span>
                                        ) : (
                                            <img
                                                key={i}
                                                src={part.path}
                                                alt={part.alt}
                                                // Added 'filter drop-shadow-[0_0_3px_rgba(255,255,255,0.6)]' for sticker glow effect
                                                className="w-5 h-5 object-contain mx-1.5 filter drop-shadow-[0_0_3px_rgba(255,255,255,0.6)]"
                                                loading="eager"
                                            />
                                        )
                                    ))}
                                </div>

                                {/* Separador */}
                                {index < messagesWithTip.length * 2 - 1 && (
                                    index === messagesWithTip.length - 1 ? (
                                        <span className="mx-8 text-xl flex items-center h-full opacity-100 filter drop-shadow-[0_0_5px_rgba(255,255,255,0.8)] pb-1">🥧</span>
                                    ) : (
                                        <span className="mx-8 text-slate-700/50 flex items-center h-full">•</span>
                                    )
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            <style>{`
        @keyframes marquee {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
        .animate-marquee {
          animation: marquee ${60 / speed}s linear infinite;
          /* Garante que o conteúdo não quebre linha e tenha largura suficiente */
          width: max-content;
        }
        .animate-marquee:hover {
          animation-play-state: paused;
        }
      `}</style>
        </div>
    );
};
