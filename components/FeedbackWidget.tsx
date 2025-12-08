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
            {/* Floating Button */}
            <button
                onClick={() => setIsOpen(true)}
                className={`fixed bottom-6 right-6 p-4 bg-amber-500 hover:bg-amber-400 text-slate-900 rounded-full shadow-lg transition-all duration-300 z-50 hover:scale-110 ${isOpen ? 'rotate-90 scale-0 opacity-0' : 'scale-100 opacity-100'}`}
                title="Send Feedback"
            >
                <MessageSquarePlus className="w-6 h-6" />
            </button>

            {/* Popup Form */}
            {isOpen && (
                <div className="fixed bottom-6 right-6 w-80 bg-slate-800 border border-slate-700 rounded-xl shadow-2xl z-50 animate-in slide-in-from-bottom-10 fade-in duration-200 overflow-hidden">
                    {/* Header */}
                    <div className="flex justify-between items-center p-4 bg-slate-900/50 border-b border-slate-700">
                        <h3 className="text-white font-bold flex items-center gap-2">
                            <MessageSquarePlus className="w-5 h-5 text-amber-500" />
                            Send Feedback
                        </h3>
                        <button
                            onClick={() => setIsOpen(false)}
                            className="text-slate-400 hover:text-white transition-colors"
                        >
                            <X className="w-5 h-5" />
                        </button>
                    </div>

                    {/* Content */}
                    <div className="p-4">
                        {success ? (
                            <div className="flex flex-col items-center justify-center py-8 text-emerald-400 animate-in zoom-in fade-in">
                                <CheckCircle2 className="w-16 h-16 mb-4" />
                                <p className="font-bold">Thank You!</p>
                                <p className="text-sm text-slate-400">Feedback received.</p>
                            </div>
                        ) : (
                            <form onSubmit={handleSubmit} className="space-y-4">
                                <div>
                                    <label className="block text-xs font-medium text-slate-400 mb-1">Type</label>
                                    <div className="grid grid-cols-2 gap-2">
                                        {(['bug', 'feature', 'general', 'other'] as const).map((t) => (
                                            <button
                                                key={t}
                                                type="button"
                                                onClick={() => setType(t)}
                                                className={`px-2 py-1.5 text-xs rounded border transition-all capitalize
                                                    ${type === t
                                                        ? 'bg-amber-500/20 border-amber-500 text-amber-400 font-bold'
                                                        : 'bg-slate-900 border-slate-700 text-slate-400 hover:border-slate-600'
                                                    }`}
                                            >
                                                {t}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-xs font-medium text-slate-400 mb-1">Message</label>
                                    <textarea
                                        value={message}
                                        onChange={(e) => setMessage(e.target.value)}
                                        placeholder="Describe the issue or idea..."
                                        className="w-full bg-slate-900 border border-slate-700 rounded-lg p-3 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-amber-500 min-h-[100px] resize-none"
                                        required
                                    />
                                </div>

                                <button
                                    type="submit"
                                    disabled={isSubmitting || !message.trim()}
                                    className="w-full bg-amber-500 hover:bg-amber-400 disabled:opacity-50 disabled:cursor-not-allowed text-slate-900 font-bold py-2 px-4 rounded-lg flex items-center justify-center gap-2 transition-all active:scale-95"
                                >
                                    {isSubmitting ? (
                                        <Loader2 className="w-4 h-4 animate-spin" />
                                    ) : (
                                        <>
                                            <Send className="w-4 h-4" />
                                            Submit
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
