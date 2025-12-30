import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '../../services/supabase';
import { Megaphone, Award } from 'lucide-react';
import { emojiService } from '../../services/emojiService';

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

// Interface for bilingual tips
interface BilingualTip {
    en: string;
    pt: string;
}

// Rotating Tips - Helpful advice shown every 3-7 minutes (bilingual)
const ROTATING_TIPS: BilingualTip[] = [
    {
        en: "Double-click any trade in the Live Feed to copy a quick message!",
        pt: "Clique duas vezes em qualquer trade no Feed ao Vivo para copiar uma mensagem rápida!"
    },
    {
        en: "Use the Smart Search with filters to find the best deals instantly!",
        pt: "Use a Busca Inteligente com filtros para encontrar as melhores ofertas instantaneamente!"
    },
    {
        en: "Complete achievements to unlock exclusive badges and level up faster!",
        pt: "Complete conquistas para desbloquear badges exclusivos e subir de nível mais rápido!"
    },
    {
        en: "Check Market Intelligence for price trends and trading insights!",
        pt: "Confira a Inteligência de Mercado para tendências de preços e insights de trading!"
    },
    {
        en: "Enable Live Monitor to auto-feed trades - no manual uploads needed!",
        pt: "Ative o Monitor ao Vivo para alimentar trades automaticamente - sem uploads manuais!"
    },
    {
        en: "Verify your nick with the @TORTA token for auto-verification!",
        pt: "Verifique seu nick com o token @TORTA para verificação automática!"
    },
    {
        en: "Reach Level 50 'Legendary Whale' by processing 10M+ trades!",
        pt: "Alcance o Nível 50 'Baleia Lendária' processando 10M+ de trades!"
    },
    {
        en: "Smart Alerts highlight underpriced items automatically!",
        pt: "Alertas Inteligentes destacam itens com preços baixos automaticamente!"
    },
    {
        en: "Use Charts Engine to visualize price history and market trends!",
        pt: "Use o Motor de Gráficos para visualizar histórico de preços e tendências de mercado!"
    },
    {
        en: "Paid Shouts appear in the ticker - support the community!",
        pt: "Shouts Pagos aparecem no ticker - apoie a comunidade!"
    },
    {
        en: "The pie emoji 🥧 shows when the ticker completes a full loop!",
        pt: "O emoji de torta 🥧 aparece quando o ticker completa um loop completo!"
    },
    {
        en: "Search debounce prevents lag - type freely without freezing!",
        pt: "O debounce de busca previne travamentos - digite livremente sem congelar!"
    },
    {
        en: "Customize ticker speed in Settings for your preferred reading pace!",
        pt: "Personalize a velocidade do ticker nas Configurações para seu ritmo de leitura!"
    },
    {
        en: "Advanced Tools section has manual log upload for historic data!",
        pt: "A seção Ferramentas Avançadas tem upload manual de logs para dados históricos!"
    },
    {
        en: "Auto-updater keeps your app fresh - check for updates regularly!",
        pt: "O atualizador automático mantém seu app atualizado - verifique atualizações regularmente!"
    }
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
    const [messages, setMessages] = useState<TickerMessageExtended[]>([]);
    const [emojisLoaded, setEmojisLoaded] = useState(false);
    const [currentTipIndex, setCurrentTipIndex] = useState(0);
    const [tipJustChanged, setTipJustChanged] = useState(false);
    const [language, setLanguage] = useState<'en' | 'pt'>('en');
    const [shuffledTips, setShuffledTips] = useState<BilingualTip[]>([]);
    const [speed, setSpeed] = useState<number>(() => {
        const saved = localStorage.getItem('ticker_speed');
        return saved ? parseFloat(saved) : 1;
    });

    // ✅ Ref to store timer and prevent multiple simultaneous timers
    const timerRef = useRef<NodeJS.Timeout | null>(null);



    useEffect(() => {
        emojiService.loadEmojis().then(() => setEmojisLoaded(true));

        // Load language preference from localStorage
        const savedLang = localStorage.getItem('app_language') || 'en';
        setLanguage(savedLang as 'en' | 'pt');

        // 🎲 Shuffle tips on load for random order
        setShuffledTips(shuffleArray(ROTATING_TIPS));

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

        // 🎯 AUTO-REFRESH: Polling a cada 60 segundos (backup + garantia)
        const refreshInterval = setInterval(() => {
            fetchMessages();
        }, 60000); // 60 segundos

        return () => {
            supabase.removeChannel(channel);
            clearInterval(refreshInterval);
        };
    }, []);

    // ✅ Listen for language changes from Settings
    useEffect(() => {
        const handleStorageChange = (e: StorageEvent) => {
            if (e.key === 'app_language' && e.newValue) {
                setLanguage(e.newValue as 'en' | 'pt');
            }
        };
        window.addEventListener('storage', handleStorageChange);
        return () => window.removeEventListener('storage', handleStorageChange);
    }, []);

    // ✅ Separate effect for tips rotation with RANDOM intervals (3-7 min) and RANDOM order
    useEffect(() => {
        if (shuffledTips.length === 0) return;

        // 🎲 Function to schedule next tip rotation with random interval
        const scheduleNextTip = () => {
            // ✅ Clear any existing timer first to prevent multiple timers
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
                    if (nextIndex >= shuffledTips.length) {
                        setShuffledTips(shuffleArray(ROTATING_TIPS));
                        return 0;
                    }
                    return nextIndex;
                });
                setTipJustChanged(true);
                // Fade back to normal after 1 minute
                setTimeout(() => setTipJustChanged(false), 60000);

                // Schedule the next tip recursively
                scheduleNextTip();
            }, randomInterval);
        };

        // Start the first random interval
        scheduleNextTip();

        return () => {
            // ✅ Clean up timer on unmount or when shuffledTips changes
            if (timerRef.current) {
                clearTimeout(timerRef.current);
                timerRef.current = null;
            }
        };
    }, [shuffledTips]);

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

    // Inject tip as synthetic message with numbering (from shuffled array)
    const currentTip = shuffledTips.length > 0 ? shuffledTips[currentTipIndex % shuffledTips.length] : null;
    const tipNumber = String(currentTipIndex + 1).padStart(2, '0');
    const numberedTip = currentTip ? `Tip #${tipNumber}: ${currentTip[language]}` : '';

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
                    {/* Alinhamento corrigido: flex items-center para centralizar verticalmente */}
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
