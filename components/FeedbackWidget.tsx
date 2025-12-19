import React, { useState } from 'react';
import { MessageSquarePlus, X, Send, Loader2, CheckCircle2 } from 'lucide-react';
import { FeedbackService, FeedbackData } from '../services/FeedbackService';

export const FeedbackWidget: React.FC = () => {
    const [isOpen, setIsOpen] = useState(false);
    const [type, setType] = useState<FeedbackData['type']>('bug');
    const [message, setMessage] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [success, setSuccess] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!message.trim()) return;

        setIsSubmitting(true);
        try {
            await FeedbackService.submitFeedback({ type, message });
            setSuccess(true);
            setTimeout(() => {
                setSuccess(false);
                setIsOpen(false);
                setMessage('');
                setType('bug');
            }, 2000);
        } catch (error) {
            console.error('Feedback error:', error);
            alert('Failed to send feedback. Please try again.');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <>
            {/* Floating Button - REFACTORED:
                - Neutral Color (Slate-700/800) instead of bright Amber.
                - Subtle hover state (Indigo/Purple).
                - Slightly smaller scale (w-12 h-12 instead of 14).
            */}
            <button
                onClick={() => setIsOpen(true)}
                className={`fixed bottom-6 right-6 w-12 h-12 flex items-center justify-center bg-slate-800 hover:bg-indigo-600 text-slate-300 hover:text-white rounded-full shadow-lg border border-slate-700 hover:border-indigo-500 transition-all duration-300 z-50 hover:scale-105 pointer-events-auto group ${isOpen ? 'rotate-90 scale-0 opacity-0' : 'scale-100 opacity-100'}`}
                title="Send Feedback"
            >
                <div className="relative">
                    <MessageSquarePlus className="w-5 h-5 group-hover:drop-shadow-[0_0_8px_rgba(255,255,255,0.5)] transition-all" />
                </div>
            </button>

            {/* Popup Form */}
            {isOpen && (
                <div className="fixed bottom-6 right-6 w-80 bg-slate-900 border border-slate-700 rounded-xl shadow-2xl z-50 animate-in slide-in-from-bottom-10 fade-in duration-200 overflow-hidden pointer-events-auto">
                    {/* Header */}
                    <div className="flex justify-between items-center p-4 bg-slate-950/50 border-b border-slate-800">
                        <h3 className="text-white font-bold flex items-center gap-2 text-sm">
                            <MessageSquarePlus className="w-4 h-4 text-indigo-500" />
                            Send Feedback
                        </h3>
                        <button
                            onClick={() => setIsOpen(false)}
                            className="text-slate-500 hover:text-white transition-colors"
                        >
                            <X className="w-4 h-4" />
                        </button>
                    </div>

                    {/* Content */}
                    <div className="p-4 bg-slate-900">
                        {success ? (
                            <div className="flex flex-col items-center justify-center py-8 text-emerald-400 animate-in zoom-in fade-in">
                                <CheckCircle2 className="w-12 h-12 mb-3" />
                                <p className="font-bold">Thanks!</p>
                            </div>
                        ) : (
                            <form onSubmit={handleSubmit} className="space-y-4">
                                <div>
                                    <label className="block text-[10px] uppercase font-bold text-slate-500 mb-1.5 tracking-wider">Type</label>
                                    <div className="grid grid-cols-2 gap-2">
                                        {(['bug', 'feature', 'general', 'other'] as const).map((t) => (
                                            <button
                                                key={t}
                                                type="button"
                                                onClick={() => setType(t)}
                                                className={`px-2 py-1.5 text-xs rounded-lg border transition-all capitalize font-medium
                                                    ${type === t
                                                        ? 'bg-indigo-500/10 border-indigo-500 text-indigo-400'
                                                        : 'bg-slate-800 border-slate-700 text-slate-400 hover:border-slate-600 hover:text-slate-300'
                                                    }`}
                                            >
                                                {t}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-[10px] uppercase font-bold text-slate-500 mb-1.5 tracking-wider">Message</label>
                                    <textarea
                                        value={message}
                                        onChange={(e) => setMessage(e.target.value)}
                                        placeholder="What's on your mind?"
                                        className="w-full bg-slate-950 border border-slate-800 rounded-lg p-3 text-sm text-slate-200 placeholder-slate-600 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/50 min-h-[100px] resize-none"
                                        required
                                    />
                                </div>

                                <button
                                    type="submit"
                                    disabled={isSubmitting || !message.trim()}
                                    className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold py-2 px-4 rounded-lg flex items-center justify-center gap-2 transition-all active:scale-95 shadow-lg shadow-indigo-500/20"
                                >
                                    {isSubmitting ? (
                                        <Loader2 className="w-4 h-4 animate-spin" />
                                    ) : (
                                        <>
                                            <Send className="w-3.5 h-3.5" />
                                            Send Feedback
                                        </>
                                    )}
                                </button>
                            </form>
                        )}
                    </div>
                </div>
            )}
        </>
    );
};
