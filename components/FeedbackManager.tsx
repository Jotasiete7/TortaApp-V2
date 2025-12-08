import React, { useState, useEffect } from 'react';
import { FeedbackService } from '../services/FeedbackService';
import { CheckCircle2, Circle, Clock, MessageSquare, User, Filter, RefreshCw, AlertCircle } from 'lucide-react';

interface AdminFeedbackItem {
    id: string;
    user_id: string;
    type: 'bug' | 'feature' | 'general' | 'other';
    message: string;
    status: 'new' | 'in_progress' | 'resolved' | 'closed';
    created_at: string;
    reporter_nick: string;
    reporter_email: string;
}

export const FeedbackManager: React.FC = () => {
    const [feedback, setFeedback] = useState<AdminFeedbackItem[]>([]);
    const [loading, setLoading] = useState(false);
    const [filterStatus, setFilterStatus] = useState<string>('all');
    const [refreshTrigger, setRefreshTrigger] = useState(0);

    const fetchFeedback = async () => {
        setLoading(true);
        try {
            const data = await FeedbackService.getAdminFeedback();
            // @ts-ignore - types mismatch slightly between RPC result and strict interface but fields match
            setFeedback(data);
        } catch (error) {
            console.error('Error fetching feedback:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchFeedback();
    }, [refreshTrigger]);

    const handleUpdateStatus = async (id: string, newStatus: any) => {
        try {
            await FeedbackService.updateStatus(id, newStatus);
            // Optimistic update
            setFeedback(prev => prev.map(f => f.id === id ? { ...f, status: newStatus } : f));
        } catch (error) {
            alert('Failed to update status');
        }
    };

    const filteredFeedback = feedback.filter(f => filterStatus === 'all' || f.status === filterStatus);

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'new': return 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30';
            case 'in_progress': return 'text-amber-400 bg-amber-500/10 border-amber-500/30';
            case 'resolved': return 'text-blue-400 bg-blue-500/10 border-blue-500/30';
            case 'closed': return 'text-slate-400 bg-slate-500/10 border-slate-500/30';
            default: return 'text-slate-400';
        }
    };

    return (
        <div className="bg-slate-800 border border-slate-700 rounded-xl p-6 animate-fade-in shadow-xl">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
                <div>
                    <h3 className="text-xl font-bold text-white flex items-center gap-2">
                        <MessageSquare className="w-5 h-5 text-amber-500" />
                        User Feedback
                    </h3>
                    <p className="text-sm text-slate-400">Manage bugs and feature requests</p>
                </div>

                <div className="flex items-center gap-2">
                    <div className="relative">
                        <Filter className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                        <select
                            value={filterStatus}
                            onChange={(e) => setFilterStatus(e.target.value)}
                            className="bg-slate-900 border border-slate-700 text-slate-200 text-sm rounded-lg pl-9 pr-4 py-2 focus:ring-2 focus:ring-amber-500/50 outline-none appearance-none cursor-pointer hover:bg-slate-750 transition-colors"
                        >
                            <option value="all">All Status</option>
                            <option value="new">New</option>
                            <option value="in_progress">In Progress</option>
                            <option value="resolved">Resolved</option>
                            <option value="closed">Closed</option>
                        </select>
                    </div>
                    <button
                        onClick={() => setRefreshTrigger(p => p + 1)}
                        className="p-2 bg-slate-700 hover:bg-slate-600 text-slate-200 rounded-lg transition-all active:scale-95"
                        title="Refresh"
                    >
                        <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                    </button>
                </div>
            </div>

            {loading && feedback.length === 0 ? (
                <div className="flex justify-center py-12">
                    <div className="animate-spin w-8 h-8 border-4 border-amber-500 border-t-transparent rounded-full"></div>
                </div>
            ) : filteredFeedback.length === 0 ? (
                <div className="text-center py-12 bg-slate-900/50 rounded-lg border border-slate-700/50">
                    <div className="inline-flex p-4 bg-slate-800 rounded-full mb-3">
                        <MessageSquare className="w-8 h-8 text-slate-600" />
                    </div>
                    <p className="text-slate-400 font-medium">No feedback found.</p>
                    <p className="text-xs text-slate-500 mt-1">Waiting for users to submit reports.</p>
                </div>
            ) : (
                <div className="space-y-3">
                    {filteredFeedback.map((item) => (
                        <div key={item.id} className="bg-slate-900/80 border border-slate-700 rounded-lg p-4 transition-all hover:border-slate-600 hover:shadow-lg group">
                            <div className="flex justify-between items-start gap-4">
                                <div className="flex-1">
                                    <div className="flex items-center gap-2 mb-2 flex-wrap">
                                        <span className={`px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider rounded border ${getStatusColor(item.status)}`}>
                                            {item.status.replace('_', ' ')}
                                        </span>
                                        <span className={`px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider rounded border
                                            ${item.type === 'bug' ? 'text-rose-400 bg-rose-500/10 border-rose-500/30' :
                                                item.type === 'feature' ? 'text-cyan-400 bg-cyan-500/10 border-cyan-500/30' :
                                                    'text-slate-400 bg-slate-500/10 border-slate-500/30'}`}>
                                            {item.type}
                                        </span>
                                        <span className="text-xs text-slate-500 flex items-center gap-1 ml-auto sm:ml-0">
                                            <Clock className="w-3 h-3" />
                                            {new Date(item.created_at).toLocaleDateString()} {new Date(item.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                        </span>
                                    </div>

                                    <p className="text-slate-200 text-sm whitespace-pre-wrap leading-relaxed bg-slate-950/30 p-3 rounded border border-slate-800 mb-3">
                                        {item.message}
                                    </p>

                                    <div className="flex items-center gap-2 text-xs text-slate-400 bg-slate-800/50 py-1.5 px-3 rounded w-fit">
                                        <User className="w-3 h-3 text-amber-500" />
                                        <span className="font-mono text-amber-500 font-bold">{item.reporter_nick}</span>
                                        <span className="text-slate-600">|</span>
                                        <span className="font-mono opacity-50">{item.reporter_email}</span>
                                    </div>
                                </div>

                                <div className="flex flex-col gap-1 min-w-[120px]">
                                    <label className="text-[10px] font-medium text-slate-500 uppercase tracking-wider ml-1">Update Status</label>
                                    <select
                                        value={item.status}
                                        onChange={(e) => handleUpdateStatus(item.id, e.target.value)}
                                        className="bg-slate-800 border border-slate-600 text-slate-300 text-xs rounded p-2 focus:ring-2 focus:ring-amber-500/50 outline-none cursor-pointer hover:bg-slate-700 transition-colors"
                                    >
                                        <option value="new">New</option>
                                        <option value="in_progress">In Progress</option>
                                        <option value="resolved">Resolved</option>
                                        <option value="closed">Closed</option>
                                    </select>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};
