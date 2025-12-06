import React, { useState, useEffect } from 'react';
import { Shield, Key, Copy, CheckCircle, AlertCircle, RefreshCw, User, Lock } from 'lucide-react';
import { IdentityService, UserNick } from '../../services/identity';

interface NickVerificationProps {
    onSelectProfile?: (nick: string) => void;
}

export const NickVerification: React.FC<NickVerificationProps> = ({ onSelectProfile }) => {
    const [nicks, setNicks] = useState<UserNick[]>([]);
    const [inputNick, setInputNick] = useState('');
    const [loading, setLoading] = useState(false);
    const [generating, setGenerating] = useState(false);

    useEffect(() => {
        loadNicks();
    }, []);

    const loadNicks = async () => {
        setLoading(true);
        const data = await IdentityService.getMyNicks();
        setNicks(data);
        setLoading(false);
    };

    const handleGenerateToken = async () => {
        if (!inputNick.trim()) return;
        setGenerating(true);

        const token = await IdentityService.generateToken(inputNick.trim());
        if (token) {
            await loadNicks();
            setInputNick('');
        }

        setGenerating(false);
    };

    const copyToClipboard = (text: string) => {
        navigator.clipboard.writeText(text);
        // Could add a toast here
    };

    const hasVerifiedNick = nicks.some(nick => nick.is_verified);

    return (
        <div className="bg-slate-800 border border-slate-700 rounded-xl p-6 animate-fade-in">
            <div className="flex items-center gap-3 mb-6">
                <div className="p-3 bg-indigo-500/10 rounded-lg">
                    <Shield className="w-6 h-6 text-indigo-500" />
                </div>
                <div>
                    <h2 className="text-xl font-bold text-white">Identity Verification</h2>
                    <p className="text-sm text-slate-400">Link your game character to your account to earn badges.</p>
                </div>
            </div>

            {/* Input Section - HIDDEN if already verified */}
            {!hasVerifiedNick ? (
                <div className="flex gap-2 mb-8">
                    <input
                        type="text"
                        value={inputNick}
                        onChange={(e) => setInputNick(e.target.value)}
                        placeholder="Enter your exact in-game nick..."
                        className="flex-1 bg-slate-900 border border-slate-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-indigo-500 transition-colors"
                    />
                    <button
                        onClick={handleGenerateToken}
                        disabled={generating || !inputNick.trim()}
                        className="bg-indigo-600 hover:bg-indigo-500 text-white px-6 py-3 rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                    >
                        {generating ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Key className="w-4 h-4" />}
                        Generate Token
                    </button>
                </div>
            ) : (
                <div className="mb-8 p-4 bg-emerald-500/10 border border-emerald-500/30 rounded-lg flex items-center gap-3">
                    <div className="p-2 bg-emerald-500/20 rounded-full">
                        <CheckCircle className="w-5 h-5 text-emerald-400" />
                    </div>
                    <div>
                        <h4 className="font-bold text-emerald-400">Identity Verified</h4>
                        <p className="text-sm text-slate-400">You have successfully linked your character. Max identities reached for now.</p>
                    </div>
                </div>
            )}

            {/* Nicks List */}
            <div className="space-y-4">
                {loading ? (
                    <div className="text-center text-slate-500 py-4">Loading linked identities...</div>
                ) : nicks.length === 0 ? (
                    <div className="text-center p-8 border border-dashed border-slate-700 rounded-lg">
                        <p className="text-slate-400">No identities linked yet.</p>
                    </div>
                ) : (
                    nicks.map((nick) => (
                        <div key={nick.id} className="bg-slate-900/50 border border-slate-700 rounded-lg p-4">
                            <div className="flex justify-between items-start">
                                <div>
                                    <h3 className="text-lg font-bold text-white flex items-center gap-2">
                                        {nick.game_nick}
                                        {nick.is_verified ? (
                                            <>
                                                <span className="bg-emerald-500/20 text-emerald-400 text-xs px-2 py-0.5 rounded border border-emerald-500/50 flex items-center gap-1">
                                                    <CheckCircle className="w-3 h-3" /> Verified
                                                </span>
                                                {onSelectProfile && (
                                                    <button
                                                        onClick={() => onSelectProfile(nick.game_nick)}
                                                        className="ml-2 text-xs bg-indigo-600 hover:bg-indigo-500 text-white px-2 py-1 rounded transition-colors flex items-center gap-1"
                                                    >
                                                        <User className="w-3 h-3" /> View Profile
                                                    </button>
                                                )}
                                            </>
                                        ) : (
                                            <span className="bg-amber-500/20 text-amber-400 text-xs px-2 py-0.5 rounded border border-amber-500/50 flex items-center gap-1">
                                                <AlertCircle className="w-3 h-3" /> Pending Verification
                                            </span>
                                        )}
                                    </h3>

                                    {!nick.is_verified && nick.verification_token && (
                                        <div className="mt-3 space-y-2">
                                            <p className="text-sm text-slate-400">
                                                1. Copy this token:
                                            </p>
                                            <div className="flex items-center gap-2">
                                                <code className="bg-slate-950 px-3 py-1.5 rounded text-indigo-400 font-mono border border-slate-800">
                                                    {nick.verification_token}
                                                </code>
                                                <button
                                                    onClick={() => copyToClipboard(nick.verification_token!)}
                                                    className="p-1.5 hover:bg-slate-700 rounded text-slate-400 hover:text-white transition-colors"
                                                    title="Copy Token"
                                                >
                                                    <Copy className="w-4 h-4" />
                                                </button>
                                            </div>
                                            <p className="text-sm text-slate-400">
                                                2. Paste it in the game chat (Local or Trade).
                                            </p>
                                            <p className="text-sm text-slate-400">
                                                3. Upload the log file containing that message.
                                            </p>
                                            <p className="text-xs text-slate-500 mt-1">
                                                Expires at: {new Date(nick.token_expires_at!).toLocaleTimeString()}
                                            </p>
                                        </div>
                                    )}

                                    {nick.is_verified && (
                                        <p className="text-sm text-slate-500 mt-1">
                                            Identity confirmed. Badges and stats are now being tracked.
                                        </p>
                                    )}
                                </div>

                                <button
                                    onClick={loadNicks}
                                    className="text-slate-500 hover:text-white transition-colors"
                                    title="Refresh Status"
                                >
                                    <RefreshCw className="w-4 h-4" />
                                </button>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
};
