import React, { useEffect, useState } from 'react';
import { Megaphone, Send, Loader2, Info, X, Check, AlertCircle } from 'lucide-react';
import { ShoutService } from '../../services/shoutService';
import { ShoutBalance } from '../../types';

interface ShoutBoxCompactProps {
    userId: string;
}

export const ShoutBoxCompact: React.FC<ShoutBoxCompactProps> = ({ userId }) => {
    const [balance, setBalance] = useState<ShoutBalance | null>(null);
    const [message, setMessage] = useState('');
    const [loading, setLoading] = useState(true);
    const [sending, setSending] = useState(false);
    const [status, setStatus] = useState<{ type: 'error' | 'success', msg: string } | null>(null);

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
        setStatus(null);

        const result = await ShoutService.useFreeShout(message);

        if (result.success) {
            setStatus({ type: 'success', msg: 'Sent!' });
            setMessage('');
            setTimeout(() => setStatus(null), 3000);
            if (result.remaining_weekly !== undefined && balance) {
                setBalance({
                    ...balance,
                    weekly_shouts_remaining: result.remaining_weekly,
                });
            } else {
                loadBalance();
            }
        } else {
            setStatus({ type: 'error', msg: result.error || 'Failed' });
        }
        setSending(false);
    };

    if (loading) return <div className="h-12 bg-slate-800/50 rounded-xl animate-pulse" />;

    const weekly = balance?.weekly_shouts_remaining ?? 3;
    const canShout = weekly > 0;

    return (
        <div className="bg-slate-800/80 border border-slate-700 rounded-xl p-2 flex items-center gap-3 shadow-sm">
            {/* Status / Icon */}
            <div className="flex items-center gap-2 pl-2 border-r border-slate-700 pr-3">
                <Megaphone className={`w-4 h-4 ${canShout ? 'text-amber-500' : 'text-slate-500'}`} />
                <div className="flex flex-col leading-none">
                    <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Shouts</span>
                    <span className={`text-xs font-bold ${canShout ? 'text-white' : 'text-red-400'}`}>
                        {weekly} <span className="text-slate-500 font-normal">left</span>
                    </span>
                </div>
            </div>

            {/* Input */}
            <div className="flex-1 relative">
                <input
                    type="text"
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleShout()}
                    placeholder={canShout ? "Shout to the world..." : "No shouts available this week"}
                    disabled={!canShout || sending}
                    maxLength={100}
                    className="w-full bg-slate-900/50 border border-slate-700/50 rounded-lg pl-3 pr-20 py-1.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-amber-500/50 transition-colors disabled:opacity-50"
                />
                <div className="absolute right-1 top-1 flex items-center gap-1">
                     {status && (
                        <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${status.type === 'success' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-red-500/10 text-red-400'}`}>
                            {status.msg}
                        </span>
                    )}
                    <span className="text-[10px] text-slate-600 font-mono py-1 px-1">
                        {message.length}/100
                    </span>
                </div>
            </div>

            {/* Action */}
            <button
                onClick={handleShout}
                disabled={!canShout || !message.trim() || sending}
                className="bg-amber-500 hover:bg-amber-600 text-slate-900 p-2 rounded-lg font-bold transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
                {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
            </button>
        </div>
    );
};
