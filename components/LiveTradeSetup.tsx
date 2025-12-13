import React, { useState, useEffect } from 'react';
import { open } from '@tauri-apps/plugin-dialog';
import { invoke } from '@tauri-apps/api/core';
import { liveTradeMonitor } from '../services/LiveTradeMonitor';
import { useTradeEvents, TimerConfig } from '../contexts/TradeEventContext';
import { Shield, CheckCircle, AlertTriangle, Play, X, FolderSearch, RefreshCw, Trash2, Settings, Gauge, Bell, Plus, MessageSquare, Timer, Copy, Edit2, Volume2, VolumeX, Save, Music, Download, Upload, Clock, TrendingUp, History } from 'lucide-react';
import { toast } from 'sonner';
import { SoundService } from '../services/SoundService';
import { useDebounce } from '../hooks/useDebounce';

export const LiveTradeSetup = () => {
    const [isOpen, setIsOpen] = useState(false);
    const [activeTab, setActiveTab] = useState<'monitor' | 'alerts' | 'timer' | 'settings' | 'history'>('monitor');

    // Context
    const {
        alerts, addAlert, removeAlert, toggleAlert,
        quickMsgTemplate, setQuickMsgTemplate,
        timerConfig, setTimerConfig, startTimer, stopTimer, timerEndTime,
        adTemplates, addTemplate, removeTemplate, updateTemplate,
        firedAlerts, clearAlertHistory,
        stats, resetStats,
        dndMode, setDndMode, dndSchedule, setDndSchedule,
        exportConfig, importConfig,
        trades
    } = useTradeEvents();

    // Monitor State
    const [consent, setConsent] = useState(false);
    const [filePath, setFilePath] = useState('');
    const [isWatching, setIsWatching] = useState(false);
    const [showPathHelp, setShowPathHelp] = useState(false);
    const [fileExists, setFileExists] = useState<boolean | null>(null);

    // Settings State
    const [tickerSpeed, setTickerSpeed] = useState(30);
    const [volume, setVolume] = useState(SoundService.getVolume());
    const debouncedVolume = useDebounce(volume, 300);

    // Alert Input
    const [newAlertTerm, setNewAlertTerm] = useState('');
    const [newAlertSound, setNewAlertSound] = useState('notification');
    const [newAlertTypes, setNewAlertTypes] = useState<('WTB'|'WTS'|'WTT')[]>([]);
    const [availableSounds, setAvailableSounds] = useState<string[]>([]);

    // Ads Input
    const [newAdLabel, setNewAdLabel] = useState('');
    const [newAdContent, setNewAdContent] = useState('');
    const [editingAdId, setEditingAdId] = useState<string | null>(null);

    // Status tracking
    const [tradesProcessed, setTradesProcessed] = useState(0);
    const [lastTradeTime, setLastTradeTime] = useState<string | null>(null);

    useEffect(() => {
        const storedConsent = localStorage.getItem('live_monitor_consent') === 'true';
        const storedPath = localStorage.getItem('wurm_log_path');
        const storedSpeed = localStorage.getItem('ticker_speed_global');

        setConsent(storedConsent);
        if (storedPath) {
            setFilePath(storedPath);
            validatePath(storedPath);
        }
        if (storedSpeed) setTickerSpeed(Number(storedSpeed));

        setAvailableSounds(SoundService.getAvailableSounds());
    }, []);

    // Track trades for status
    useEffect(() => {
        if (trades.length > 0) {
            setTradesProcessed(trades.length);
            setLastTradeTime(trades[trades.length - 1].timestamp);
        }
    }, [trades]);

    // Debounced volume
    useEffect(() => {
        SoundService.setVolume(debouncedVolume);
    }, [debouncedVolume]);

    // Keyboard shortcuts
    useEffect(() => {
        const handleKeyPress = (e: KeyboardEvent) => {
            if (e.ctrlKey && e.key === 'm') {
                e.preventDefault();
                setIsOpen(!isOpen);
            }
            if (e.key === 'Escape' && isOpen) {
                setIsOpen(false);
            }
            if (e.ctrlKey && e.key === 't' && alerts.length > 0) {
                e.preventDefault();
                const lastAlert = alerts[alerts.length - 1];
                handleTestAlert(lastAlert);
            }
        };

        window.addEventListener('keydown', handleKeyPress);
        return () => window.removeEventListener('keydown', handleKeyPress);
    }, [isOpen, alerts]);

    const validatePath = async (path: string) => {
        if (!path) {
            setFileExists(null);
            return;
        }

        try {
            if (typeof window.__TAURI_INTERNALS__ !== 'undefined') {
                const exists = await invoke<boolean>('check_file_access', { path });
                setFileExists(exists);
            }
        } catch {
            setFileExists(false);
        }
    };

    const handleFileSelect = async () => {
        if (typeof window.__TAURI_INTERNALS__ === 'undefined') {
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
                validatePath(selected);
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
        validatePath(newPath);
    };

    const handleSpeedChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const speed = Number(e.target.value);
        setTickerSpeed(speed);
        localStorage.setItem('ticker_speed_global', String(speed));
        window.dispatchEvent(new Event('ticker-speed-update'));
    };

    const handleTemplateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setQuickMsgTemplate(e.target.value);
    };

    const handleClearFile = () => {
        setFilePath('');
        setIsWatching(false);
        setFileExists(null);
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

        if (typeof window.__TAURI_INTERNALS__ === 'undefined') {
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

    const handleAddAlert = () => {
        if (!newAlertTerm.trim()) return;
        addAlert(newAlertTerm.trim(), newAlertSound, newAlertTypes.length > 0 ? newAlertTypes : undefined);
        setNewAlertTerm('');
        setNewAlertTypes([]);
        toast.success(`Alerta "${newAlertTerm}" adicionado!`);
    };

    const handleTestAlert = (alert: any) => {
        const mockTrade = {
            timestamp: new Date().toTimeString().split(' ')[0],
            nick: 'TestPlayer',
            message: `WTS ${alert.term} 50s`,
            type: 'WTS' as const
        };
        
        toast.info(`Testando alerta: ${alert.term}`);
        
        import('@tauri-apps/plugin-notification').then(({ sendNotification }) => {
            sendNotification({
                title: `TortaApp: ${alert.term}`,
                body: `${mockTrade.nick}: ${mockTrade.message}`,
            });
        });
        
        SoundService.play(alert.sound || 'notification');
    };

    const handlePreviewSound = () => {
        SoundService.play(newAlertSound);
    };

    const handleSaveAd = () => {
        if (!newAdLabel.trim() || !newAdContent.trim()) return;

        if (editingAdId) {
            updateTemplate(editingAdId, { label: newAdLabel, content: newAdContent });
            toast.success("Anúncio atualizado!");
            setEditingAdId(null);
        } else {
            addTemplate(newAdLabel, newAdContent);
            toast.success("Novo anúncio salvo!");
        }

        setNewAdLabel('');
        setNewAdContent('');
    };

    const handleEditAd = (ad: any) => {
        setNewAdLabel(ad.label);
        setNewAdContent(ad.content);
        setEditingAdId(ad.id);
    };

    const handleCopyAd = (content: string) => {
        navigator.clipboard.writeText(content);
        toast.success("Copiado para o clipboard!");
    };

    const handleCopyNick = (nick: string) => {
        navigator.clipboard.writeText(nick);
        toast.success(`Nick "${nick}" copiado!`);
    };

    const handleImport = async () => {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = '.json';
        input.onchange = async (e: any) => {
            const file = e.target.files[0];
            if (file) {
                try {
                    await importConfig(file);
                    toast.success("Configurações importadas com sucesso!");
                } catch (error) {
                    toast.error("Erro ao importar configurações");
                }
            }
        };
        input.click();
    };

    const toggleTradeType = (type: 'WTB'|'WTS'|'WTT') => {
        setNewAlertTypes(prev => 
            prev.includes(type) 
                ? prev.filter(t => t !== type)
                : [...prev, type]
        );
    };

    if (!isOpen) {
        return (
            \u003cbutton
                onClick={() =\u003e setIsOpen(true)}
                className={`fixed bottom-24 right-6 w-14 h-14 rounded-full shadow-lg transition-all z-50 flex items-center justify-center ${
                    isWatching 
                        ? 'bg-emerald-500 hover:bg-emerald-600 shadow-emerald-500/50' 
                        : 'bg-slate-700 hover:bg-slate-600 border border-slate-500'
                }`}
                title={isWatching ? " \Live Monitor Ativo (Ctrl+M)\\ : \\Configurar Live Monitor (Ctrl+M)\\}
 \u003e
 {isWatching ? (
 \u003cdiv className=\\relative\\\u003e
 \u003cShield className=\\text-white w-6 h-6\\ /\u003e
 \u003cspan className=\\absolute -top-1 -right-1 flex h-3 w-3\\\u003e
 \u003cspan className=\\animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-300 opacity-75\\\u003e\u003c/span\u003e
 \u003cspan className=\\relative inline-flex rounded-full h-3 w-3 bg-emerald-300\\\u003e\u003c/span\u003e
 \u003c/span\u003e
 \u003c/div\u003e
 ) : (
 \u003cShield className=\\text-slate-400 w-6 h-6\\ /\u003e
 )}
 \u003c/button\u003e
 );
 }

    return (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
            <div className="bg-slate-900 border border-slate-700 rounded-xl p-0 max-w-lg w-full shadow-2xl relative animate-in fade-in zoom-in-95 duration-200 overflow-hidden flex flex-col h-[650px] max-h-[90vh]">

                {/* Header */}
                <div className="p-6 pb-4 border-b border-slate-800 flex justify-between items-center bg-slate-900 sticky top-0 z-10">
                    <h2 className="text-xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent flex items-center gap-2">
                        <Shield className="text-blue-400" /> Live Trade Monitor
                    </h2>
                    <button
                        onClick={() => setIsOpen(false)}
                        className="text-slate-400 hover:text-white transition-colors p-1 hover:bg-slate-800 rounded"
                        title="Fechar (ESC)"
                    >
                        <X size={20} />
                    </button>
                </div>

                {/* Tabs */}
                <div className="flex border-b border-slate-800 bg-slate-900/50 overflow-x-auto">
                    <button
                        onClick={() => setActiveTab('monitor')}
                        className={`flex-1 py-3 text-xs font-bold flex items-center justify-center gap-2 transition-colors whitespace-nowrap ${activeTab === 'monitor' ? 'text-emerald-400 border-b-2 border-emerald-500 bg-emerald-500/10' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'}`}
                    >
                        <Play size={14} /> Monitor
                    </button>
                    <button
                        onClick={() => setActiveTab('alerts')}
                        className={`flex-1 py-3 text-xs font-bold flex items-center justify-center gap-2 transition-colors whitespace-nowrap ${activeTab === 'alerts' ? 'text-amber-400 border-b-2 border-amber-500 bg-amber-500/10' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'}`}
                    >
                        <Bell size={14} /> Alertas
                    </button>
                    <button
                        onClick={() => setActiveTab('history')}
                        className={`flex-1 py-3 text-xs font-bold flex items-center justify-center gap-2 transition-colors whitespace-nowrap ${activeTab === 'history' ? 'text-purple-400 border-b-2 border-purple-500 bg-purple-500/10' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'}`}
                    >
                        <History size={14} /> Histórico
                    </button>
                    <button
                        onClick={() => setActiveTab('timer')}
                        className={`flex-1 py-3 text-xs font-bold flex items-center justify-center gap-2 transition-colors whitespace-nowrap ${activeTab === 'timer' ? 'text-rose-400 border-b-2 border-rose-500 bg-rose-500/10' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'}`}
                    >
                        <Timer size={14} /> Ads
                    </button>
                    <button
                        onClick={() => setActiveTab('settings')}
                        className={`flex-1 py-3 text-xs font-bold flex items-center justify-center gap-2 transition-colors whitespace-nowrap ${activeTab === 'settings' ? 'text-blue-400 border-b-2 border-blue-500 bg-blue-500/10' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'}`}
                    >
                        <Settings size={14} /> Config
                    </button>
                </div>

                {/* Content Area - Scrollable */}
                <div className="flex-1 overflow-y-auto p-6 scrollbar-thin scrollbar-thumb-slate-700 scrollbar-track-transparent">

                    {/* --- TAB: MONITOR --- */}
                    {activeTab === 'monitor' && (
                        <div className="space-y-6">
                            {/* Status Display with Stats */}
                            <div className={`p-4 rounded-lg border flex items-center justify-between transition-all ${isWatching ? 'bg-emerald-900/20 border-emerald-500/30' : 'bg-slate-800 border-slate-700'}`}>
                                <div className="flex items-center gap-3">
                                    <div className={`p-2 rounded-full ${isWatching ? 'bg-emerald-500/20 text-emerald-400' : 'bg-slate-700 text-slate-400'}`}>
                                        <Play size={20} className={isWatching ? 'animate-pulse' : ''} />
                                    </div>
                                    <div>
                                        <h4 className={`font-bold ${isWatching ? 'text-emerald-400' : 'text-slate-300'}`}>
                                            {isWatching ? 'Monitoramento Ativo' : 'Monitor Desligado'}
                                        </h4>
                                        <p className="text-xs text-slate-500">
                                            {isWatching ? (
                                                tradesProcessed > 0 ? (
                                                    <>✅ {tradesProcessed} trades processados{lastTradeTime && ` • Último: ${lastTradeTime}`}</>
                                                ) : (
                                                    '⏳ Aguardando trades...'
                                                )
                                            ) : (
                                                'Configure abaixo para iniciar'
                                            )}
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

                            {/* Step 2: File Selection with Validation */}
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
                                    <div className="flex-1 bg-slate-950 border border-slate-700 rounded px-3 py-2 text-sm text-slate-300 font-mono relative group focus-within:border-blue-500 transition-colors flex items-center gap-2">
                                        <input
                                            type="text"
                                            value={filePath}
                                            onChange={handleManualPathChange}
                                            placeholder="C:\Caminho\Para\logs\Trade.txt"
                                            className="flex-1 bg-transparent border-none outline-none placeholder:text-slate-700"
                                        />
                                        {fileExists === true && <CheckCircle size={16} className="text-green-500 shrink-0" />}
                                        {fileExists === false && <AlertTriangle size={16} className="text-red-500 shrink-0" />}
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
                        </div>
                    )}

                    {/* --- TAB: ALERTS --- */}
                    {activeTab === 'alerts' && (
                        <div className="space-y-6">
                            <div className="bg-amber-900/20 p-4 rounded-lg border border-amber-500/20 flex gap-3 text-amber-200 text-sm">
                                <AlertTriangle className="shrink-0 text-amber-500" size={18} />
                                <p>
                                    Receba notificações do Windows quando termos específicos aparecerem no chat de troca.
                                    <br />
                                    <span className="opacity-75 text-xs">Ex: "casket harmony" encontra mensagens com "casket" E "harmony".</span>
                                </p>
                            </div>

                            <div className="flex flex-col gap-2">
                                <div className="flex gap-2">
                                    <input
                                        type="text"
                                        value={newAlertTerm}
                                        onChange={(e) => setNewAlertTerm(e.target.value)}
                                        onKeyDown={(e) => e.key === 'Enter' && handleAddAlert()}
                                        placeholder="Palavra-chave (ex: rare, casket)..."
                                        className="flex-1 bg-slate-950 border border-slate-700 rounded-lg px-4 py-3 text-sm text-white focus:border-amber-500 outline-none"
                                    />

                                    {/* Sound Selector */}
                                    <div className="flex items-center gap-1 bg-slate-950 border border-slate-700 rounded-lg px-2">
                                        <select
                                            value={newAlertSound}
                                            onChange={(e) => setNewAlertSound(e.target.value)}
                                            className="bg-transparent text-xs text-slate-300 font-bold outline-none cursor-pointer w-[100px]"
                                        >
                                            {availableSounds.map(sound => (
                                                <option key={sound} value={sound} className="bg-slate-900 text-white">
                                                    🔊 {sound}
                                                </option>
                                            ))}
                                        </select>
                                        <button onClick={handlePreviewSound} className="p-1 hover:text-amber-400 text-slate-500" title="Testar som">
                                            <Play size={10} />
                                        </button>
                                    </div>

                                    <button
                                        onClick={handleAddAlert}
                                        className="bg-amber-600 hover:bg-amber-500 text-white px-4 rounded-lg font-bold"
                                    >
                                        <Plus size={20} />
                                    </button>
                                </div>

                                {/* Trade Type Filters */}
                                <div className="flex gap-2 text-xs">
                                    <span className="text-slate-500">Filtrar por tipo:</span>
                                    {(['WTB', 'WTS', 'WTT'] as const).map(type => (
                                        <label key={type} className="flex items-center gap-1 cursor-pointer">
                                            <input
                                                type="checkbox"
                                                checked={newAlertTypes.includes(type)}
                                                onChange={() => toggleTradeType(type)}
                                                className="rounded"
                                            />
                                            <span className={newAlertTypes.includes(type) ? 'text-white' : 'text-slate-500'}>{type}</span>
                                        </label>
                                    ))}
                                    <span className="text-slate-600 text-[10px]">(vazio = todos)</span>
                                </div>
                            </div>

                            <div className="space-y-2 max-h-[300px] overflow-y-auto pr-2">
                                {alerts.length === 0 ? (
                                    <div className="text-center py-8 text-slate-600 flex flex-col items-center">
                                        <Bell size={32} className="mb-2 opacity-20" />
                                        <p>Nenhum alerta configurado.</p>
                                    </div>
                                ) : (
                                    alerts.map(alert => (
                                        <div key={alert.id} className={`flex items-center justify-between bg-slate-800 p-3 rounded-lg border border-slate-700 transition-all ${alert.enabled ? 'animate-in slide-in-from-top-2' : ''}`}>
                                            <div className="flex items-center gap-3">
                                                <div className={`w-3 h-3 rounded-full ${alert.enabled ? 'bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.6)]' : 'bg-slate-600'}`}></div>
                                                <div className="flex flex-col">
                                                    <span className={`font-mono font-bold ${alert.enabled ? 'text-white' : 'text-slate-500 line-through'}`}>
                                                        {alert.term}
                                                    </span>
                                                    <div className="flex items-center gap-2 text-[10px] text-slate-500">
                                                        <span className="flex items-center gap-1">
                                                            <Music size={10} /> {alert.sound || 'notification'}
                                                        </span>
                                                        {alert.tradeTypes && alert.tradeTypes.length > 0 && (
                                                            <span className="text-amber-400">
                                                                {alert.tradeTypes.join('/')}
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <button
                                                    onClick={() => handleTestAlert(alert)}
                                                    className="px-2 py-1 bg-blue-500/20 text-blue-400 hover:bg-blue-500/30 rounded text-xs font-bold transition-colors"
                                                    title="Testar alerta (Ctrl+T)"
                                                >
                                                    🔔
                                                </button>
                                                <button
                                                    onClick={() => toggleAlert(alert.id)}
                                                    className={`px-3 py-1 rounded text-xs font-bold transition-colors ${alert.enabled ? 'bg-green-500/20 text-green-400 hover:bg-green-500/30' : 'bg-slate-700 text-slate-400 hover:bg-slate-600'}`}
                                                >
                                                    {alert.enabled ? 'ON' : 'OFF'}
                                                </button>
                                                <button
                                                    onClick={() => removeAlert(alert.id)}
                                                    className="p-2 text-slate-500 hover:text-rose-400 hover:bg-rose-900/20 rounded transition-colors"
                                                >
                                                    <Trash2 size={16} />
                                                </button>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>
                    )}

                    {/* --- TAB: HISTORY --- */}
                    {activeTab === 'history' && (
                        <div className="space-y-4">
                            <div className="flex justify-between items-center">
                                <h3 className="text-sm font-bold text-slate-300 flex items-center gap-2">
                                    <History size={16} className="text-purple-400" /> Alertas Disparados
                                </h3>
                                {firedAlerts.length > 0 && (
                                    <button
                                        onClick={clearAlertHistory}
                                        className="text-xs text-slate-500 hover:text-rose-400 flex items-center gap-1"
                                    >
                                        <Trash2 size={12} /> Limpar
                                    </button>
                                )}
                            </div>

                            <div className="space-y-2 max-h-[400px] overflow-y-auto">
                                {firedAlerts.length === 0 ? (
                                    <div className="text-center py-8 text-slate-600">
                                        <History size={32} className="mx-auto mb-2 opacity-20" />
                                        <p>Nenhum alerta disparado ainda.</p>
                                    </div>
                                ) : (
                                    firedAlerts.map(fired => (
                                        <div key={fired.id} className="bg-slate-800/50 p-3 rounded-lg border border-slate-700 animate-in slide-in-from-top-2">
                                            <div className="flex justify-between items-start mb-2">
                                                <span className="text-xs font-bold text-amber-400">{fired.term}</span>
                                                <span className="text-[10px] text-slate-500">
                                                    {new Date(fired.firedAt).toLocaleTimeString()}
                                                </span>
                                            </div>
                                            <div className="text-xs text-slate-300 mb-2">
                                                <span className="font-mono">{fired.trade.message}</span>
                                            </div>
                                            <div className="flex justify-between items-center">
                                                <span className="text-[10px] text-slate-500">
                                                    {fired.trade.nick} • {fired.trade.timestamp}
                                                </span>
                                                <button
                                                    onClick={() => handleCopyNick(fired.trade.nick)}
                                                    className="text-[10px] text-blue-400 hover:text-blue-300 flex items-center gap-1"
                                                >
                                                    <Copy size={10} /> Copiar Nick
                                                </button>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>
                    )}

                    {/* --- TAB: ADS & TIMER --- */}
                    {activeTab === 'timer' && (
                        <div className="space-y-8">
                            {/* WTS Timer Config */}
                            <div className="space-y-4">
                                <h3 className="text-sm font-bold text-slate-300 flex items-center gap-2 border-b border-slate-800 pb-2">
                                    <Timer size={16} className="text-rose-400" /> WTS Cooldown Timer
                                </h3>

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-1">
                                        <label className="text-[10px] uppercase font-bold text-slate-500">Rótulo</label>
                                        <input
                                            type="text"
                                            value={timerConfig.label}
                                            onChange={(e) => setTimerConfig({ ...timerConfig, label: e.target.value })}
                                            className="w-full bg-slate-800 border border-slate-700 rounded px-2 py-1 text-sm outline-none focus:border-rose-500"
                                        />
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-[10px] uppercase font-bold text-slate-500">Duração (Min)</label>
                                        <input
                                            type="number"
                                            value={timerConfig.duration}
                                            onChange={(e) => setTimerConfig({ ...timerConfig, duration: Number(e.target.value) })}
                                            className="w-full bg-slate-800 border border-slate-700 rounded px-2 py-1 text-sm outline-none focus:border-rose-500"
                                        />
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-[10px] uppercase font-bold text-slate-500">Cor do Tema</label>
                                        <select
                                            value={timerConfig.color}
                                            onChange={(e) => setTimerConfig({ ...timerConfig, color: e.target.value as any })}
                                            className="w-full bg-slate-800 border border-slate-700 rounded px-2 py-1 text-sm outline-none focus:border-rose-500"
                                        >
                                            <option value="emerald">Emerald</option>
                                            <option value="amber">Amber</option>
                                            <option value="rose">Rose</option>
                                            <option value="blue">Blue</option>
                                            <option value="purple">Purple</option>
                                        </select>
                                    </div>
                                    <div className="flex items-end pb-1 gap-2">
                                        <button
                                            onClick={() => setTimerConfig({ ...timerConfig, soundEnabled: !timerConfig.soundEnabled })}
                                            className={`flex items-center gap-2 text-xs font-bold px-3 py-1.5 rounded w-1/2 justify-center transition-colors ${timerConfig.soundEnabled ? 'bg-indigo-500/20 text-indigo-400 border border-indigo-500/30' : 'bg-slate-800 text-slate-500 border border-slate-700'}`}
                                        >
                                            {timerConfig.soundEnabled ? <Volume2 size={14} /> : <VolumeX size={14} />} Som
                                        </button>
                                         <div className="w-1/2 flex flex-col justify-end">
                                            <label className="text-[9px] uppercase font-bold text-slate-500 mb-1">Volume</label>
                                            <input 
                                                type="range" 
                                                min="0" max="1" step="0.1"
                                                value={volume}
                                                onChange={(e) => setVolume(parseFloat(e.target.value))}
                                                className="w-full h-1.5 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-indigo-500"
                                            />
                                        </div>
                                    </div>
                                </div>

                                <button
                                    onClick={startTimer}
                                    className="w-full py-2 bg-slate-800 hover:bg-slate-700 border border-slate-600 rounded text-slate-300 font-bold text-sm transition-colors flex items-center justify-center gap-2"
                                >
                                    <Play size={14} /> Ativar Widget na Tela
                                </button>
                            </div>

                            {/* Ad Templates Manager */}
                            <div className="space-y-4">
                                <h3 className="text-sm font-bold text-slate-300 flex items-center gap-2 border-b border-slate-800 pb-2">
                                    <Copy size={16} className="text-blue-400" /> Salvar Mensagens (Ads)
                                </h3>

                                {/* Edit Form */}
                                <div className="bg-slate-800/30 p-3 rounded-lg border border-slate-700 space-y-3">
                                    <input
                                        type="text"
                                        value={newAdLabel}
                                        onChange={(e) => setNewAdLabel(e.target.value)}
                                        placeholder="Nome do Anúncio (Ex: Vendo Rares)"
                                        className="w-full bg-slate-900 border border-slate-700 rounded px-3 py-2 text-sm outline-none focus:border-blue-500"
                                    />
                                    <textarea
                                        value={newAdContent}
                                        onChange={(e) => setNewAdContent(e.target.value)}
                                        placeholder="Cole seu texto de propaganda aqui..."
                                        className="w-full bg-slate-900 border border-slate-700 rounded px-3 py-2 text-sm h-20 resize-none outline-none focus:border-blue-500 font-mono text-xs"
                                    />
                                    <button
                                        onClick={handleSaveAd}
                                        disabled={!newAdLabel || !newAdContent}
                                        className={`w-full py-1.5 rounded text-xs font-bold flex items-center justify-center gap-2 ${newAdLabel && newAdContent ? 'bg-blue-600 hover:bg-blue-500 text-white' : 'bg-slate-800 text-slate-500'}`}
                                    >
                                        <Save size={14} /> {editingAdId ? 'Atualizar' : 'Salvar Novo Template'}
                                    </button>
                                </div>

                                {/* List */}
                                <div className="space-y-2 max-h-[200px] overflow-y-auto">
                                    {adTemplates.length === 0 ? (
                                        <p className="text-center text-xs text-slate-600 py-4">Nenhum anúncio salvo.</p>
                                    ) : (
                                        adTemplates.map(ad => (
                                            <div key={ad.id} className="bg-slate-800 p-2 rounded border border-slate-700 flex items-center justify-between group">
                                                <div className="overflow-hidden">
                                                    <p className="font-bold text-xs text-slate-300 truncate">{ad.label}</p>
                                                    <p className="text-[10px] text-slate-500 truncate font-mono">{ad.content}</p>
                                                </div>
                                                <div className="flex items-center gap-1 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                                                    <button
                                                        onClick={() => handleCopyAd(ad.content)}
                                                        className="p-1.5 bg-blue-500/20 text-blue-400 hover:bg-blue-500 hover:text-white rounded"
                                                        title="Copiar"
                                                    >
                                                        <Copy size={14} />
                                                    </button>
                                                    <button
                                                        onClick={() => handleEditAd(ad)}
                                                        className="p-1.5 bg-slate-700 text-slate-300 hover:bg-slate-600 rounded"
                                                        title="Editar"
                                                    >
                                                        <Edit2 size={14} />
                                                    </button>
                                                    <button
                                                        onClick={() => removeTemplate(ad.id)}
                                                        className="p-1.5 hover:bg-rose-900/50 text-slate-500 hover:text-rose-400 rounded"
                                                        title="Deletar"
                                                    >
                                                        <Trash2 size={14} />
                                                    </button>
                                                </div>
                                            </div>
                                        ))
                                    )}
                                </div>
                            </div>
                        </div>
                    )}

                    {/* --- TAB: SETTINGS --- */}
                    {activeTab === 'settings' && (
                        <div className="space-y-6">
                            {/* Statistics Dashboard */}
                            <div className="bg-slate-800/30 p-4 rounded-lg border border-slate-700/50">
                                <div className="flex justify-between items-center mb-3">
                                    <h3 className="text-xs font-semibold text-slate-400 flex items-center gap-2">
                                        <TrendingUp size={14} className="text-emerald-400" />
                                        ESTATÍSTICAS (Hoje)
                                    </h3>
                                    <button
                                        onClick={resetStats}
                                        className="text-[10px] text-slate-500 hover:text-slate-300"
                                    >
                                        Resetar
                                    </button>
                                </div>
                                <div className="grid grid-cols-4 gap-2">
                                    <div className="text-center">
                                        <p className="text-2xl font-bold text-emerald-400">{stats.wts}</p>
                                        <p className="text-[10px] text-slate-500">WTS</p>
                                    </div>
                                    <div className="text-center">
                                        <p className="text-2xl font-bold text-blue-400">{stats.wtb}</p>
                                        <p className="text-[10px] text-slate-500">WTB</p>
                                    </div>
                                    <div className="text-center">
                                        <p className="text-2xl font-bold text-purple-400">{stats.wtt}</p>
                                        <p className="text-[10px] text-slate-500">WTT</p>
                                    </div>
                                    <div className="text-center">
                                        <p className="text-2xl font-bold text-amber-400">{stats.alerts}</p>
                                        <p className="text-[10px] text-slate-500">Alertas</p>
                                    </div>
                                </div>
                            </div>

                            {/* DND Mode */}
                            <div className="bg-slate-800/30 p-4 rounded-lg border border-slate-700/50">
                                <h3 className="text-xs font-semibold text-slate-400 flex items-center gap-2 mb-3">
                                    <Clock size={14} className="text-purple-400" />
                                    NÃO PERTURBE
                                </h3>
                                <div className="flex items-center justify-between mb-3">
                                    <span className="text-sm text-slate-300">Modo Silencioso</span>
                                    <button
                                        onClick={() => setDndMode(!dndMode)}
                                        className={`px-3 py-1 rounded text-xs font-bold transition-colors ${dndMode ? 'bg-purple-500/20 text-purple-400' : 'bg-slate-700 text-slate-400'}`}
                                    >
                                        {dndMode ? 'ON' : 'OFF'}
                                    </button>
                                </div>
                                {dndMode && (
                                    <div className="grid grid-cols-2 gap-2 animate-in slide-in-from-top-1">
                                        <div>
                                            <label className="text-[10px] text-slate-500">Início</label>
                                            <input
                                                type="time"
                                                value={dndSchedule.start}
                                                onChange={(e) => setDndSchedule({ ...dndSchedule, start: e.target.value })}
                                                className="w-full bg-slate-900 border border-slate-700 rounded px-2 py-1 text-xs"
                                            />
                                        </div>
                                        <div>
                                            <label className="text-[10px] text-slate-500">Fim</label>
                                            <input
                                                type="time"
                                                value={dndSchedule.end}
                                                onChange={(e) => setDndSchedule({ ...dndSchedule, end: e.target.value })}
                                                className="w-full bg-slate-900 border border-slate-700 rounded px-2 py-1 text-xs"
                                            />
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Export/Import */}
                            <div className="bg-slate-800/30 p-4 rounded-lg border border-slate-700/50">
                                <h3 className="text-xs font-semibold text-slate-400 flex items-center gap-2 mb-3">
                                    <Download size={14} className="text-blue-400" />
                                    BACKUP DE CONFIGURAÇÕES
                                </h3>
                                <div className="grid grid-cols-2 gap-2">
                                    <button
                                        onClick={exportConfig}
                                        className="py-2 bg-blue-600 hover:bg-blue-500 text-white rounded text-xs font-bold flex items-center justify-center gap-2"
                                    >
                                        <Download size={14} /> Exportar
                                    </button>
                                    <button
                                        onClick={handleImport}
                                        className="py-2 bg-slate-700 hover:bg-slate-600 text-white rounded text-xs font-bold flex items-center justify-center gap-2"
                                    >
                                        <Upload size={14} /> Importar
                                    </button>
                                </div>
                                <p className="text-[10px] text-slate-600 mt-2">
                                    Backup automático a cada 5 minutos
                                </p>
                            </div>

                            {/* Quick Msg Config */}
                            <div className="bg-slate-800/30 p-4 rounded-lg border border-slate-700/50">
                                <h3 className="text-xs font-semibold text-slate-400 flex items-center gap-2 mb-3">
                                    <MessageSquare size={14} className="text-blue-400" />
                                    MENSAGEM RÁPIDA (Double Click)
                                </h3>
                                <p className="text-xs text-slate-500 mb-2">
                                    Use <code>{'{nick}'}</code> para substituir pelo nome do jogador.
                                </p>
                                <input
                                    type="text"
                                    value={quickMsgTemplate}
                                    onChange={handleTemplateChange}
                                    className="w-full bg-slate-950 border border-slate-700 rounded px-3 py-2 text-sm text-blue-200 font-mono focus:border-blue-500 outline-none"
                                />
                                <div className="mt-2 text-[10px] text-slate-600">
                                    Exemplo: <code>/t Jotasiete Hello, cod me this</code>
                                </div>
                            </div>

                            {/* Ticker Speed */}
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

                            {/* Keyboard Shortcuts Info */}
                            <div className="bg-blue-900/10 p-3 rounded-lg border border-blue-500/20">
                                <h4 className="text-xs font-bold text-blue-400 mb-2">⌨️ Atalhos de Teclado</h4>
                                <div className="space-y-1 text-[10px] text-blue-200">
                                    <p><kbd className="bg-blue-500/20 px-1 rounded">Ctrl+M</kbd> Abrir/Fechar Monitor</p>
                                    <p><kbd className="bg-blue-500/20 px-1 rounded">Ctrl+T</kbd> Testar Último Alerta</p>
                                    <p><kbd className="bg-blue-500/20 px-1 rounded">ESC</kbd> Fechar Modal</p>
                                </div>
                            </div>
                        </div>
                    )}

                </div>
            </div>
        </div>
    );
};

