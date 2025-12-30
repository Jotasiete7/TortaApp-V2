import React, { useState, useEffect } from 'react';
import { Volume2, VolumeX, Sparkles, Monitor, Bell, Globe, MessageSquare } from 'lucide-react';
import { SoundService } from '../services/SoundService';
import { AlertsManager } from './AlertsManager';
import { useTranslation } from 'react-i18next';
import { FeedbackWidget } from './FeedbackWidget';

interface UserSettingsProps {
    user?: any;
    myVerifiedNick?: string | null;
    role?: string;
}

export const UserSettings: React.FC<UserSettingsProps> = ({ user, myVerifiedNick, role }) => {
    const { t, i18n } = useTranslation('common');

    // Local state for UI feedback
    const [volume, setVolume] = useState(0.5);
    const [isMuted, setIsMuted] = useState(false);
    const [enableAnimations, setEnableAnimations] = useState(true);

    useEffect(() => {
        // Init state check
        setIsMuted(SoundService.isMuted());
        setVolume(SoundService.getVolume());
    }, []);

    const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const val = parseFloat(e.target.value);
        setVolume(val);
        SoundService.setVolume(val);
        if (!isMuted) SoundService.play('click');
    };

    const toggleMute = () => {
        const muted = SoundService.toggleMute();
        setIsMuted(muted);
    };

    const toggleLanguage = () => {
        const newLang = i18n.language === 'en' ? 'pt' : 'en';
        i18n.changeLanguage(newLang);
        localStorage.setItem('app_language', newLang);
    };

    // Normalize language for flag display
    const currentLang = i18n.language.split('-')[0];

    return (
        <div className="flex flex-col items-center justify-start h-full text-slate-500 animate-fade-in p-6 overflow-y-auto">
            <div className="bg-slate-800 p-6 rounded-xl border border-slate-700 w-full max-w-5xl shadow-lg">
                <div className="mb-6 border-b border-slate-700 pb-4 flex items-center justify-between">
                    <div>
                        <h2 className="text-xl font-bold text-white mb-1 flex items-center gap-2">
                            <Monitor className="w-5 h-5 text-amber-500" />
                            {t('settings.title')}
                        </h2>
                        <p className="text-xs text-slate-400">{t('settings.subtitle')}</p>
                    </div>
                    {/* Optional: Add a "Reset to Defaults" button here later */}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

                    {/* COLUMN 1: SENSORY (Audio & Visuals) */}
                    <div className="space-y-6">

                        {/* SECTION: AUDIO */}
                        <div className="space-y-3">
                            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
                                <Volume2 className="w-4 h-4" /> {t('settings.audio.title')}
                            </h3>
                            <div className="bg-slate-900/50 p-4 rounded-lg border border-slate-700/50">
                                <div className="flex items-center justify-between mb-4">
                                    <span className="text-sm font-medium text-slate-200">Master Volume</span>
                                    <button
                                        onClick={toggleMute}
                                        className={`px-3 py-1 text-[10px] font-bold rounded-full border transition-all ${isMuted ? 'bg-rose-500/10 text-rose-400 border-rose-500/30' : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'}`}
                                    >
                                        {isMuted ? t('settings.audio.muted') : t('settings.audio.active')}
                                    </button>
                                </div>
                                <div className="flex items-center gap-4">
                                    <input
                                        type="range"
                                        min="0" max="1" step="0.05"
                                        value={volume}
                                        onChange={handleVolumeChange}
                                        disabled={isMuted}
                                        className="w-full h-1.5 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-amber-500 disabled:opacity-50"
                                    />
                                    <span className="text-xs font-mono text-slate-400 w-8 text-right">{Math.round(volume * 100)}%</span>
                                </div>
                            </div>
                        </div>

                        {/* SECTION: VISUALS */}
                        <div className="space-y-3">
                            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
                                <Sparkles className="w-4 h-4" /> {t('settings.visuals.title')}
                            </h3>
                            <div className="bg-slate-900/50 p-4 rounded-lg border border-slate-700/50 flex items-center justify-between">
                                <div>
                                    <h4 className="text-sm font-medium text-slate-200">{t('settings.visuals.levelup_title')}</h4>
                                    <p className="text-[10px] text-slate-500 mt-0.5">{t('settings.visuals.levelup_desc')}</p>
                                </div>
                                <label className="relative inline-flex items-center cursor-pointer">
                                    <input
                                        type="checkbox"
                                        className="sr-only peer"
                                        checked={enableAnimations}
                                        onChange={(e) => setEnableAnimations(e.target.checked)}
                                    />
                                    <div className="w-9 h-5 bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-purple-600"></div>
                                </label>
                            </div>
                        </div>

                    </div>

                    {/* COLUMN 2: SYSTEM (Language, Alerts, Feedback) */}
                    <div className="space-y-6">

                        {/* SECTION: LANGUAGE */}
                        <div className="space-y-3">
                            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
                                <Globe className="w-4 h-4" /> {t('settings.language.title')}
                            </h3>
                            <div className="bg-slate-900/50 p-4 rounded-lg border border-slate-700/50 flex items-center justify-between">
                                <div>
                                    <h4 className="text-sm font-medium text-slate-200">{t('settings.language.interface_title')}</h4>
                                    <p className="text-[10px] text-slate-500 mt-0.5 max-w-[200px] leading-tight">
                                        {t('settings.language.description')}
                                    </p>
                                </div>
                                <button
                                    onClick={toggleLanguage}
                                    className="px-3 py-1.5 bg-blue-500/10 text-blue-400 border border-blue-500/30 rounded-md font-bold text-xs hover:bg-blue-500/20 transition-all active:scale-95"
                                >
                                    {currentLang === 'en' ? '🇺🇸 EN' : '🇧🇷 PT'}
                                </button>
                            </div>
                        </div>

                        {/* SECTION: ALERTS */}
                        <div className="space-y-3">
                            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
                                <Bell className="w-4 h-4" /> {t('settings.alerts.title')}
                            </h3>
                            <div className="bg-slate-900/50 p-4 rounded-lg border border-slate-700/50 opacity-60 cursor-not-allowed relative overflow-hidden group">
                                <div className="absolute inset-0 bg-slate-950/20 group-hover:bg-slate-950/10 transition-colors" />
                                <div className="flex justify-between items-center relative z-10">
                                    <div>
                                        <h4 className="text-sm font-medium text-slate-200">{t('settings.alerts.high_price_title')}</h4>
                                        <div className="flex items-center gap-2 mt-1">
                                            <span className="text-[9px] bg-amber-500/20 text-amber-300 px-1.5 py-0.5 rounded border border-amber-500/30">COMING SOON</span>
                                        </div>
                                    </div>
                                    <div className="w-8 h-4 bg-slate-700/50 rounded-full border border-slate-600/30"></div>
                                </div>
                            </div>
                        </div>

                        {/* SECTION: FEEDBACK */}
                        <div className="space-y-3">
                            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
                                <MessageSquare className="w-4 h-4" /> Support
                            </h3>
                            <FeedbackWidget variant="inline" />
                        </div>

                    </div>

                </div>
            </div>
        </div>
    );
};
