import React from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { Shield, Lock } from 'lucide-react';

interface ProtectedAdminProps {
    children: React.ReactNode;
    fallback?: React.ReactNode;
}

export const ProtectedAdmin: React.FC<ProtectedAdminProps> = ({ children, fallback }) => {
    const { role, user, loading } = useAuth();

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="animate-spin w-8 h-8 border-4 border-amber-500 border-t-transparent rounded-full"></div>
            </div>
        );
    }

    const isAdmin = role === 'admin' || role === 'moderator';

    if (!isAdmin) {
        if (fallback) {
            return <>{fallback}</>;
        }

        return (
            <div className="flex flex-col items-center justify-center h-64 text-center p-8">
                <div className="inline-flex p-4 bg-rose-500/10 rounded-full mb-4">
                    <Lock className="w-12 h-12 text-rose-400" />
                </div>
                <h3 className="text-2xl font-bold text-white mb-2">Access Restricted</h3>
                <p className="text-slate-400 max-w-md">
                    {user
                        ? 'This area is restricted to administrators and moderators only.'
                        : 'Please sign in with an administrator account to access this area.'}
                </p>
                {user && (
                    <div className="mt-4 px-4 py-2 bg-slate-800 rounded-lg border border-slate-700">
                        <div className="flex items-center gap-2 text-sm text-slate-400">
                            <Shield className="w-4 h-4" />
                            <span>Your role: <span className="text-amber-400 font-mono">{role}</span></span>
                        </div>
                    </div>
                )}
            </div>
        );
    }

    return <>{children}</>;
};
