import React, { useState, useEffect } from 'react';
import { open } from '@tauri-apps/plugin-dialog';
import { liveTradeMonitor } from '../services/LiveTradeMonitor';
import { Shield, FileText, CheckCircle, AlertTriangle, Play, X } from 'lucide-react';
import { toast } from 'sonner';

export const LiveTradeSetup = () => {
    const [isOpen, setIsOpen] = useState(false);
    const [consent, setConsent] = useState(false);
    const [filePath, setFilePath] = useState('');
    const [isWatching, setIsWatching] = useState(false);

    useEffect(() => {
        const storedConsent = localStorage.getItem('live_monitor_consent') === 'true';
        const storedPath = localStorage.getItem('wurm_log_path');
        setConsent(storedConsent);
        if (storedPath) setFilePath(storedPath);

        // Check if we should auto-start?
        // For now, let user manual start, or just show state.
    }, []);

    const handleFileSelect = async () => {
        try {
            const selected = await open({
                multiple: false,
                filters: [{
                    name: 'Log Files',
                    extensions: ['txt', 'log']
                }]
            });

            if (typeof selected === 'string') {
                setFilePath(selected);
                localStorage.setItem('wurm_log_path', selected);
            }
        } catch (err) {
            console.error(err);
            toast.error("Erro ao selecionar arquivo");
        }
    };

    const handleStart = async () => {
        if (!consent) {
            toast.error("Você precisa aceitar os termos da LGPD.");
            return;
        }
        if (!filePath) {
            toast.error("Selecione o arquivo de log.");
            return;
        }

        await liveTradeMonitor.startWatching(filePath);
        setIsWatching(true);
        setIsOpen(false);
    };

    const handleConsent = (check: boolean) => {
        setConsent(check);
        localStorage.setItem('live_monitor_consent', String(check));
    };

    if (!isOpen) {
        return (
            <button
                onClick={() => setIsOpen(true)}
                className={`fixed bottom-6 right-6 p-4 rounded-full shadow-lg transition-all ${isWatching ? 'bg-emerald-600 hover:bg-emerald-700 animate-pulse' : 'bg-blue-600 hover:bg-blue-700'}`}
                title="Live Monitor Setup"
            >
                {isWatching ? <CheckCircle className="text-white" /> : <Play className="text-white" />}
            </button>
        );
    }

    return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-slate-900 border border-slate-700 rounded-xl p-6 max-w-lg w-full shadow-2xl relative">
                <button
                    onClick={() => setIsOpen(false)}
                    className="absolute top-4 right-4 text-slate-400 hover:text-white"
                >
                    <X size={20} />
                </button>

                <h2 className="text-2xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent mb-6 flex items-center gap-2">
                    <Shield className="text-blue-400" /> Live Trade Monitor
                </h2>

                <div className="space-y-6">
                    {/* Step 1: Privacy */}
                    <div className="bg-slate-800/50 p-4 rounded-lg border border-slate-700">
                        <h3 className="text-lg font-semibold text-white mb-2 flex items-center gap-2">
                            <AlertTriangle className="text-amber-400" size={18} /> 1. Privacidade & LGPD
                        </h3>
                        <p className="text-slate-300 text-sm mb-4">
                            Este recurso lê seu arquivo <code>console.log/trade.txt</code> localmente para detectar mensagens de comércio.
                            Apenas dados públicos de mercado (Item, Preço, Nick) são processados.
                        </p>
                        <label className="flex items-center gap-3 cursor-pointer group">
                            <div className={`w-5 h-5 rounded border flex items-center justify-center transition-colors ${consent ? 'bg-emerald-500 border-emerald-500' : 'border-slate-500 group-hover:border-slate-400'}`}>
                                {consent && <CheckCircle size={14} className="text-white" />}
                            </div>
                            <input
                                type="checkbox"
                                className="hidden"
                                checked={consent}
                                onChange={(e) => handleConsent(e.target.checked)}
                            />
                            <span className="text-slate-200 text-sm">Aceito compartilhar dados de mercado anonimizados.</span>
                        </label>
                    </div>

                    {/* Step 2: File Selection */}
                    <div className={`transition-opacity ${consent ? 'opacity-100' : 'opacity-50 pointer-events-none'}`}>
                        <h3 className="text-lg font-semibold text-white mb-2 flex items-center gap-2">
                            <FileText className="text-blue-400" size={18} /> 2. Arquivo de Log
                        </h3>
                        <p className="text-slate-400 text-xs mb-3">
                            Localize a pasta <code>Wurm Online/gamedata/players/seu_nick/logs/</code> e selecione <code>trade.txt</code> (ou o do mês atual).
                        </p>

                        <div className="flex gap-2">
                            <input
                                type="text"
                                value={filePath}
                                readOnly
                                placeholder="Nenhum arquivo selecionado..."
                                className="flex-1 bg-slate-950 border border-slate-700 rounded px-3 py-2 text-sm text-slate-300 font-mono"
                            />
                            <button
                                onClick={handleFileSelect}
                                className="bg-slate-700 hover:bg-slate-600 text-white px-4 py-2 rounded text-sm transition-colors"
                            >
                                Selecionar
                            </button>
                        </div>
                    </div>

                    <button
                        onClick={handleStart}
                        disabled={!consent || !filePath}
                        className={`w-full py-4 rounded-lg font-bold text-lg flex items-center justify-center gap-2 transition-all ${consent && filePath
                                ? 'bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white shadow-lg shadow-blue-900/20'
                                : 'bg-slate-800 text-slate-500 cursor-not-allowed'
                            }`}
                    >
                        {isWatching ? 'Monitorando...' : 'Iniciar Monitoramento'}
                        <Play size={20} fill="currentColor" />
                    </button>
                </div>
            </div>
        </div>
    );
};
