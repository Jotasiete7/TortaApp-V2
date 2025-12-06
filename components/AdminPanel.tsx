import React, { useState, useEffect } from 'react';
import { supabase } from '../services/supabase';
import { useAuth } from '../contexts/AuthContext';
import { ProtectedAdmin } from './auth/ProtectedAdmin';
import { Megaphone, Plus, Trash2, Clock, Database, Smile, Gauge, Search, AlertTriangle, Trash, HardDrive, UserCheck, Settings } from 'lucide-react';
import { EmojiPicker } from './EmojiPicker';
import { BulkDataUploader } from '../services/logProcessing';
import { IntelligenceService, DbUsageStats } from '../services/intelligence';
import { AdminUserManager } from './AdminUserManager';
import { AdminSettings } from './AdminSettings';
import { AdminAnomalyDetective } from './AdminAnomalyDetective';

// Interface estendida para mensagens
interface TickerMessageExtended {
    id: number;
    text: string;
    color: string;
    paid: boolean;
    created_at: string;
    expires_at?: string | null;
    created_by?: string | null;
    created_by_nick?: string | null;
    user_first_badge_id?: string | null;
}

export const AdminPanel: React.FC = () => {
    return (
        <ProtectedAdmin>
            <AdminPanelContent />
        </ProtectedAdmin>
    );
};

const AdminPanelContent: React.FC = () => {
    const { user } = useAuth();
    const [activeTab, setActiveTab] = useState<'ticker' | 'upload' | 'users' | 'settings' | 'detective'>('ticker');
    const [messages, setMessages] = useState<TickerMessageExtended[]>([]);
    const [newMessage, setNewMessage] = useState('');
    const [color, setColor] = useState<'green' | 'red' | 'yellow' | 'cyan' | 'purple'>('green');
    const [isPaid, setIsPaid] = useState(false);
    const [expiresIn, setExpiresIn] = useState<number | null>(null);
    const [loading, setLoading] = useState(false);
    const [showEmojiPicker, setShowEmojiPicker] = useState(false);
    const [tickerSpeed, setTickerSpeed] = useState<number>(() => {
        const saved = localStorage.getItem('ticker_speed');
        return saved ? parseFloat(saved) : 1;
    });

    // NOVOS ESTADOS - Moderação
    const [searchTerm, setSearchTerm] = useState('');
    const [filterType, setFilterType] = useState<'all' | 'admin' | 'shout'>('all');
    const [cleanupLoading, setCleanupLoading] = useState(false);
    const [dbUsage, setDbUsage] = useState<DbUsageStats | null>(null);

    useEffect(() => {
        fetchMessages();
        fetchDbUsage();

        // Realtime subscription
        const channel = supabase
            .channel('admin-ticker-updates')
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

    const fetchMessages = async () => {
        const { data, error } = await supabase
            .from('ticker_messages')
            .select('*')
            .order('created_at', { ascending: false });

        if (!error && data) {
            setMessages(data);
        }
    };

    const fetchDbUsage = async () => {
        const usage = await IntelligenceService.getDbUsage();
        setDbUsage(usage);
    };

    const handleAddMessage = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newMessage.trim() || !user) return;

        setLoading(true);
        try {
            const expiresAt = expiresIn
                ? new Date(Date.now() + expiresIn * 24 * 60 * 60 * 1000).toISOString()
                : null;

            const { error } = await supabase
                .from('ticker_messages')
                .insert({
                    text: newMessage.trim(),
                    color,
                    paid: isPaid,
                    expires_at: expiresAt,
                    created_by: user.id
                });

            if (error) throw error;

            // Reset form
            setNewMessage('');
            setColor('green');
            setIsPaid(false);
            setExpiresIn(null);
        } catch (err: any) {
            alert('Error adding message: ' + err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleDeleteMessage = async (id: number) => {
        if (!confirm('Delete this message?')) return;

        const { error } = await supabase
            .from('ticker_messages')
            .delete()
            .eq('id', id);

        if (error) {
            alert('Error deleting message: ' + error.message);
        }
    };

    // NOVA FUNÇÃO - Cleanup de shouts expirados
    const handleCleanupExpired = async () => {
        if (!confirm('Delete all expired shouts? This cannot be undone.')) return;

        setCleanupLoading(true);
        try {
            const { data, error } = await supabase.rpc('cleanup_expired_shouts');

            if (error) throw error;

            if (data && data.length > 0) {
                alert(`✅ ${data[0].message}`);
                fetchMessages();
            }
        } catch (err: any) {
            alert('Error cleaning up: ' + err.message);
        } finally {
            setCleanupLoading(false);
        }
    };

    const handleSpeedChange = (newSpeed: number) => {
        setTickerSpeed(newSpeed);
        localStorage.setItem('ticker_speed', newSpeed.toString());
        // Trigger storage event for cross-tab sync
        window.dispatchEvent(new StorageEvent('storage', {
            key: 'ticker_speed',
            newValue: newSpeed.toString()
        }));
    };

    const colorOptions = [
        { value: 'green', label: 'Green', class: 'bg-emerald-500' },
        { value: 'red', label: 'Red', class: 'bg-rose-500' },
        { value: 'yellow', label: 'Yellow', class: 'bg-yellow-500' },
        { value: 'cyan', label: 'Cyan', class: 'bg-cyan-500' },
        { value: 'purple', label: 'Purple', class: 'bg-purple-500' }
    ];

    // FILTROS E ESTATÍSTICAS
    const filteredMessages = messages.filter(msg => {
        // Filtro por tipo
        if (filterType === 'admin' && msg.created_by_nick) return false;
        if (filterType === 'shout' && !msg.created_by_nick) return false;

        // Filtro por busca de texto
        if (searchTerm && !msg.text.toLowerCase().includes(searchTerm.toLowerCase())) {
            return false;
        }

        return true;
    });

    const stats = {
        total: messages.length,
        admin: messages.filter(m => !m.created_by_nick).length,
        shouts: messages.filter(m => m.created_by_nick).length,
        expired: messages.filter(m => m.expires_at && new Date(m.expires_at) < new Date()).length
    };

    return (
        <div className="max-w-4xl mx-auto space-y-8 animate-fade-in mb-24">
            {/* Header */}
            <div className="text-center space-y-2">
                <div className="inline-flex p-4 bg-amber-500/10 rounded-full mb-2">
                    {activeTab === 'ticker' ? (
                        <Megaphone className="w-10 h-10 text-amber-400" />
                    ) : (
                        <Database className="w-10 h-10 text-amber-400" />
                    )}
                </div>
                <h2 className="text-3xl font-bold text-white">Admin Dashboard</h2>
                <p className="text-slate-400">Manage application data and announcements</p>
            </div>

            {/* Database Health Status - Monitor always visible */}
            {dbUsage && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
                    {/* Storage Card */}
                    <div className="bg-slate-800 border border-slate-700 rounded-xl p-4 flex items-center justify-between relative overflow-hidden group">
                        <div className="absolute right-0 top-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                            <Database className="w-16 h-16 text-emerald-500" />
                        </div>
                        <div className="flex-1">
                            <p className="text-slate-400 text-xs font-medium uppercase tracking-wider mb-1">Database Storage</p>
                            <h3 className="text-2xl font-bold text-white">
                                {(dbUsage.total_size_bytes / 1024 / 1024).toFixed(1)} <span className="text-sm font-normal text-slate-500">MB</span>
                            </h3>
                            <div className="flex items-center gap-2 mt-2 w-full pr-4">
                                <div className="flex-1 h-1.5 bg-slate-700 rounded-full overflow-hidden">
                                    <div
                                        className={`h-full rounded-full transition-all duration-1000 ${(dbUsage.total_size_bytes / dbUsage.limit_bytes) > 0.8 ? 'bg-rose-500' : 'bg-emerald-500'
                                            }`}
                                        style={{ width: `${Math.min(100, (dbUsage.total_size_bytes / dbUsage.limit_bytes) * 100)}%` }}
                                    />
                                </div>
                                <span className={`text-xs font-bold ${(dbUsage.total_size_bytes / dbUsage.limit_bytes) > 0.8 ? 'text-rose-400' : 'text-emerald-400'
                                    }`}>
                                    {((dbUsage.total_size_bytes / dbUsage.limit_bytes) * 100).toFixed(1)}%
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Records Card */}
                    <div className="bg-slate-800 border border-slate-700 rounded-xl p-4 flex items-center justify-between relative overflow-hidden group">
                        <div className="absolute right-0 top-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                            <Search className="w-16 h-16 text-amber-500" />
                        </div>
                        <div>
                            <p className="text-slate-400 text-xs font-medium uppercase tracking-wider mb-1">Indexed Items</p>
                            <h3 className="text-2xl font-bold text-white">
                                {(dbUsage.trade_logs_count / 1000).toFixed(1)}k
                            </h3>
                            <p className="text-xs text-slate-500 mt-1">Trade records processed</p>
                        </div>
                        <div className="bg-slate-900/50 p-2 rounded-lg border border-slate-700">
                            <Database className="w-5 h-5 text-amber-500" />
                        </div>
                    </div>

                    {/* Users Card */}
                    <div className="bg-slate-800 border border-slate-700 rounded-xl p-4 flex items-center justify-between relative overflow-hidden group">
                        <div className="absolute right-0 top-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                            <Smile className="w-16 h-16 text-cyan-500" />
                        </div>
                        <div>
                            <p className="text-slate-400 text-xs font-medium uppercase tracking-wider mb-1">Community</p>
                            <h3 className="text-2xl font-bold text-white">
                                {dbUsage.users_count}
                            </h3>
                            <p className="text-xs text-slate-500 mt-1">Registered accounts</p>
                        </div>
                        <div className="bg-slate-900/50 p-2 rounded-lg border border-slate-700">
                            <Smile className="w-5 h-5 text-cyan-500" />
                        </div>
                    </div>
                </div>
            )}

            {/* Tab Navigation */}
            <div className="flex justify-center gap-4 border-b border-slate-700 pb-1 mb-6">
                <button
                    onClick={() => setActiveTab('ticker')}
                    className={`px-6 py-3 font-medium text-sm transition-all border-b-2 ${activeTab === 'ticker'
                        ? 'border-amber-500 text-amber-500'
                        : 'border-transparent text-slate-400 hover:text-slate-200'
                        }`}
                >
                    <div className="flex items-center gap-2">
                        <Megaphone className="w-4 h-4" />
                        News Ticker
                    </div>
                </button>
                <button
                    onClick={() => setActiveTab('users')}
                    className={`px-6 py-3 font-medium text-sm transition-all border-b-2 ${activeTab === 'users'
                        ? 'border-amber-500 text-amber-500'
                        : 'border-transparent text-slate-400 hover:text-slate-200'
                        }`}
                >
                    <div className="flex items-center gap-2">
                        <UserCheck className="w-4 h-4" />
                        Users
                    </div>
                </button>
                <button
                    onClick={() => setActiveTab('upload')}
                    className={`px-6 py-3 font-medium text-sm transition-all border-b-2 ${activeTab === 'upload'
                        ? 'border-amber-500 text-amber-500'
                        : 'border-transparent text-slate-400 hover:text-slate-200'
                        }`}
                >
                    <div className="flex items-center gap-2">
                        <Database className="w-4 h-4" />
                        Bulk Upload
                    </div>
                </button>
                <button
                    onClick={() => setActiveTab('settings')}
                    className={`px-6 py-3 font-medium text-sm transition-all border-b-2 ${activeTab === 'settings'
                        ? 'border-amber-500 text-amber-500'
                        : 'border-transparent text-slate-400 hover:text-slate-200'
                        }`}
                >
                    <div className="flex items-center gap-2">
                        <Settings className="w-4 h-4" />
                        Settings
                    </div>
                </button>
                <button
                    onClick={() => setActiveTab('detective')}
                    className={`px-6 py-3 font-medium text-sm transition-all border-b-2 ${activeTab === 'detective'
                        ? 'border-rose-500 text-rose-500'
                        : 'border-transparent text-slate-400 hover:text-slate-200'
                        }`}
                >
                    <div className="flex items-center gap-2">
                        <AlertTriangle className="w-4 h-4" />
                        Detective
                    </div>
                </button>
            </div>

            {activeTab === 'users' ? (
                <div className="animate-fade-in">
                    <AdminUserManager />
                </div>
            ) : activeTab === 'settings' ? (
                <div className="animate-fade-in">
                    <AdminSettings />
                </div>
            ) : activeTab === 'detective' ? (
                <div className="animate-fade-in">
                    <AdminAnomalyDetective />
                </div>
            ) : activeTab === 'upload' ? (
                <div className="animate-fade-in">
                    <BulkDataUploader />
                </div>
            ) : (
                <div className="space-y-8 animate-fade-in">
                    {/* Ticker Speed Control */}
                    <div className="bg-slate-800 border border-slate-700 rounded-xl p-6">
                        <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                            <Gauge className="w-5 h-5 text-amber-400" />
                            Ticker Speed Control
                        </h3>

                        <div className="space-y-4">
                            {/* Speed Slider */}
                            <div className="space-y-2">
                                <div className="flex items-center justify-between">
                                    <label className="text-sm font-medium text-slate-300">Speed Multiplier</label>
                                    <span className="text-lg font-bold text-amber-400">{tickerSpeed.toFixed(1)}x</span>
                                </div>
                                <input
                                    type="range"
                                    min="0.5"
                                    max="3"
                                    step="0.1"
                                    value={tickerSpeed}
                                    onChange={(e) => handleSpeedChange(parseFloat(e.target.value))}
                                    className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer"
                                />
                                <div className="flex justify-between text-xs text-slate-500">
                                    <span>0.5x (Slow)</span>
                                    <span>1.0x (Normal)</span>
                                    <span>3.0x (Fast)</span>
                                </div>
                            </div>

                            {/* Quick Presets */}
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-slate-300">Quick Presets</label>
                                <div className="grid grid-cols-5 gap-2">
                                    {[0.5, 1, 1.5, 2, 3].map((preset) => (
                                        <button
                                            key={preset}
                                            onClick={() => handleSpeedChange(preset)}
                                            className={`py2 px-3 rounded-lg font-medium text-sm transition-all ${tickerSpeed === preset
                                                ? 'bg-amber-600 text-white shadow-lg shadow-amber-900/20'
                                                : 'bg-slate-900 text-slate-400 hover:bg-slate-700 hover:text-white border border-slate-700'
                                                }`}
                                        >
                                            {preset}x
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Add Message Form */}
                    <div className="bg-slate-800 border border-slate-700 rounded-xl p-6">
                        <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                            <Plus className="w-5 h-5 text-amber-400" />
                            Add New Message
                        </h3>

                        <form onSubmit={handleAddMessage} className="space-y-4">
                            {/* Message Text */}
                            <div className="space-y-2 relative">
                                <label className="text-sm font-medium text-slate-300">Message Text</label>
                                <input
                                    type="text"
                                    value={newMessage}
                                    onChange={(e) => setNewMessage(e.target.value)}
                                    placeholder="Enter ticker message..."
                                    required
                                    maxLength={200}
                                    className="w-full p-3 bg-slate-900 border border-slate-700 rounded-lg text-white placeholder:text-slate-600 focus:ring-2 focus:ring-amber-500/50 outline-none pr-10"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                                    className="absolute right-2 top-9 p-1.5 text-slate-400 hover:text-amber-400 hover:bg-slate-800 rounded-lg transition-colors"
                                >
                                    <Smile className="w-5 h-5" />
                                </button>
                                {showEmojiPicker && (
                                    <div className="absolute right-0 top-full mt-2 z-50">
                                        <EmojiPicker
                                            onSelect={(emoji) => {
                                                setNewMessage(prev => prev + emoji.emoji);
                                                setShowEmojiPicker(false);
                                            }}
                                            onClose={() => setShowEmojiPicker(false)}
                                        />
                                    </div>
                                )}
                                <div className="text-xs text-slate-500 text-right">
                                    {newMessage.length}/200 characters
                                </div>
                            </div>

                            {/* Color Selection */}
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-slate-300">Color</label>
                                <div className="grid grid-cols-5 gap-2">
                                    {colorOptions.map((opt) => (
                                        <button
                                            key={opt.value}
                                            type="button"
                                            onClick={() => setColor(opt.value as any)}
                                            className={`p-3 rounded-lg border-2 transition-all ${color === opt.value
                                                ? 'border-amber-500 scale-105'
                                                : 'border-slate-700 hover:border-slate-600'
                                                }`}
                                        >
                                            <div className={`w-full h-8 ${opt.class} rounded`}></div>
                                            <div className="text-xs text-slate-400 mt-1">{opt.label}</div>
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Paid & Expires */}
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <label className="flex items-center gap-2 cursor-pointer">
                                        <input
                                            type="checkbox"
                                            checked={isPaid}
                                            onChange={(e) => setIsPaid(e.target.checked)}
                                            className="w-4 h-4 rounded border-slate-700 bg-slate-900 text-amber-600 focus:ring-amber-500/50"
                                        />
                                        <span className="text-sm font-medium text-slate-300">Paid Announcement</span>
                                    </label>
                                    <p className="text-xs text-slate-500">Shows "PAID" badge</p>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-slate-300 flex items-center gap-2">
                                        <Clock className="w-4 h-4" />
                                        Expires In (days)
                                    </label>
                                    <input
                                        type="number"
                                        value={expiresIn || ''}
                                        onChange={(e) => setExpiresIn(e.target.value ? parseInt(e.target.value) : null)}
                                        placeholder="Never"
                                        min="1"
                                        max="365"
                                        className="w-full p-2 bg-slate-900 border border-slate-700 rounded-lg text-white placeholder:text-slate-600 focus:ring-2 focus:ring-amber-500/50 outline-none"
                                    />
                                </div>
                            </div>

                            {/* Submit Button */}
                            <button
                                type="submit"
                                disabled={loading || !newMessage.trim()}
                                className="w-full py-3 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-amber-900/20"
                            >
                                {loading ? 'Adding...' : 'Add to Global Ticker'}
                            </button>
                        </form>
                    </div>

                    {/* NOVA SEÇÃO - Moderação de Mensagens */}
                    <div className="bg-slate-800 border border-slate-700 rounded-xl p-6">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-xl font-bold text-white">
                                Message Moderation
                            </h3>

                            {/* Botão Cleanup */}
                            <button
                                onClick={handleCleanupExpired}
                                disabled={cleanupLoading || stats.expired === 0}
                                className="flex items-center gap-2 px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white text-sm font-medium rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                <Trash className="w-4 h-4" />
                                {cleanupLoading ? 'Cleaning...' : `Delete Expired (${stats.expired})`}
                            </button>
                        </div>

                        {/* Estatísticas */}
                        <div className="grid grid-cols-4 gap-4 mb-6">
                            <div className="bg-slate-900/50 border border-slate-700 rounded-lg p-3">
                                <div className="text-2xl font-bold text-white">{stats.total}</div>
                                <div className="text-xs text-slate-400">Total Messages</div>
                            </div>
                            <div className="bg-amber-500/10 border border-amber-500/30 rounded-lg p-3">
                                <div className="text-2xl font-bold text-amber-400">{stats.admin}</div>
                                <div className="text-xs text-slate-400">Admin Posts</div>
                            </div>
                            <div className="bg-cyan-500/10 border border-cyan-500/30 rounded-lg p-3">
                                <div className="text-2xl font-bold text-cyan-400">{stats.shouts}</div>
                                <div className="text-xs text-slate-400">User Shouts</div>
                            </div>
                            <div className="bg-rose-500/10 border border-rose-500/30 rounded-lg p-3">
                                <div className="text-2xl font-bold text-rose-400">{stats.expired}</div>
                                <div className="text-xs text-slate-400">Expired</div>
                            </div>
                        </div>

                        {/* Filtros */}
                        <div className="grid grid-cols-2 gap-4 mb-4">
                            {/* Busca de Texto */}
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                <input
                                    type="text"
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    placeholder="Search messages..."
                                    className="w-full pl-10 pr-4 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white placeholder:text-slate-600 focus:ring-2 focus:ring-amber-500/50 outline-none text-sm"
                                />
                            </div>

                            {/* Filtro por Tipo */}
                            <select
                                value={filterType}
                                onChange={(e) => setFilterType(e.target.value as any)}
                                className="px-4 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white focus:ring-2 focus:ring-amber-500/50 outline-none text-sm"
                            >
                                <option value="all">All Messages</option>
                                <option value="admin">Admin Only</option>
                                <option value="shout">Shouts Only</option>
                            </select>
                        </div>

                        {/* Lista de Mensagens Filtradas */}
                        {filteredMessages.length === 0 ? (
                            <div className="text-center py-12 text-slate-500">
                                <Megaphone className="w-12 h-12 mx-auto mb-2 opacity-20" />
                                <p>No messages found matching your filters.</p>
                            </div>
                        ) : (
                            <div className="space-y-2">
                                {filteredMessages.map((msg) => {
                                    const isExpired = msg.expires_at && new Date(msg.expires_at) < new Date();
                                    const isShout = !!msg.created_by_nick;
                                    const colorClass = {
                                        green: 'text-emerald-400',
                                        red: 'text-rose-400',
                                        yellow: 'text-yellow-400',
                                        cyan: 'text-cyan-400',
                                        purple: 'text-purple-400'
                                    }[msg.color] || 'text-white';

                                    return (
                                        <div
                                            key={msg.id}
                                            className={`p-4 bg-slate-900 rounded-lg border ${isExpired ? 'border-slate-800 opacity-50' : 'border-slate-700'
                                                } flex items-start justify-between gap-4`}
                                        >
                                            <div className="flex-1">
                                                <div className="flex items-center gap-2 mb-2">
                                                    {/* Badge de Tipo */}
                                                    {isShout ? (
                                                        <span className="px-2 py-0.5 bg-cyan-500/20 border border-cyan-500/50 text-cyan-400 text-xs font-bold rounded flex items-center gap-1">
                                                            <Megaphone className="w-3 h-3" />
                                                            SHOUT: {msg.created_by_nick}
                                                        </span>
                                                    ) : (
                                                        <span className="px-2 py-0.5 bg-amber-500 text-black text-xs font-bold rounded">
                                                            ADMIN
                                                        </span>
                                                    )}

                                                    {msg.paid && !isShout && (
                                                        <span className="px-2 py-0.5 bg-amber-500/20 border border-amber-500/50 text-amber-400 text-xs font-bold rounded">
                                                            PAID
                                                        </span>
                                                    )}
                                                    {isExpired && (
                                                        <span className="px-2 py-0.5 bg-rose-500/20 border border-rose-500/50 text-rose-400 text-xs font-bold rounded flex items-center gap-1">
                                                            <AlertTriangle className="w-3 h-3" />
                                                            EXPIRED
                                                        </span>
                                                    )}
                                                </div>
                                                <p className={`${colorClass} font-medium mb-2`}>{msg.text}</p>
                                                <div className="flex items-center gap-4 text-xs text-slate-500">
                                                    <span>ID: {msg.id}</span>
                                                    <span>Created: {new Date(msg.created_at).toLocaleDateString()}</span>
                                                    {msg.expires_at && (
                                                        <span>Expires: {new Date(msg.expires_at).toLocaleDateString()}</span>
                                                    )}
                                                </div>
                                            </div>
                                            <button
                                                onClick={() => handleDeleteMessage(msg.id)}
                                                className="p-2 text-rose-400 hover:bg-rose-500/10 rounded-lg transition"
                                                title="Delete message"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};
