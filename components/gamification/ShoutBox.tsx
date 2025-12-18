import React, { useEffect, useState } from 'react';
import { Megaphone, Send, Loader2, AlertCircle, CheckCircle2, Info, X, Clock, Coins, Crown, Shield, Palette } from 'lucide-react';
import { ShoutService } from '../../services/shoutService';
import { ShoutBalance } from '../../types';

interface ShoutBoxProps {
    userId: string;
}

export const ShoutBox: React.FC<ShoutBoxProps> = ({ userId }) => {
    const [balance, setBalance] = useState<ShoutBalance | null>(null);
    const [message, setMessage] = useState('');
    const [loading, setLoading] = useState(true);
    const [sending, setSending] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);
    const [showInfoModal, setShowInfoModal] = useState(false);

    useEffect(() => {
        loadBalance();
    }, [userId]);

    const loadBalance = async () => {
        setLoading(true);
        const data = await ShoutService.getShoutBalance(userId);
        setBalance(data);
        setLoading(false);
    };

    const handleShout = async () => {
        if (!message.trim()) return;

        setSending(true);
        setError(null);
        setSuccess(null);

        const result = await ShoutService.useFreeShout(message);

        if (result.success) {
            setSuccess("Shout enviado! Veja no ticker.");
            setMessage('');
            if (result.remaining_weekly !== undefined && balance) {
                setBalance({
                    ...balance,
                    weekly_shouts_remaining: result.remaining_weekly,
                    monthly_shouts_remaining: result.remaining_monthly ?? ((balance.monthly_shouts_remaining || 1) - 1)
                });
            } else {
                loadBalance();
            }
        } else {
            setError(result.error || "Falha ao enviar shout.");
        }
        setSending(false);
    };

    if (loading) {
        return <div className="animate-pulse h-32 bg-slate-800 rounded-xl"></div>;
    }

    const weekly = balance?.weekly_shouts_remaining ?? 3;
    const monthly = balance?.monthly_shouts_remaining ?? 10;
    const canShout = weekly > 0 && monthly > 0;

    return (
        <>
            {/* Info Modal */}
            {showInfoModal && (
                <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
                    <div className="bg-slate-800 rounded-2xl border-2 border-amber-500 max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl">
                        {/* Header */}
                        <div className="sticky top-0 bg-slate-800 border-b border-slate-700 p-6 flex items-start justify-between">
                            <div className="flex items-center gap-3">
                                <div className="bg-amber-500/20 p-3 rounded-lg">
                                    <Info className="w-6 h-6 text-amber-500" />
                                </div>
                                <div>
                                    <h3 className="text-xl font-bold text-white">â„¹ï¸ Como Funciona o Sistema de Shouts</h3>
                                    <p className="text-sm text-slate-400">Tudo que vocÃª precisa saber</p>
                                </div>
                            </div>
                            <button
                                onClick={() => setShowInfoModal(false)}
                                className="text-slate-400 hover:text-white transition"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        {/* Content */}
                        <div className="p-6 space-y-6">
                            {/* DuraÃ§Ã£o dos Tickers */}
                            <div className="bg-slate-900 rounded-lg p-4 border border-slate-700">
                                <div className="flex items-center gap-2 mb-3">
                                    <Clock className="w-5 h-5 text-cyan-400" />
                                    <h4 className="font-semibold text-white">â±ï¸ DuraÃ§Ã£o dos Tickers</h4>
                                </div>
                                <div className="space-y-2 text-sm">
                                    <div className="flex items-center justify-between p-2 bg-slate-800 rounded">
                                        <span className="text-slate-300">ðŸ†“ Shout GrÃ¡tis (Free)</span>
                                        <span className="text-cyan-400 font-semibold">24 horas</span>
                                    </div>
                                    <div className="flex items-center justify-between p-2 bg-slate-800 rounded">
                                        <span className="text-slate-300">ðŸ‘‘ Shout Premium (Pago)</span>
                                        <span className="text-purple-400 font-semibold">72 horas</span>
                                    </div>
                                    <div className="flex items-center justify-between p-2 bg-slate-800 rounded">
                                        <span className="text-slate-300">ðŸ›¡ï¸ Ticker de Admin</span>
                                        <span className="text-amber-400 font-semibold">Permanente</span>
                                    </div>
                                </div>
                            </div>

                            {/* Como Ganhar Shouts */}
                            <div className="bg-slate-900 rounded-lg p-4 border border-slate-700">
                                <div className="flex items-center gap-2 mb-3">
                                    <Coins className="w-5 h-5 text-emerald-400" />
                                    <h4 className="font-semibold text-white">ðŸ’° Como Ganhar Shouts GrÃ¡tis</h4>
                                </div>
                                <div className="space-y-2 text-sm text-slate-300">
                                    <div className="flex items-start gap-2">
                                        <span className="text-emerald-400">âœ“</span>
                                        <span><strong>3 shouts por semana</strong> (reset automÃ¡tico)</span>
                                    </div>
                                    <div className="flex items-start gap-2">
                                        <span className="text-emerald-400">âœ“</span>
                                        <span><strong>10 shouts por mÃªs</strong> (limite mensal)</span>
                                    </div>
                                    <div className="flex items-start gap-2">
                                        <span className="text-yellow-400">âš ï¸</span>
                                        <span className="text-yellow-300">VocÃª precisa ter <strong>ambos</strong> os limites disponÃ­veis</span>
                                    </div>
                                </div>
                            </div>

                            {/* Tickers Premium */}
                            <div className="bg-gradient-to-br from-purple-900/20 to-pink-900/20 rounded-lg p-4 border border-purple-500/30">
                                <div className="flex items-center gap-2 mb-3">
                                    <Crown className="w-5 h-5 text-purple-400" />
                                    <h4 className="font-semibold text-white">ðŸ‘‘ Tickers Premium</h4>
                                </div>
                                <div className="space-y-3 text-sm">
                                    <p className="text-slate-300">
                                        Shouts Premium duram <strong className="text-purple-400">3x mais</strong> (72h) e tÃªm destaque visual!
                                    </p>
                                    <div className="bg-slate-900/50 rounded p-3 border border-purple-500/20">
                                        <p className="text-purple-300 font-semibold mb-2">ðŸ’Ž Para onde vai o investimento?</p>
                                        <div className="space-y-1 text-slate-300">
                                            <div className="flex items-center gap-2">
                                                <span className="text-amber-400">ðŸ†</span>
                                                <span><strong>50%</strong> â†’ PrÃªmios para a comunidade</span>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <span className="text-cyan-400">ðŸ’¾</span>
                                                <span><strong>50%</strong> â†’ ManutenÃ§Ã£o do banco de dados</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Admin Tickers */}
                            <div className="bg-slate-900 rounded-lg p-4 border border-amber-500/30">
                                <div className="flex items-center gap-2 mb-3">
                                    <Shield className="w-5 h-5 text-amber-400" />
                                    <h4 className="font-semibold text-white">ðŸ›¡ï¸ Tickers de Admin</h4>
                                </div>
                                <p className="text-sm text-slate-300">
                                    Mensagens oficiais da equipe TortaApp. Ficam <strong className="text-amber-400">permanentes</strong> no ticker e tÃªm badge especial.
                                </p>
                            </div>

                            {/* Cores do Market Standard */}
                            <div className="bg-slate-900 rounded-lg p-4 border border-slate-700">
                                <div className="flex items-center gap-2 mb-3">
                                    <Palette className="w-5 h-5 text-pink-400" />
                                    <h4 className="font-semibold text-white">ðŸŽ¨ Cores do Market Standard</h4>
                                </div>
                                <div className="grid grid-cols-2 gap-2 text-sm">
                                    <div className="flex items-center gap-2 p-2 bg-slate-800 rounded">
                                        <div className="w-4 h-4 bg-cyan-500 rounded"></div>
                                        <span className="text-slate-300">WTS (Venda)</span>
                                    </div>
                                    <div className="flex items-center gap-2 p-2 bg-slate-800 rounded">
                                        <div className="w-4 h-4 bg-emerald-500 rounded"></div>
                                        <span className="text-slate-300">WTB (Compra)</span>
                                    </div>
                                    <div className="flex items-center gap-2 p-2 bg-slate-800 rounded">
                                        <div className="w-4 h-4 bg-purple-500 rounded"></div>
                                        <span className="text-slate-300">PC (PreÃ§o)</span>
                                    </div>
                                    <div className="flex items-center gap-2 p-2 bg-slate-800 rounded">
                                        <div className="w-4 h-4 bg-amber-500 rounded"></div>
                                        <span className="text-slate-300">Admin</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Footer */}
                        <div className="sticky bottom-0 bg-slate-800 border-t border-slate-700 p-4">
                            <button
                                onClick={() => setShowInfoModal(false)}
                                className="w-full py-3 bg-amber-500 hover:bg-amber-600 text-slate-900 font-bold rounded-lg transition"
                            >
                                âœ“ Entendi!
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* ShoutBox */}
            <div className="bg-slate-800 border border-slate-700 rounded-xl p-6 relative overflow-hidden">
                {/* Background Decoration */}
                <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none">
                    <Megaphone className="w-32 h-32 text-amber-500" />
                </div>

                <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                        <Megaphone className="w-5 h-5 text-amber-500" />
                        Free Weekly Shouts
                    </h3>
                    <button
                        onClick={() => setShowInfoModal(true)}
                        className="p-2 hover:bg-amber-500/20 text-slate-400 hover:text-amber-400 rounded-lg transition-colors group"
                        title="Como funciona?"
                    >
                        <Info className="w-5 h-5 group-hover:scale-110 transition-transform" />
                    </button>
                </div>

                <div className="flex items-center gap-4 mb-6">
                    <div className="flex-1 bg-slate-900/50 rounded-lg p-3 border border-slate-700 flex flex-col items-center justify-center">
                        <span className={`text-2xl font-bold ${weekly > 0 ? 'text-white' : 'text-red-500'}`}>
                            {weekly}
                        </span>
                        <span className="text-[10px] text-slate-500 uppercase tracking-wider">Weekly Left</span>
                    </div>
                    <div className="flex-1 bg-slate-900/50 rounded-lg p-3 border border-slate-700 flex flex-col items-center justify-center">
                        <span className={`text-2xl font-bold ${monthly > 0 ? 'text-slate-300' : 'text-red-500'}`}>
                            {monthly}
                        </span>
                        <span className="text-[10px] text-slate-500 uppercase tracking-wider">Monthly Left</span>
                    </div>
                </div>

                <div className="space-y-3 relative z-10">
                    <div className="relative">
                        <input
                            type="text"
                            value={message}
                            onChange={(e) => setMessage(e.target.value)}
                            placeholder={canShout ? "Digite sua mensagem..." : "Sem shouts disponÃ­veis esta semana."}
                            disabled={!canShout || sending}
                            maxLength={100}
                            className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:border-amber-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        />
                        <div className="absolute right-3 top-3 text-xs text-slate-600 font-mono">
                            {message.length}/100
                        </div>
                    </div>

                    {error && (
                        <div className="flex items-center gap-2 text-red-400 text-sm bg-red-500/10 p-2 rounded">
                            <AlertCircle className="w-4 h-4" />
                            {error}
                        </div>
                    )}

                    {success && (
                        <div className="flex items-center gap-2 text-emerald-400 text-sm bg-emerald-500/10 p-2 rounded">
                            <CheckCircle2 className="w-4 h-4" />
                            {success}
                        </div>
                    )}

                    <button
                        onClick={handleShout}
                        disabled={!canShout || !message.trim() || sending}
                        className="w-full bg-amber-500 hover:bg-amber-600 text-slate-900 font-bold py-3 rounded-lg transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {sending ? (
                            <>
                                <Loader2 className="w-5 h-5 animate-spin" />
                                Enviando...
                            </>
                        ) : (
                            <>
                                <Send className="w-5 h-5" />
                                Shout to the World
                            </>
                        )}
                    </button>

                    {!canShout && (
                        <p className="text-center text-xs text-slate-500 mt-2">
                            Reseta automaticamente na prÃ³xima semana.
                        </p>
                    )}
                </div>
            </div>
        </>
    );
};
