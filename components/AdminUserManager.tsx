import React, { useState, useEffect } from 'react';
import { supabase } from '../services/supabase';
import { Search, Shield, Ban, Gift, UserCheck, MoreVertical, Key, Trash } from 'lucide-react';

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

    useEffect(() => {
        fetchUsers();
    }, []);

    const fetchUsers = async () => {
        setLoading(true);
        const { data, error } = await supabase.rpc('admin_get_users');
        if (error) {
            console.error('Error fetching users:', error);

            // Self-diagnosis: Check permissions
            try {
                const { data: debugData, error: debugError } = await supabase.rpc('debug_admin_access');
                if (debugError) {
                    alert(`Failed to fetch users: ${error.message}\n\nDiagnosis Failed: ${debugError.message}`);
                } else {
                    alert(`Failed to fetch users: ${error.message}\n\nDebug Info:\nUID: ${debugData.auth_uid}\nRole: ${debugData.profile_role}\nIs Admin: ${debugData.is_admin}`);
                }
            } catch (err) {
                alert(`Failed to fetch users: ${error.message}`);
            }
        } else {
            setUsers(data || []);
        }
        setLoading(false);
    };

    const handleAction = async (userId: string, action: string, payload: any = {}) => {
        if (!confirm(`Are you sure you want to perform action: ${action.toUpperCase()}?`)) return;

        setActionLoading(userId);

        let error, data;

        if (action === 'delete') {
            if (!confirm("CRITICAL WARNING: This will permanently DELETE the user and all their data. They will be able to sign up again.\n\nType 'DELETE' to confirm:")) {
                setActionLoading(null);
                return;
            }
            const response = await supabase.rpc('admin_delete_user', { target_user_id: userId });
            error = response.error;
            data = response.data;
        } else {
            const response = await supabase.rpc('admin_manage_user', {
                target_user_id: userId,
                action_type: action,
                payload: payload
            });
            error = response.error;
            data = response.data;
        }

        if (error) {
            alert(`Error: ${error.message}`);
        } else {
            alert('Action successful');
            fetchUsers(); // Refresh list
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
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                        type="text"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        placeholder="Search email, nick or ID..."
                        className="w-full pl-10 pr-4 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white placeholder:text-slate-600 focus:ring-2 focus:ring-amber-500/50 outline-none text-sm"
                    />
                </div>
            </div>

            {/* Users Table */}
            <div className="bg-slate-800 border border-slate-700 rounded-xl overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm text-slate-400">
                        <thead className="bg-slate-900/50 uppercase text-xs font-bold tracking-wider text-slate-500">
                            <tr>
                                <th className="px-6 py-4">User</th>
                                <th className="px-6 py-4">Role</th>
                                <th className="px-6 py-4">Status</th>
                                <th className="px-6 py-4">Joined</th>
                                <th className="px-6 py-4 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-700">
                            {loading ? (
                                <tr>
                                    <td colSpan={5} className="px-6 py-12 text-center text-slate-500">
                                        Loading users...
                                    </td>
                                </tr>
                            ) : filteredUsers.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="px-6 py-12 text-center text-slate-500">
                                        No users found.
                                    </td>
                                </tr>
                            ) : (
                                filteredUsers.map((user) => {
                                    const isBanned = user.banned_until && new Date(user.banned_until) > new Date();
                                    return (
                                        <tr key={user.id} className="hover:bg-slate-700/30 transition-colors">
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-3">
                                                    <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-lg ${isBanned ? 'bg-rose-500/20 text-rose-500' : 'bg-slate-700 text-slate-300'
                                                        }`}>
                                                        {user.game_nick ? user.game_nick[0].toUpperCase() : user.email[0].toUpperCase()}
                                                    </div>
                                                    <div>
                                                        <div className="font-medium text-white flex items-center gap-2">
                                                            {user.game_nick || 'Unverified'}
                                                            {user.role === 'admin' && (
                                                                <span className="bg-amber-500/20 text-amber-400 text-[10px] px-1.5 py-0.5 rounded border border-amber-500/30">ADMIN</span>
                                                            )}
                                                        </div>
                                                        <div className="text-xs">{user.email}</div>
                                                        <div className="text-[10px] font-mono opacity-50">{user.id}</div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${user.role === 'admin' ? 'bg-amber-100 text-amber-800' :
                                                    user.role === 'moderator' ? 'bg-blue-100 text-blue-800' :
                                                        'bg-slate-100 text-slate-800'
                                                    }`}>
                                                    {user.role}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4">
                                                {isBanned ? (
                                                    <span className="inline-flex items-center gap-1 text-rose-400 bg-rose-500/10 px-2 py-1 rounded border border-rose-500/20">
                                                        <Ban className="w-3 h-3" /> Banned
                                                    </span>
                                                ) : (
                                                    <span className="inline-flex items-center gap-1 text-emerald-400 bg-emerald-500/10 px-2 py-1 rounded border border-emerald-500/20">
                                                        <UserCheck className="w-3 h-3" /> Active
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

                                                    {/* Toggle Ban (Blacklist) */}
                                                    <button
                                                        onClick={() => handleAction(user.id, 'ban', { until: isBanned ? null : 'infinity' })}
                                                        disabled={!!actionLoading}
                                                        className={`p-2 rounded-lg transition-colors ${isBanned
                                                            ? 'hover:bg-emerald-500/20 text-rose-400 hover:text-emerald-400'
                                                            : 'hover:bg-rose-500/20 text-slate-400 hover:text-rose-400'
                                                            }`}
                                                        title={isBanned ? "Unban User (Allow Login)" : "Ban User (Blacklist - Prevent Login)"}
                                                    >
                                                        {isBanned ? <UserCheck className="w-4 h-4" /> : <Ban className="w-4 h-4" />}
                                                    </button>

                                                    {/* Delete User */}
                                                    <button
                                                        onClick={() => handleAction(user.id, 'delete')}
                                                        disabled={!!actionLoading}
                                                        className="p-2 hover:bg-red-500/20 text-slate-400 hover:text-red-500 rounded-lg transition-colors"
                                                        title="Delete User (Permanently Remove Data)"
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
