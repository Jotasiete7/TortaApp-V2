import React, { useState, useEffect } from 'react';
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

export const NewsTicker: React.FC = () => {
    const [messages, setMessages] = useState<TickerMessageExtended[]>([]);
    const [emojisLoaded, setEmojisLoaded] = useState(false);
    const [speed, setSpeed] = useState<number>(() => {
        const saved = localStorage.getItem('ticker_speed');
        return saved ? parseFloat(saved) : 1;
    });

    useEffect(() => {
        emojiService.loadEmojis().then(() => setEmojisLoaded(true));
        fetchMessages();

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

        return () => {
            supabase.removeChannel(channel);
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
                                <div className={`${colorMap[msg.color]} font-medium text-sm flex items-center gap-1.5 h-full`}>
                                    {emojiService.parseText(msg.text).map((part, i) => (
                                        typeof part === 'string' ? (
                                            <span key={i} className="flex items-center">
                                                {renderMessageWithLinks(part)}
                                            </span>
                                        ) : (
                                            <img
                                                key={i}
                                                src={part.path}
                                                alt={part.alt}
                                                className="w-5 h-5 object-contain"
                                                loading="eager"
                                            />
                                        )
                                    ))}
                                </div>

                                {/* Separador */}
                                {index < messages.length * 2 - 1 && (
                                    <span className="ml-8 text-slate-600 flex items-center h-full">•</span>
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
