import React, { useState, useEffect } from 'react';
import { supabase } from '../../services/supabase';
import { Megaphone, Award } from 'lucide-react';
import { emojiService } from '../../services/emojiService';
import { tipsService } from '../../services/TipsService';

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
// Rotating Tips - Helpful advice shown every 10 minutes
const ROTATING_TIPS = [
    "💡 Tip: Double-click any trade in the Live Feed to copy a quick message!",
    "🎯 Tip: Use the Smart Search with filters to find the best deals instantly!",
    "🏆 Tip: Complete achievements to unlock exclusive badges and level up faster!",
    "📊 Tip: Check Market Intelligence for price trends and trading insights!",
    "⚡ Tip: Enable Live Monitor to auto-feed trades - no manual uploads needed!",
    "🔐 Tip: Verify your nick with the @TORTA token for auto-verification!",
    "🎮 Tip: Reach Level 50 'Legendary Whale' by processing 10M+ trades!",
    "💰 Tip: Smart Alerts highlight underpriced items automatically!",
    "📈 Tip: Use Charts Engine to visualize price history and market trends!",
    "🌟 Tip: Paid Shouts appear in the ticker - support the community!",
    "🥧 Tip: The pie emoji 🥧 shows when the ticker completes a full loop!",
    "🔍 Tip: Search debounce prevents lag - type freely without freezing!",
    "🎨 Tip: Customize ticker speed in Settings for your preferred reading pace!",
    "📱 Tip: Advanced Tools section has manual log upload for historic data!",
    "🚀 Tip: Auto-updater keeps your app fresh - check for updates regularly!"
];


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
// This prevents digits like '1', '0', '0' from being split into separate flex items
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

export const NewsTicker: React.FC = () => {
    const [messages, setMessages] = useState<TickerMessageExtended[]>([]);
    const [emojisLoaded, setEmojisLoaded] = useState(false);
    const [currentTipIndex, setCurrentTipIndex] = useState(0);
    const [tipJustChanged, setTipJustChanged] = useState(false);
    const [speed, setSpeed] = useState<number>(() => {
        const saved = localStorage.getItem('ticker_speed');
        return saved ? parseFloat(saved) : 1;
    });



    useEffect(() => {
        emojiService.loadEmojis().then(() => setEmojisLoaded(true));
        fetchMessages();

        // Rotate tips every 10 minutes
        const tipsSettings = tipsService.getSettings();
        if (tipsSettings.enabled) {
            const tipInterval = setInterval(() => {
                setCurrentTipIndex(prev => {
                    const enabledTips = tipsService.getEnabledTips('en');
                    return (prev + 1) % enabledTips.length;
                });
                setTipJustChanged(true);
                // Fade back to normal after 1 minute
                setTimeout(() => setTipJustChanged(false), 60000);
            }, tipsSettings.intervalMinutes * 60 * 1000);

            return () => clearInterval(tipInterval);
        }

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

        // 🔄 AUTO-REFRESH: Polling a cada 60 segundos (backup + garantia)
        const refreshInterval = setInterval(() => {
            fetchMessages();
        }, 60000); // 60 segundos

        return () => {
            supabase.removeChannel(channel);
            clearInterval(refreshInterval);
        };
    }, []);

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

    if (!emojisLoaded || messages.length === 0) {
        return null;
    }

    // Get current tip based on language
    const tipsSettings = tipsService.getSettings();
    const enabledTips = tipsSettings.enabled ? tipsService.getEnabledTips('en') : []; // TODO: Use actual language from props
    const currentTip = enabledTips[currentTipIndex] || '';

    // Inject tip as synthetic message
    const tipMessage = currentTip ? {
        id: 'rotating-tip',
        text: currentTip,
        color: 'purple' as const,
        paid: false,
        created_at: new Date().toISOString(),
        expires_at: null,
        created_by: null,
        created_by_nick: null,
        user_first_badge_id: null
    } : null;

    const messagesWithTip = tipMessage ? [...messages, tipMessage] : messages;

    const colorMap = {
        green: 'text-emerald-400',
        red: 'text-rose-400',
        yellow: 'text-yellow-400',
        cyan: 'text-cyan-400',
        purple: 'text-purple-400'
    };


        return (
            <div className="fixed top-0 left-0 right-0 h-8 bg-black border-b border-slate-800 z-[100] overflow-hidden">
            <div className="flex items-center h-full">
                {/* Ícone fixo à esquerda */}
                <div className="flex-shrink-0 px-3 bg-amber-600 h-full flex items-center justify-center z-20">
                    <Megaphone className="w-4 h-4 text-white" />
                </div>

                {/* Container do Marquee */}
                <div className="flex-1 overflow-hidden relative h-full flex items-center">
                    {/* Alinhamento corrigido: flex items-center para centralizar verticalmente */}
                    <div className="animate-marquee whitespace-nowrap flex items-center h-full">
                        {[...messages, ...messages].map((msg, index) => (
                            <div key={`${msg.id}-${index}`} className="flex items-center mx-8 h-full">
                                {/* Badge/Label */}
                                {msg.paid && (
                                    msg.created_by_nick ? (
                                        // SHOUT COMUNITÁRIO
                                        <div className="mr-3 px-2 py-0.5 bg-cyan-500/10 border border-cyan-500/50 text-cyan-400 text-xs font-bold rounded flex items-center gap-1.5 h-6">
                                            {msg.user_first_badge_id && (
                                                <Award className="w-3.5 h-3.5" />
                                            )}
                                            <span className="leading-none pt-0.5">{msg.created_by_nick}</span>
                                        </div>
                                    ) : (
                                        // ANÚNCIO ADMIN
                                        <div className="mr-3 px-2 py-0.5 bg-amber-500 text-black text-xs font-bold rounded flex items-center h-5">
                                            PAID
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
                                                className="w-5 h-5 object-contain mx-1.5"
                                                loading="eager"
                                            />
                                        )
                                    ))}
                                </div>

                                {/* Separador */}
                                {index < messagesWithTip.length * 2 - 1 && (
                                    index === messagesWithTip.length - 1 ? (
                                        <span className="mx-8 text-xl flex items-center h-full">🥧</span>
                                    ) : (
                                        <span className="mx-8 text-slate-600 flex items-center h-full">•</span>
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
