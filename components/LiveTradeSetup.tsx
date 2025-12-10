import React, { useState, useEffect } from 'react';
import { open } from '@tauri-apps/plugin-dialog';
import { liveTradeMonitor } from '../services/LiveTradeMonitor';
import { Shield, FileText, CheckCircle, AlertTriangle, Play, X, HelpCircle, FolderSearch } from 'lucide-react';
import { toast } from 'sonner';

export const LiveTradeSetup = () => {
    const [isOpen, setIsOpen] = useState(false);
    const [consent, setConsent] = useState(false);
    const [filePath, setFilePath] = useState('');
    const [isWatching, setIsWatching] = useState(false);
    const [showPathHelp, setShowPathHelp] = useState(false);

    useEffect(() => {
        const storedConsent = localStorage.getItem('live_monitor_consent') === 'true';
        const storedPath = localStorage.getItem('wurm_log_path');
        setConsent(storedConsent);
        if (storedPath) setFilePath(storedPath);
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

        try {
            await liveTradeMonitor.startWatching(filePath);
            setIsWatching(true);
            setIsOpen(false);
            toast.success("Monitoramento iniciado! Acompanhe o Live Feed.");
        } catch (error) {
            console.error(error);
            toast.error("Falha ao iniciar monitor. Verifique as permissões.");
        }
    };

    const handleConsent = (check: boolean) => {
        setConsent(check);
        localStorage.setItem('live_monitor_consent', String(check));
    };

    if (!isOpen) {
        return (
            <button
                onClick={() => setIsOpen(true)}
                className={`fixed bottom-6 right-6 p-4 rounded-full shadow-lg transition-all z-50 ${isWatching ? 'bg-emerald-600 hover:bg-emerald-700 animate-pulse' : 'bg-blue-600 hover:bg-blue-700'}`}
                title="Configurar Live Monitor"
            >
                {isWatching ? <CheckCircle className="text-white w-6 h-6" /> : <Play className="text-white w-6 h-6" />}
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
                    {/* Step 1: Privacy */}
                    <div className="bg-slate-800/50 p-4 rounded-lg border border-slate-700 hover:border-blue-500/30 transition-colors">
                        <h3 className="text-lg font-semibold text-white mb-2 flex items-center gap-2">
                            <Shield className="text-blue-400" size={18} /> 1. Consentimento de Uso
                        </h3>
                        <p className="text-slate-300 text-sm mb-4 leading-relaxed">
                            Ao ativar, o app lerá localmente o arquivo <code>logs/trade.txt</code> do seu jogo.
                            <br />
                            <span className="text-slate-400 text-xs italic">Nenhum dado pessoal além de ofertas públicas de mercado é enviado.</span>
                        </p>
                        <label className="flex items-center gap-3 cursor-pointer group select-none">
                            <div className={`w-5 h-5 rounded border flex items-center justify-center transition-all ${consent ? 'bg-emerald-500 border-emerald-500 shadow-lg shadow-emerald-500/20' : 'border-slate-500 group-hover:border-slate-300'}`}>
                                {consent && <CheckCircle size={14} className="text-white" />}
                            </div>
                            <input
                                type="checkbox"
                                className="hidden"
                                checked={consent}
                                onChange={(e) => handleConsent(e.target.checked)}
                            />
                            <span className={`text-sm transition-colors ${consent ? 'text-white font-medium' : 'text-slate-400'}`}>
                                Concordo em compartilhar dados de mercado do meu cliente.
                            </span>
                        </label>
                    </div>

                    {/* Step 2: File Selection */}
                    <div className={`transition-all duration-300 ${consent ? 'opacity-100 translate-y-0' : 'opacity-40 translate-y-2 pointer-events-none filter blur-sm'}`}>
                        <div className="flex justify-between items-center mb-2">
                            <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                                <FolderSearch className="text-amber-400" size={18} /> 2. Localizar Arquivo
                            </h3>
                            <button
                                onClick={() => setShowPathHelp(!showPathHelp)}
                                className="text-xs text-blue-400 hover:text-blue-300 flex items-center gap-1 bg-blue-400/10 px-2 py-1 rounded"
                            >
                                <HelpCircle size={12} /> Onde fica?
                            </button>
                        </div>

                        {showPathHelp && (
                            <div className="mb-3 p-3 bg-blue-900/20 border border-blue-500/20 rounded text-xs text-blue-200 font-mono break-all animate-in slide-in-from-top-1">
                                <p className="mb-1 text-slate-400 font-sans font-bold">Caminho Padrão (Steam):</p>
                                ...\SteamLibrary\steamapps\common\Wurm Online\gamedata\players\SEU_NICK\logs\_2024-12 (Mês Atual)\Trade.txt
                            </div>
                        )}

                        <p className="text-slate-400 text-xs mb-3">
                            Selecione o arquivo <code>Trade.YYYY-MM.txt</code> correspondente ao mês atual.
                        </p>

                        <div className="flex gap-2">
                            <div className="flex-1 bg-slate-950 border border-slate-700 rounded px-3 py-2 text-sm text-slate-300 font-mono truncate relative group">
                                {filePath || <span className="text-slate-600 italic">Nenhum arquivo selecionado...</span>}
                                {filePath && (
                                    <div className="absolute inset-0 bg-slate-900/90 text-white text-xs flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                                        {filePath}
                                    </div>
                                )}
                            </div>
                            <button
                                onClick={handleFileSelect}
                                className="bg-slate-700 hover:bg-slate-600 active:bg-slate-500 text-white px-4 py-2 rounded text-sm transition-colors font-medium border border-slate-600"
                            >
                                Selecionar
                            </button>
                        </div>
                    </div>

                    <button
                        onClick={handleStart}
                        disabled={!consent || !filePath}
                        className={`w-full py-4 rounded-lg font-bold text-lg flex items-center justify-center gap-2 transition-all transform active:scale-[0.98] ${consent && filePath
                                ? 'bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white shadow-lg shadow-blue-500/20'
                                : 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700'
                            }`}
                    >
                        {isWatching ? (
                            <>
                                <span className="relative flex h-3 w-3 mr-1">
                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                                    <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
                                </span>
                                Monitorando Ativamente...
                            </>
                        ) : (
                            <>
                                Iniciar Monitoramento
                                <Play size={20} fill="currentColor" />
                            </>
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
};
