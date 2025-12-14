import React, { useState, useEffect } from 'react';
import { Volume2, VolumeX, Sparkles, Monitor, Bell } from 'lucide-react';
import { SoundService } from '../services/SoundService';
import { AlertsManager } from './AlertsManager';

export const UserSettings: React.FC = () => {
    // Local state for UI feedback, but backing is SoundService/LocalStorage ideally
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
        // Play small blip to test volume
        if (!isMuted) SoundService.play('click');
    };

    const toggleMute = () => {
        const muted = SoundService.toggleMute();
        setIsMuted(muted);
    };

    return (
        <div className="flex flex-col items-center justify-center h-full text-slate-500 animate-fade-in">
            <div className="bg-slate-800 p-8 rounded-xl border border-slate-700 w-full max-w-2xl shadow-lg">
                <div className="mb-8 border-b border-slate-700 pb-4">
                    <h2 className="text-2xl font-bold text-white mb-2 flex items-center gap-3">
                        <Monitor className="w-6 h-6 text-amber-500" />
                        App Configuration
                    </h2>
                    <p className="text-sm text-slate-400">Customize your Trading experience.</p>
                </div>

                <div className="space-y-8">

                    {/* AUDIO SECTION */}
                    <div className="space-y-4">
                        <div className="flex items-center justify-between">
                            <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                                {isMuted ? <VolumeX className="w-5 h-5 text-slate-500" /> : <Volume2 className="w-5 h-5 text-emerald-500" />}
                                Audio & Sounds
                            </h3>
                            <button
                                onClick={toggleMute}
                                className={`px-3 py-1.5 text-xs font-bold rounded-full border transition-all ${isMuted ? 'bg-rose-500/10 text-rose-400 border-rose-500/30' : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'}`}
                            >
                                {isMuted ? 'MUTED' : 'ACTIVE'}
                            </button>
                        </div>

                        <div className="bg-slate-900/50 p-4 rounded-lg border border-slate-700/50">
                            <div className="mb-2 flex justify-between text-sm text-slate-300">
                                <span>Master Volume</span>
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
                                Controls all sound effects (Level Up, Notifications, Clicks).
                            </p>
                        </div>
                    </div>

                    {/* VISUALS SECTION */}
                    <div className="space-y-4 pt-4 border-t border-slate-700/50">
                        <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                            <Sparkles className="w-5 h-5 text-purple-500" />
                            Visual Effects
                        </h3>

                        <div className="bg-slate-900/50 p-4 rounded-lg border border-slate-700/50 flex items-center justify-between">
                            <div>
                                <h4 className="text-white font-medium">Level Up Celebrations</h4>
                                <p className="text-xs text-slate-500">Show full-screen confetti and animations when you gain a level.</p>
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

                    {/* NOTIFICATIONS SECTION (Placeholder) */}
                    <div className="space-y-4 pt-4 border-t border-slate-700/50">
                        <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                            <Bell className="w-5 h-5 text-blue-500" />
                            Alerts (Experimental)
                        </h3>
                        <div className="bg-slate-900/50 p-4 rounded-lg border border-slate-700/50 opacity-50 cursor-not-allowed">
                            <div className="flex justify-between items-center">
                                <div>
                                    <h4 className="text-white font-medium">High Price Alerts</h4>
                                    <p className="text-xs text-slate-500">Notify when rare items appear (Coming Soon).</p>
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

