import React, { useState, useEffect } from 'react';
import { Plus, Trash2, Volume2, Power, AlertCircle, Save, X } from 'lucide-react';
import { SoundService } from '../services/SoundService';
import { ExtendedTradeAlert } from '../services/AlertService';
import { PriceAdapter } from '../services/adapters/PriceAdapter';
import localforage from 'localforage';
import { toast } from 'sonner';

export const AlertsManager: React.FC = () => {
    const [alerts, setAlerts] = useState<ExtendedTradeAlert[]>([]);
    const [isAdding, setIsAdding] = useState(false);
    
    // Form State
    const [term, setTerm] = useState('');
    const [maxPriceStr, setMaxPriceStr] = useState('');
    const [tradeType, setTradeType] = useState<'WTS' | 'WTB' | 'WTT' | 'ALL'>('ALL');
    const [sound, setSound] = useState('notification');
    
    // Load alerts on mount
    useEffect(() => {
        loadAlerts();
    }, []);

    const loadAlerts = async () => {
        const saved = await localforage.getItem<ExtendedTradeAlert[]>('trade_alerts');
        if (saved) {
            setAlerts(saved);
        }
    };

    const saveAlerts = async (newAlerts: ExtendedTradeAlert[]) => {
        setAlerts(newAlerts);
        await localforage.setItem('trade_alerts', newAlerts);
    };

    const handleAddAlert = () => {
        if (!term.trim()) {
            toast.error('Keyword is required');
            return;
        }

        // Parse price using adapter (e.g. "1g 50s" -> 15000c)
        let maxPrice = null;
        if (maxPriceStr.trim()) {
            maxPrice = PriceAdapter.parseToCopper(maxPriceStr);
            if (maxPrice === 0 && maxPriceStr !== '0c') {
                // Potential parse error if user typed garbage but adapter returns 0
                // For now assuming 0 return on valid 0 or error. Warning user implies strictness.
                // toast.warning('Invalid price format. Using 0c or ignoring?');
            }
        }

        const newAlert: ExtendedTradeAlert = {
            id: crypto.randomUUID(),
            term: term.trim(),
            enabled: true,
            sound: sound,
            tradeTypes: tradeType === 'ALL' ? undefined : [tradeType],
            maxPrice: maxPrice
        };

        const updated = [...alerts, newAlert];
        saveAlerts(updated);
        toast.success(`Alert created for "${term}"`);
        
        // Reset form
        setIsAdding(false);
        setTerm('');
        setMaxPriceStr('');
        setTradeType('ALL');
        setSound('notification');
    };

    const handleDelete = (id: string) => {
        const updated = alerts.filter(a => a.id !== id);
        saveAlerts(updated);
        toast.success('Alert deleted');
    };

    const toggleEnable = (id: string) => {
        const updated = alerts.map(a => 
            a.id === id ? { ...a, enabled: !a.enabled } : a
        );
        saveAlerts(updated);
    };

    const soundOptions = SoundService.getSoundInfo();

    return (
        <div className="bg-slate-900/50 p-4 rounded-lg border border-slate-700/50">
            <div className="flex justify-between items-center mb-4">
                <h4 className="text-white font-medium flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 text-emerald-500" />
                    My Alerts
                </h4>
                <button 
                    onClick={() => setIsAdding(!isAdding)}
                    className="flex items-center gap-1 text-xs px-2 py-1 bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 rounded hover:bg-emerald-500/20 transition-colors"
                >
                    <Plus className="w-3 h-3" />
                    New Alert
                </button>
            </div>

            {isAdding && (
                <div className="mb-4 p-3 bg-slate-800 rounded border border-slate-700 animate-fade-in">
                    <div className="grid grid-cols-2 gap-3 mb-3">
                        <div className="col-span-2">
                            <label className="text-xs text-slate-400 block mb-1">Keyword / Item Name</label>
                            <input 
                                type="text" 
                                value={term}
                                onChange={(e) => setTerm(e.target.value)}
                                placeholder="e.g. Casket"
                                className="w-full bg-slate-900 border border-slate-700 rounded px-2 py-1 text-sm text-white focus:outline-none focus:border-emerald-500"
                            />
                        </div>
                        <div>
                            <label className="text-xs text-slate-400 block mb-1">Max Price (Optional)</label>
                            <input 
                                type="text" 
                                value={maxPriceStr}
                                onChange={(e) => setMaxPriceStr(e.target.value)}
                                placeholder="e.g. 1g 50s"
                                className="w-full bg-slate-900 border border-slate-700 rounded px-2 py-1 text-sm text-white focus:outline-none focus:border-emerald-500"
                            />
                        </div>
                        <div>
                            <label className="text-xs text-slate-400 block mb-1">Trade Type</label>
                            <select 
                                value={tradeType}
                                onChange={(e) => setTradeType(e.target.value as any)}
                                className="w-full bg-slate-900 border border-slate-700 rounded px-2 py-1 text-sm text-slate-300 focus:outline-none focus:border-emerald-500"
                            >
                                <option value="ALL">Any</option>
                                <option value="WTS">WTS (Selling)</option>
                                <option value="WTB">WTB (Buying)</option>
                                <option value="WTT">WTT (Trading)</option>
                            </select>
                        </div>
                        <div className="col-span-2">
                             <label className="text-xs text-slate-400 block mb-1">Sound</label>
                             <select 
                                value={sound}
                                onChange={(e) => setSound(e.target.value)}
                                className="w-full bg-slate-900 border border-slate-700 rounded px-2 py-1 text-sm text-slate-300 focus:outline-none focus:border-emerald-500"
                            >
                                {Object.entries(soundOptions).map(([key, info]) => (
                                    <option key={key} value={key}>{info.name}</option>
                                ))}
                            </select>
                        </div>
                    </div>
                    <div className="flex justify-end gap-2">
                        <button 
                            onClick={() => setIsAdding(false)}
                            className="text-xs px-3 py-1 text-slate-400 hover:text-white transition-colors"
                        >
                            Cancel
                        </button>
                        <button 
                            onClick={handleAddAlert}
                            className="text-xs px-3 py-1 bg-emerald-500 text-white rounded hover:bg-emerald-600 transition-colors flex items-center gap-1"
                        >
                            <Save className="w-3 h-3" /> Save
                        </button>
                    </div>
                </div>
            )}

            <div className="space-y-2 max-h-60 overflow-y-auto pr-1 custom-scrollbar">
                {alerts.length === 0 ? (
                    <p className="text-xs text-slate-500 text-center py-4 italic">No alerts configured.</p>
                ) : (
                    alerts.map(alert => (
                        <div key={alert.id} className={`p-2 rounded border flex items-center justify-between transition-colors ${alert.enabled ? 'bg-slate-800 border-slate-700' : 'bg-slate-900 border-slate-800 opacity-60'}`}>
                            <div className="flex items-center gap-3">
                                <button 
                                    onClick={() => toggleEnable(alert.id)}
                                    className={`w-8 h-4 rounded-full relative transition-colors ${alert.enabled ? 'bg-emerald-500/20' : 'bg-slate-700'}`}
                                >
                                    <div className={`absolute top-0.5 w-3 h-3 rounded-full bg-current transition-all ${alert.enabled ? 'left-4 text-emerald-500' : 'left-0.5 text-slate-400 dark:text-slate-500'}`}></div>
                                </button>
                                <div>
                                    <div className="flex items-center gap-2">
                                        <span className="text-sm font-medium text-white">{alert.term}</span>
                                        {alert.tradeTypes && (
                                            <span className="text-[10px] px-1 bg-blue-500/10 text-blue-400 rounded border border-blue-500/20">{alert.tradeTypes[0]}</span>
                                        )}
                                    </div>
                                    <div className="flex items-center gap-2 text-[10px] text-slate-400">
                                        {alert.maxPrice ? (
                                            <span className="text-emerald-400">
                                                &lt; {PriceAdapter.formatCopper(alert.maxPrice)}
                                            </span>
                                        ) : <span>Any price</span>}
                                        <span>•</span>
                                        <span className="flex items-center gap-1"><Volume2 className="w-3 h-3" /> {soundOptions[alert.sound as keyof typeof soundOptions]?.name || alert.sound}</span>
                                    </div>
                                </div>
                            </div>
                            <button 
                                onClick={() => handleDelete(alert.id)}
                                className="p-1.5 text-slate-500 hover:text-rose-400 transition-colors"
                            >
                                <Trash2 className="w-3 h-3" />
                            </button>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
};
