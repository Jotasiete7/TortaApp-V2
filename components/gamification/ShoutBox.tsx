import React, { useEffect, useState } from 'react';
import { Megaphone, Send, Loader2, AlertCircle, CheckCircle2 } from 'lucide-react';
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
            setSuccess("Shout sent successfully! Check the ticker.");
            setMessage('');
            // Update local balance optimistically or re-fetch
            if (result.remaining_weekly !== undefined && balance) {
                setBalance({
                    ...balance,
                    weekly_shouts_remaining: result.remaining_weekly,
                    // Use server value if available, else fallback to manual calc
                    monthly_shouts_remaining: result.remaining_monthly ?? ((balance.monthly_shouts_remaining || 1) - 1)
                });
            } else {
                loadBalance();
            }
        } else {
            setError(result.error || "Failed to send shout.");
        }
        setSending(false);
    };

    if (loading) {
        return <div className="animate-pulse h-32 bg-slate-800 rounded-xl"></div>;
    }

    // Default balance if null (user hasn't interacted yet, assume full)
    const weekly = balance?.weekly_shouts_remaining ?? 3;
    const monthly = balance?.monthly_shouts_remaining ?? 10;
    const canShout = weekly > 0 && monthly > 0;

    return (
        <div className="bg-slate-800 border border-slate-700 rounded-xl p-6 relative overflow-hidden">
            {/* Background Decoration */}
            <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none">
                <Megaphone className="w-32 h-32 text-amber-500" />
            </div>

            <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                <Megaphone className="w-5 h-5 text-amber-500" />
                Free Weekly Shouts
            </h3>

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
                        placeholder={canShout ? "Type your message here..." : "No shouts remaining this week."}
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
                            Sending...
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
                        Resets automatically next week.
                    </p>
                )}
            </div>
        </div>
    );
};
