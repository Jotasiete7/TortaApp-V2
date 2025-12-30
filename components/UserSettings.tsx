import React, { useState, useEffect } from 'react';
import { Volume2, VolumeX, Sparkles, Monitor, Bell, Globe } from 'lucide-react';
import { SoundService } from '../services/SoundService';
import { AlertsManager } from './AlertsManager';
import { useTranslation } from 'react-i18next';

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
        <div className="flex flex-col items-center justify-center h-full text-slate-500 animate-fade-in">
            <div className="bg-slate-800 p-8 rounded-xl border border-slate-700 w-full max-w-2xl shadow-lg">
                <div className="mb-8 border-b border-slate-700 pb-4">
                    <h2 className="text-2xl font-bold text-white mb-2 flex items-center gap-3">
                        <Monitor className="w-6 h-6 text-amber-500" />
                        {t('settings.title')}
                    </h2>
                    <p className="text-sm text-slate-400">{t('settings.subtitle')}</p>
                </div>

                <div className="space-y-8">

                    {/* AUDIO SECTION */}
                    <div className="space-y-4">
                        <div className="flex items-center justify-between">
                            <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                                {isMuted ? <VolumeX className="w-5 h-5 text-slate-500" /> : <Volume2 className="w-5 h-5 text-emerald-500" />}
                                {t('settings.audio.title')}
                            </h3>
                            <button
                                onClick={toggleMute}
                                className={`px-3 py-1.5 text-xs font-bold rounded-full border transition-all ${isMuted ? 'bg-rose-500/10 text-rose-400 border-rose-500/30' : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'}`}
                            >
                                {isMuted ? t('settings.audio.muted') : t('settings.audio.active')}
                            </button>
                        </div>

                        <div className="bg-slate-900/50 p-4 rounded-lg border border-slate-700/50">
                            <div className="mb-2 flex justify-between text-sm text-slate-300">
                                <span>{t('settings.audio.master_volume')}</span>
                                <span>{Math.round(volume * 100)}%</span>
                            </div>
                            <input
                                type="range"
                                min="0" max="1" step="0.05"
                                value={volume}
                                onChange={handleVolumeChange}
                                disabled={isMuted}
                                className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-amber-500 disabled:opacity-50"
                            />
                            <p className="text-xs text-slate-500 mt-2">
                                {t('settings.audio.description')}
                            </p>
                        </div>
                    </div>

                    {/* VISUALS SECTION */}
                    <div className="space-y-4 pt-4 border-t border-slate-700/50">
                        <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                            <Sparkles className="w-5 h-5 text-purple-500" />
                            {t('settings.visuals.title')}
                        </h3>

                        <div className="bg-slate-900/50 p-4 rounded-lg border border-slate-700/50 flex items-center justify-between">
                            <div>
                                <h4 className="text-white font-medium">{t('settings.visuals.levelup_title')}</h4>
                                <p className="text-xs text-slate-500">{t('settings.visuals.levelup_desc')}</p>
                            </div>
                            <label className="relative inline-flex items-center cursor-pointer">
                                <input
                                    type="checkbox"
                                    className="sr-only peer"
                                    checked={enableAnimations}
                                    onChange={(e) => setEnableAnimations(e.target.checked)}
                                />
                                <div className="w-11 h-6 bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-600"></div>
                            </label>
                        </div>
                    </div>

                    {/* LANGUAGE SECTION */}
                    <div className="space-y-4 pt-4 border-t border-slate-700/50">
                        <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                            <Globe className="w-5 h-5 text-blue-500" />
                            {t('settings.language.title')}
                        </h3>

                        <div className="bg-slate-900/50 p-4 rounded-lg border border-slate-700/50 flex items-center justify-between">
                            <div>
                                <h4 className="text-white font-medium">{t('settings.language.interface_title')}</h4>
                                <p className="text-xs text-slate-500">
                                    {t('settings.language.description')}
                                </p>
                            </div>
                            <button
                                onClick={toggleLanguage}
                                className="px-4 py-2 bg-blue-500/10 text-blue-400 border border-blue-500/30 rounded-lg font-bold text-sm hover:bg-blue-500/20 transition-all"
                            >
                                {currentLang === 'en' ? '🇺🇸 EN' : '🇧🇷 PT'}
                            </button>
                        </div>
                    </div>

                    {/* NOTIFICATIONS SECTION (Placeholder) */}
                    <div className="space-y-4 pt-4 border-t border-slate-700/50">
                        <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                            <Bell className="w-5 h-5 text-blue-500" />
                            {t('settings.alerts.title')}
                        </h3>
                        <div className="bg-slate-900/50 p-4 rounded-lg border border-slate-700/50 opacity-50 cursor-not-allowed">
                            <div className="flex justify-between items-center">
                                <div>
                                    <h4 className="text-white font-medium">{t('settings.alerts.high_price_title')}</h4>
                                    <p className="text-xs text-slate-500">{t('settings.alerts.high_price_desc')}</p>
                                </div>
                                <div className="w-8 h-4 bg-slate-700 rounded-full"></div>
                            </div>
                        </div>
                    </div>

                </div>
            </div>
        </div>
    );
};
