import React, { useState, useEffect } from 'react';
import { supabase } from '../services/supabase';
import { Search, Shield, Ban, Gift, UserCheck, MoreVertical, Key, Trash, AlertTriangle, X } from 'lucide-react';

interface UserData {
    id: string;
    email: string;
    created_at: string;
    last_sign_in_at: string;
    banned_until: string | null;
    role: string;
    game_nick: string | null;
}

export const AdminUserManager: React.FC = () => {
    const [users, setUsers] = useState<UserData[]>([]);
    const [loading, setLoading] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [actionLoading, setActionLoading] = useState<string | null>(null);

    // Modal de confirmação
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [userToDelete, setUserToDelete] = useState<UserData | null>(null);
    const [deleteConfirmText, setDeleteConfirmText] = useState('');

    useEffect(() => {
        fetchUsers();
    }, []);

    const fetchUsers = async () => {
        setLoading(true);
        const { data, error } = await supabase.rpc('admin_get_users');
        if (error) {
            console.error('Error fetching users:', error);
            try {
                const { data: debugData, error: debugError } = await supabase.rpc('debug_admin_access');
                if (debugError) {
                    alert(`Failed to fetch users: ${error.message}\\n\\nDiagnosis Failed: ${debugError.message}`);
                } else {
                    alert(`Failed to fetch users: ${error.message}\\n\\nDebug Info:\\nUID: ${debugData.auth_uid}\\nRole: ${debugData.profile_role}\\nIs Admin: ${debugData.is_admin}`);
                }
            } catch (err) {
                alert(`Failed to fetch users: ${error.message}`);
            }
        } else {
            setUsers(data || []);
        }
        setLoading(false);
    };

    const openDeleteModal = (user: UserData) => {
        setUserToDelete(user);
        setDeleteConfirmText('');
        setShowDeleteModal(true);
    };

    const confirmDelete = async () => {
        if (!userToDelete) return;
        if (deleteConfirmText !== 'DELETAR') {
            alert('Você precisa digitar "DELETAR" para confirmar');
            return;
        }

        setActionLoading(userToDelete.id);
        setShowDeleteModal(false);

        const { error } = await supabase.rpc('admin_delete_user', { target_user_id: userToDelete.id });

        if (error) {
            alert(`Erro ao deletar: ${error.message}`);
        } else {
            alert('✅ Usuário deletado com sucesso');
            fetchUsers();
        }

        setActionLoading(null);
        setUserToDelete(null);
        setDeleteConfirmText('');
    };

    const handleAction = async (userId: string, action: string, payload: any = {}) => {
        if (!confirm(`Tem certeza que deseja: ${action.toUpperCase()}?`)) return;

        setActionLoading(userId);

        const { error } = await supabase.rpc('admin_manage_user', {
            target_user_id: userId,
            action_type: action,
            payload: payload
        });

        if (error) {
            alert(`Erro: ${error.message}`);
        } else {
            alert('✅ Ação realizada com sucesso');
            fetchUsers();
        }
        setActionLoading(null);
    };

    const filteredUsers = users.filter(user =>
        (user.email?.toLowerCase().includes(searchTerm.toLowerCase()) || '') ||
        (user.game_nick?.toLowerCase().includes(searchTerm.toLowerCase()) || '') ||
        (user.id.includes(searchTerm))
    );

    return (
        <div className="space-y-6">
            {/* Modal de Confirmação de Delete */}
            {showDeleteModal && userToDelete && (
                <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
                    <div className="bg-slate-800 rounded-2xl border-2 border-red-500 max-w-md w-full p-6 shadow-2xl">
                        {/* Header */}
                        <div className="flex items-start justify-between mb-4">
                            <div className="flex items-center gap-3">
                                <div className="bg-red-500/20 p-3 rounded-lg">
                                    <AlertTriangle className="w-6 h-6 text-red-500" />
                                </div>
                                <div>
                                    <h3 className="text-xl font-bold text-white">⚠️ ATENÇÃO</h3>
                                    <p className="text-sm text-red-400">Ação Irreversível</p>
                                </div>
                            </div>
                            <button
                                onClick={() => setShowDeleteModal(false)}
                                className="text-slate-400 hover:text-white transition"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        {/* Warning */}
                        <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4 mb-4">
                            <p className="text-red-300 text-sm font-semibold mb-2">
                                Você está prestes a DELETAR permanentemente:
                            </p>
                            <div className="bg-slate-900 rounded p-3 space-y-1">
                                <p className="text-white font-mono text-sm">📧 {userToDelete.email}</p>
                                {userToDelete.game_nick && (
                                    <p className="text-slate-300 text-sm">🎮 {userToDelete.game_nick}</p>
                                )}
                                <p className="text-slate-500 text-xs">ID: {userToDelete.id.slice(0, 8)}...</p>
                            </div>
                        </div>

                        {/* Consequences */}
                        <div className="bg-slate-900 rounded-lg p-4 mb-4">
                            <p className="text-white font-semibold mb-2 text-sm">O que será deletado:</p>
                            <ul className="text-slate-300 text-xs space-y-1">
                                <li>❌ Conta do usuário</li>
                                <li>❌ Todos os trades</li>
                                <li>❌ Badges e XP</li>
                                <li>❌ Mensagens do ticker</li>
                                <li>❌ Histórico completo</li>
                            </ul>
                            <p className="text-yellow-400 text-xs mt-3">
                                ⚠️ O usuário PODERÁ criar uma nova conta depois
                            </p>
                        </div>

                        {/* Confirmation Input */}
                        <div className="mb-4">
                            <label className="block text-sm font-semibold text-white mb-2">
                                Digite <span className="text-red-400 font-mono">DELETAR</span> para confirmar:
                            </label>
                            <input
                                type="text"
                                value={deleteConfirmText}
                                onChange={(e) => setDeleteConfirmText(e.target.value)}
                                placeholder="DELETAR"
                                className="w-full p-3 bg-slate-900 border-2 border-slate-700 focus:border-red-500 rounded-lg text-white font-mono outline-none transition"
                                autoFocus
                            />
                        </div>

                        {/* Actions */}
                        <div className="flex gap-3">
                            <button
                                onClick={() => setShowDeleteModal(false)}
                                className="flex-1 py-3 bg-slate-700 hover:bg-slate-600 text-white font-semibold rounded-lg transition"
                            >
                                ❌ Cancelar
                            </button>
                            <button
                                onClick={confirmDelete}
                                disabled={deleteConfirmText !== 'DELETAR'}
                                className="flex-1 py-3 bg-red-600 hover:bg-red-700 text-white font-bold rounded-lg transition disabled:opacity-30 disabled:cursor-not-allowed"
                            >
                                🗑️ DELETAR
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Header / Search */}
            <div className="flex flex-col md:flex-row gap-4 justify-between items-center bg-slate-800 p-4 rounded-xl border border-slate-700">
                <div className="flex items-center gap-2">
                    <div className="bg-amber-500/10 p-2 rounded-lg">
                        <Shield className="w-6 h-6 text-amber-500" />
                    </div>
                    <div>
                        <h3 className="font-bold text-white">User Management</h3>
                        <p className="text-xs text-slate-400">{users.length} registered users</p>
                    </div>
                </div>

                <div className="relative w-full md:w-64">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                    <input
                        type="text"
                        placeholder="Search users..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white placeholder:text-slate-600 focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500 outline-none transition"
                    />
                </div>
            </div>

            {/* User Table */}
            <div className="bg-slate-800 rounded-xl border border-slate-700 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-slate-900 border-b border-slate-700">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-semibold text-slate-400 uppercase">User</th>
                                <th className="px-6 py-3 text-left text-xs font-semibold text-slate-400 uppercase">Role</th>
                                <th className="px-6 py-3 text-left text-xs font-semibold text-slate-400 uppercase">Status</th>
                                <th className="px-6 py-3 text-left text-xs font-semibold text-slate-400 uppercase">Joined</th>
                                <th className="px-6 py-3 text-right text-xs font-semibold text-slate-400 uppercase">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-700">
                            {loading ? (
                                <tr>
                                    <td colSpan={5} className="px-6 py-8 text-center text-slate-400">
                                        Loading users...
                                    </td>
                                </tr>
                            ) : filteredUsers.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="px-6 py-8 text-center text-slate-400">
                                        No users found
                                    </td>
                                </tr>
                            ) : (
                                filteredUsers.map((user) => {
                                    const isBanned = user.banned_until && new Date(user.banned_until) > new Date();
                                    return (
                                        <tr key={user.id} className="hover:bg-slate-700/50 transition-colors">
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="bg-slate-700 w-10 h-10 rounded-full flex items-center justify-center text-white font-bold">
                                                        {user.email[0].toUpperCase()}
                                                    </div>
                                                    <div>
                                                        <div className="text-white font-medium">{user.game_nick || 'Unverified'}</div>
                                                        <div className="text-xs text-slate-400">{user.email}</div>
                                                        <div className="text-xs text-slate-600 font-mono">{user.id.slice(0, 8)}...</div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className={`px-2 py-1 rounded text-xs font-semibold ${user.role === 'admin' ? 'bg-amber-500/20 text-amber-400' : 'bg-slate-700 text-slate-300'
                                                    }`}>
                                                    {user.role}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4">
                                                {isBanned ? (
                                                    <span className="px-2 py-1 bg-rose-500/20 text-rose-400 rounded text-xs font-semibold">
                                                        Banned
                                                    </span>
                                                ) : (
                                                    <span className="px-2 py-1 bg-emerald-500/20 text-emerald-400 rounded text-xs font-semibold">
                                                        Active
                                                    </span>
                                                )}
                                            </td>
                                            <td className="px-6 py-4">
                                                <div>{new Date(user.created_at).toLocaleDateString()}</div>
                                                <div className="text-xs opacity-50">
                                                    Last: {user.last_sign_in_at ? new Date(user.last_sign_in_at).toLocaleDateString() : 'Never'}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <div className="flex items-center justify-end gap-2">
                                                    {/* Gift Shouts */}
                                                    <button
                                                        onClick={() => {
                                                            const input = prompt("How many shouts to gift?", "5");
                                                            if (input) {
                                                                const amount = parseInt(input);
                                                                if (!isNaN(amount) && amount > 0) {
                                                                    handleAction(user.id, 'gift_shouts', { amount });
                                                                } else {
                                                                    alert("Invalid amount");
                                                                }
                                                            }
                                                        }}
                                                        disabled={!!actionLoading}
                                                        className="p-2 hover:bg-cyan-500/20 text-slate-400 hover:text-cyan-400 rounded-lg transition-colors"
                                                        title="Gift Shouts"
                                                    >
                                                        <Gift className="w-4 h-4" />
                                                    </button>

                                                    {/* Toggle Ban */}
                                                    <button
                                                        onClick={() => handleAction(user.id, 'ban', { until: isBanned ? null : 'infinity' })}
                                                        disabled={!!actionLoading}
                                                        className={`p-2 rounded-lg transition-colors ${isBanned
                                                            ? 'hover:bg-emerald-500/20 text-rose-400 hover:text-emerald-400'
                                                            : 'hover:bg-rose-500/20 text-slate-400 hover:text-rose-400'
                                                            }`}
                                                        title={isBanned ? "Unban User" : "Ban User"}
                                                    >
                                                        {isBanned ? <UserCheck className="w-4 h-4" /> : <Ban className="w-4 h-4" />}
                                                    </button>

                                                    {/* Delete User - NOVO MODAL */}
                                                    <button
                                                        onClick={() => openDeleteModal(user)}
                                                        disabled={!!actionLoading}
                                                        className="p-2 hover:bg-red-500/20 text-slate-400 hover:text-red-500 rounded-lg transition-colors"
                                                        title="Deletar Usuário (Permanente)"
                                                    >
                                                        <Trash className="w-4 h-4" />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};
