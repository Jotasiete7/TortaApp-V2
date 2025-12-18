import React, { useState, useEffect } from 'react';
import { supabase } from '../services/supabase';
import { Settings, Zap, Megaphone, Lock, Save, RefreshCw, AlertTriangle } from 'lucide-react';

interface AppSetting {
    key: string;
    value: any;
    description: string;
    updated_at: string;
    updated_by_email?: string;
}

export const AdminSettings: React.FC = () => {
    const [settings, setSettings] = useState<AppSetting[]>([]);
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState<string | null>(null);

    useEffect(() => {
        fetchSettings();
    }, []);

    const fetchSettings = async () => {
        setLoading(true);
        const { data, error } = await supabase.rpc('admin_get_settings');
        if (error) {
            console.error('Error fetching settings:', error);
            alert('Failed to load settings');
        } else {
            setSettings(data || []);
        }
        setLoading(false);
    };

    const handleUpdate = async (key: string, newValue: any) => {
        setSaving(key);

        // Optimistic update locally? No, better wait for confirmation to avoid desync

        const { error } = await supabase.rpc('admin_update_setting', {
            setting_key: key,
            new_value: newValue
        });

        if (error) {
            alert(`Failed to update ${key}: ${error.message}`);
        } else {
            // Refresh to confirm
            await fetchSettings();
        }
        setSaving(null);
    };

    // Helper to render input based on key or implicit type
    const renderInput = (setting: AppSetting) => {
        const val = setting.value;
        // Detect boolean strings or actual booleans
        const isBool = typeof val === 'boolean' || val === 'true' || val === 'false';
        const isNumber = !isNaN(Number(val)) && !isBool && setting.key !== 'motd';

        if (isBool) {
            const checked = val === true || val === 'true';
            // Custom labels for known keys
            let label = checked ? 'ENABLED' : 'DISABLED';
            if (setting.key === 'maintenance_mode') label = checked ? 'ENABLED (App Locked)' : 'Disabled (Normal Access)';
            if (setting.key === 'registration_open') label = checked ? 'OPEN (Signups Allowed)' : 'CLOSED (Invite Only)';

            return (
                <div className="flex items-center gap-3">
                    <button
                        onClick={() => handleUpdate(setting.key, !checked)}
                        disabled={!!saving}
                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${checked ? 'bg-emerald-500' : 'bg-slate-600'
                            } ${setting.key === 'maintenance_mode' && checked ? '!bg-rose-500' : ''}`}
                    >
                        <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${checked ? 'translate-x-6' : 'translate-x-1'
                            }`} />
                    </button>
                    <span className={`text-sm font-medium ${checked ? 'text-emerald-400' : 'text-slate-400'} ${setting.key === 'maintenance_mode' && checked ? '!text-rose-400' : ''}`}>
                        {label}
                    </span>
                </div>
            );
        }

        if (isNumber) {
            return (
                <div className="flex items-center gap-2">
                    <input
                        type="number"
                        defaultValue={val}
                        step={setting.key === 'xp_multiplier' ? "0.1" : "1"}
                        onBlur={(e) => {
                            const num = parseFloat(e.target.value);
                            if (num !== Number(val)) handleUpdate(setting.key, num);
                        }}
                        className="bg-slate-900 border border-slate-700 rounded px-3 py-1.5 text-white w-32 focus:ring-2 focus:ring-amber-500/50 outline-none"
                    />
                    <span className="text-xs text-slate-500">Auto-saves on blur</span>
                </div>
            );
        }

        // Default Text
        return (
            <div className="flex items-center gap-2 w-full">
                <input
                    type="text"
                    defaultValue={typeof val === 'string' ? val.replace(/^"|"$/g, '') : val}
                    onBlur={(e) => {
                        const txt = e.target.value;
                        if (txt !== val) handleUpdate(setting.key, txt);
                    }}
                    className="bg-slate-900 border border-slate-700 rounded px-3 py-1.5 text-white w-full focus:ring-2 focus:ring-amber-500/50 outline-none"
                />
            </div>
        );
    };

    const getIcon = (key: string) => {
        if (key.includes('xp')) return <Zap className="w-5 h-5 text-yellow-400" />;
        if (key.includes('shout')) return <Megaphone className="w-5 h-5 text-cyan-400" />;
        if (key.includes('maintenance') || key.includes('lock')) return <Lock className="w-5 h-5 text-rose-400" />;
        if (key.includes('registration') || key.includes('upload')) return <Settings className="w-5 h-5 text-emerald-400" />;
        return <Settings className="w-5 h-5 text-slate-400" />;
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row gap-4 justify-between items-center bg-slate-800 p-4 rounded-xl border border-slate-700">
                <div className="flex items-center gap-2">
                    <div className="bg-purple-500/10 p-2 rounded-lg">
                        <Settings className="w-6 h-6 text-purple-500" />
                    </div>
                    <div>
                        <h3 className="font-bold text-white">System Settings (God Mode)</h3>
                        <p className="text-xs text-slate-400">Global configurations that affect all users.</p>
                    </div>
                </div>
                <button
                    onClick={fetchSettings}
                    className="p-2 hover:bg-slate-700 rounded-lg transition-colors text-slate-400 hover:text-white"
                    title="Refresh Settings"
                >
                    <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
                </button>
            </div>

            <div className="grid grid-cols-1 gap-4">
                {settings.map((setting) => (
                    <div key={setting.key} className="bg-slate-800 border border-slate-700 rounded-xl p-6 transition-all hover:border-slate-600">
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                            <div className="flex items-start gap-4 mb-2 md:mb-0">
                                <div className="p-2 bg-slate-700/50 rounded-lg">
                                    {getIcon(setting.key)}
                                </div>
                                <div>
                                    <h4 className="font-bold text-white uppercase text-sm tracking-wider">{setting.key.replace(/_/g, ' ')}</h4>
                                    <p className="text-sm text-slate-400 mt-1">{setting.description}</p>
                                    {setting.updated_by_email && (
                                        <p className="text-[10px] text-slate-600 mt-2 font-mono">
                                            Last edit: {setting.updated_by_email} ({new Date(setting.updated_at).toLocaleDateString()})
                                        </p>
                                    )}
                                </div>
                            </div>

                            <div className="w-full md:w-1/2 flex items-center justify-end">
                                {saving === setting.key ? (
                                    <span className="text-amber-500 text-sm animate-pulse mr-4">Saving...</span>
                                ) : null}
                                {renderInput(setting)}
                            </div>
                        </div>
                    </div>
                ))}

                {settings.length === 0 && !loading && (
                    <div className="text-center py-12 text-slate-500">
                        No settings found.
                    </div>
                )}
            </div>
        </div>
    );
};
