import React, { useState, useEffect } from 'react';
import { open } from '@tauri-apps/plugin-dialog';
import { liveTradeMonitor } from '../services/LiveTradeMonitor';
import { Shield, FileText, CheckCircle, AlertTriangle, Play, X, HelpCircle, FolderSearch, RefreshCw, Trash2, Settings, Gauge } from 'lucide-react';
import { toast } from 'sonner';

export const LiveTradeSetup = () => {
    const [isOpen, setIsOpen] = useState(false);
    const [consent, setConsent] = useState(false);
    const [filePath, setFilePath] = useState('');
    const [isWatching, setIsWatching] = useState(false);
    const [showPathHelp, setShowPathHelp] = useState(false);
    const [tickerSpeed, setTickerSpeed] = useState(30); // Default speed (seconds)

    useEffect(() => {
        const storedConsent = localStorage.getItem('live_monitor_consent') === 'true';
        const storedPath = localStorage.getItem('wurm_log_path');
        const storedSpeed = localStorage.getItem('ticker_speed_global');

        setConsent(storedConsent);
        if (storedPath) setFilePath(storedPath);
        if (storedSpeed) setTickerSpeed(Number(storedSpeed));
    }, []);

    const handleFileSelect = async () => {
        // Browser Guard
        // @ts-ignore
        if (!window.__TAURI_INTERNALS__) {
            toast.info("No navegador, cole o caminho manualmente abaixo.");
            return;
        }
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
                if (consent) toast.success("Arquivo selecionado! Clique em Iniciar.");
            }
        } catch (err) {
            console.error(err);
            toast.error("Erro ao selecionar arquivo");
        }
    };

    const handleManualPathChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const newPath = e.target.value;
        setFilePath(newPath);
        localStorage.setItem('wurm_log_path', newPath);
    };

    const handleSpeedChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const speed = Number(e.target.value);
        setTickerSpeed(speed);
        localStorage.setItem('ticker_speed_global', String(speed));
        // Dispatch event for Ticker to update in realtime
        window.dispatchEvent(new Event('ticker-speed-update'));
    };

    const handleClearFile = () => {
        setFilePath('');
        setIsWatching(false);
        localStorage.removeItem('wurm_log_path');
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

        // Browser Guard
        // @ts-ignore
        if (!window.__TAURI_INTERNALS__) {
            toast.warning("Modo Browser Detectado: O monitoramento só funciona no App Desktop.");
            setIsWatching(true);
            setIsOpen(false);
            return;
        }

        try {
            if (filePath.includes('"')) {
                const cleanPath = filePath.replace(/"/g, '');
                setFilePath(cleanPath);
                await liveTradeMonitor.startWatching(cleanPath);
            } else {
                await liveTradeMonitor.startWatching(filePath);
            }

            setIsWatching(true);
            setIsOpen(false);
            toast.success("Monitoramento iniciado! Acompanhe o Live Feed.");
        } catch (error) {
            console.error(error);
            toast.error("Falha ao iniciar monitor. Verifique as permissões ou se o arquivo existe.");
        }
    };

    const handleConsent = (check: boolean) => {
        setConsent(check);
        localStorage.setItem('live_monitor_consent', String(check));
    };

    if (!isOpen) {
        // POSITIONED: Bottom Right, above Feedback
        return (
            <button
                onClick={() => setIsOpen(true)}
                className={`fixed bottom-24 right-6 p-3 rounded-full shadow-lg transition-all z-50 group flex items-center justify-center ${isWatching ? 'bg-emerald-600 hover:bg-emerald-700 w-12 hover:w-auto overflow-hidden' : 'bg-slate-700 hover:bg-slate-600 border border-slate-500 w-12 hover:w-auto overflow-hidden'}`}
                title="Configurar Live Monitor"
            >
                {isWatching ? (
                    <div className="flex items-center gap-2 px-1">
                        <span className="relative flex h-3 w-3 shrink-0">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-300 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-400"></span>
                        </span>
                        <span className="text-white font-bold text-sm hidden group-hover:block whitespace-nowrap animate-in fade-in transition-all">MONITOR ON</span>
                    </div>
                ) : (
                    <div className="flex items-center gap-2 px-1">
                        <Settings className="text-white w-6 h-6 shrink-0" />
                        <span className="text-white font-bold text-sm hidden group-hover:block whitespace-nowrap animate-in fade-in transition-all">CONFIGURAR</span>
                    </div>
                )}
            </button>
        );
    }

    return (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
            <div className="bg-slate-900 border border-slate-700 rounded-xl p-6 max-w-lg w-full shadow-2xl relative animate-in fade-in zoom-in-95 duration-200">
                <button
                    onClick={() => setIsOpen(false)}
                    className="absolute top-4 right-4 text-slate-400 hover:text-white transition-colors"
                >
                    <X size={20} />
                </button>

                <h2 className="text-2xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent mb-6 flex items-center gap-2">
                    <Shield className="text-blue-400" /> Live Trade Monitor
                </h2>

                <div className="space-y-6">
                    {/* Status Display */}
                    <div className={`p-4 rounded-lg border flex items-center justify-between ${isWatching ? 'bg-emerald-900/20 border-emerald-500/30' : 'bg-slate-800 border-slate-700'}`}>
                        <div className="flex items-center gap-3">
                            <div className={`p-2 rounded-full ${isWatching ? 'bg-emerald-500/20 text-emerald-400' : 'bg-slate-700 text-slate-400'}`}>
                                <Activity size={20} className={isWatching ? 'animate-pulse' : ''} />
                            </div>
                            <div>
                                <h4 className={`font-bold ${isWatching ? 'text-emerald-400' : 'text-slate-300'}`}>
                                    {isWatching ? 'Monitoramento Ativo' : 'Monitor Desligado'}
                                </h4>
                                <p className="text-xs text-slate-500">
                                    {isWatching ? 'Capturando dados em tempo real' : 'Configure abaixo para iniciar'}
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Step 1: Privacy */}
                    <div className="bg-slate-800/50 p-4 rounded-lg border border-slate-700">
                        <label className="flex items-center gap-3 cursor-pointer group select-none">
                            <div className={`w-5 h-5 rounded border flex items-center justify-center transition-all ${consent ? 'bg-emerald-500 border-emerald-500' : 'border-slate-500'}`}>
                                {consent && <CheckCircle size={14} className="text-white" />}
                            </div>
                            <input
                                type="checkbox"
                                className="hidden"
                                checked={consent}
                                onChange={(e) => handleConsent(e.target.checked)}
                            />
                            <span className={`text-sm ${consent ? 'text-white' : 'text-slate-400'}`}>
                                Consentimento LGPD (Leitura local de logs)
                            </span>
                        </label>
                    </div>

                    {/* NEW: Ticker Speed Control */}
                    <div className="bg-slate-800/30 p-4 rounded-lg border border-slate-700/50">
                        <h3 className="text-xs font-semibold text-slate-400 flex items-center gap-2 mb-3">
                            <Gauge size={14} className="text-amber-400" />
                            VELOCIDADE DO TICKER
                        </h3>
                        <div className="flex items-center gap-4">
                            <span className="text-xs text-slate-500 font-mono">LENTO</span>
                            <input
                                type="range"
                                min="10"
                                max="60"
                                step="5"
                                value={tickerSpeed}
                                onChange={handleSpeedChange}
                                className="flex-1 h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-emerald-500"
                            />
                            <span className="text-xs text-slate-500 font-mono">RÁPIDO</span>
                            <span className="text-xs font-bold text-emerald-400 w-8 text-right">{tickerSpeed}s</span>
                        </div>
                    </div>

                    {/* Step 2: File Selection */}
                    <div className={`transition-all duration-300 ${consent ? 'opacity-100' : 'opacity-40 pointer-events-none'}`}>
                        <div className="flex justify-between items-center mb-2">
                            <h3 className="text-sm font-semibold text-slate-300 flex items-center gap-2">
                                <FolderSearch className="text-amber-400" size={16} /> Arquivo de Log do Jogo
                            </h3>
                            <button
                                onClick={() => setShowPathHelp(!showPathHelp)}
                                className="text-[10px] text-blue-400 hover:text-blue-300 bg-blue-400/10 px-2 py-1 rounded border border-blue-400/20"
                            >
                                ? ONDE ENCONTRAR
                            </button>
                        </div>

                        {showPathHelp && (
                            <div className="mb-3 p-3 bg-blue-900/20 border border-blue-500/20 rounded text-xs text-blue-200 font-mono break-all animate-in slide-in-from-top-1">
                                <span className="text-amber-400 font-bold">Dica:</span> Procure na pasta da Steam: <br />
                                ...\SteamLibrary\steamapps\common\Wurm Online\gamedata\players\SEU_NICK\logs\
                                <br /><br />
                                <span className="text-emerald-400 font-bold">Importante:</span> Selecione o arquivo do mês atual (ex: <code>Trade.2025-12.txt</code>).
                            </div>
                        )}

                        <div className="flex gap-2">
                            {/* CHANGED: Now a real input so user can PASTE */}
                            <div className="flex-1 bg-slate-950 border border-slate-700 rounded px-3 py-2 text-sm text-slate-300 font-mono relative group focus-within:border-blue-500 transition-colors">
                                <input
                                    type="text"
                                    value={filePath}
                                    onChange={handleManualPathChange}
                                    placeholder="C:\Caminho\Para\logs\Trade.txt"
                                    className="w-full bg-transparent border-none outline-none placeholder:text-slate-700"
                                />
                            </div>

                            {filePath ? (
                                <button
                                    onClick={handleClearFile}
                                    className="bg-rose-900/30 hover:bg-rose-900/50 text-rose-400 px-3 rounded border border-rose-800 transition-colors"
                                    title="Remover arquivo"
                                >
                                    <Trash2 size={16} />
                                </button>
                            ) : (
                                <button
                                    onClick={handleFileSelect}
                                    className="bg-slate-700 hover:bg-slate-600 text-white px-4 py-2 rounded text-sm font-medium border border-slate-600 whitespace-nowrap"
                                >
                                    Abrir Pasta
                                </button>
                            )}
                        </div>
                    </div>

                    <button
                        onClick={handleStart}
                        disabled={!consent || !filePath}
                        className={`w-full py-4 rounded-lg font-bold text-lg flex items-center justify-center gap-2 transition-all transform active:scale-[0.98] ${consent && filePath
                                ? 'bg-gradient-to-r from-blue-600 to-emerald-600 hover:from-blue-500 hover:to-emerald-500 text-white shadow-lg shadow-blue-500/20'
                                : 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700'
                            }`}
                    >
                        {isWatching ? (
                            <>
                                <RefreshCw className="animate-spin" size={20} />
                                Reiniciar Monitoramento
                            </>
                        ) : (
                            <>
                                <Play size={20} fill="currentColor" />
                                Iniciar Live Feed
                            </>
                        )}
                    </button>

                    <p className="text-center text-[10px] text-slate-600">
                        O sistema processará apenas linhas novas adicionadas a partir de agora.
                    </p>
                </div>
            </div>
        </div>
    );
};

// Import helper
import { Activity } from 'lucide-react';
