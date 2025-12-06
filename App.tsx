import React, { useState, useEffect } from 'react';
import { Sidebar } from './components/layout/Sidebar';
import { Dashboard } from './components/Dashboard';
import { MarketTable } from './components/market/MarketTable';
import { ChartsView } from './components/ChartsView';
import { MLPredictor } from './components/market/MLPredictor';
import { PriceManager } from './components/market/PriceManager';
import { Login } from './components/auth/Login';
import { AdminPanel } from './components/AdminPanel';
import { NewsTicker } from './components/layout/NewsTicker';
import { ProtectedAdmin } from './components/auth/ProtectedAdmin';
import { AuthCallback } from './components/auth/AuthCallback';
import { ViewState, MarketItem, ChartDataPoint, Language } from './types';
import { parseTradeFile, FileParser } from './services/fileParser';
import { generateChartDataFromHistory } from './services/dataUtils';
import { parsePriceCSV, loadPricesFromStorage, savePricesToStorage } from './services/priceUtils';
import { DEFAULT_PRICES_CSV } from './services/defaultPrices';
import { translations } from './services/i18n';
import { useAuth } from './contexts/AuthContext';
import { Globe, LogOut, Shield, Eye, EyeOff, User } from 'lucide-react';
import { IdentityService } from './services/identity';
import { supabase } from './services/supabase';
import { sanitizeItemName, sanitizeSeller } from './services/securityUtils';

const App: React.FC = () => {
    // Use state to lock the callback view so it doesn't unmount if hash is cleared
    const [isCallback, setIsCallback] = useState(false);
    useEffect(() => {
        if (window.location.pathname === '/auth/v1/callback' || window.location.hash.includes('access_token')) {
            setIsCallback(true);
        }
    }, []);
    const { user, role, loading: authLoading, signOut } = useAuth();
    const [currentView, setCurrentView] = useState<ViewState>(ViewState.DASHBOARD);
    const [marketData, setMarketData] = useState<MarketItem[]>([]);
    const [chartData, setChartData] = useState<ChartDataPoint[]>([]);
    const [referencePrices, setReferencePrices] = useState<Record<string, number>>({});
    const [loading, setLoading] = useState(false);
    const [language, setLanguage] = useState<Language>('en');
    const [isProcessingFile, setIsProcessingFile] = useState(false);
    const [dataSource, setDataSource] = useState<'NONE' | 'FILE' | 'DATABASE'>('NONE');
    // Identity State
    const [selectedPlayer, setSelectedPlayer] = useState<string | null>(null);
    const [myVerifiedNick, setMyVerifiedNick] = useState<string | null>(null);
    const [showEmail, setShowEmail] = useState(false);
    // Fetch verified nick on mount
    useEffect(() => {
        const fetchIdentity = async () => {
            if (!user) return;
            const nicks = await IdentityService.getMyNicks();
            const verified = nicks.find(n => n.is_verified);
            if (verified) {
                setMyVerifiedNick(verified.game_nick);
            }
        };
        fetchIdentity();
    }, [user]);
    const handleHeaderProfileClick = () => {
        if (myVerifiedNick) {
            setSelectedPlayer(myVerifiedNick);
            setCurrentView(ViewState.DASHBOARD);
        } else {
            setCurrentView(ViewState.DASHBOARD);
        }
    };
    // Load Prices on Mount (Storage -> Default) - MUST be before conditional returns
    useEffect(() => {
        try {
            const stored = loadPricesFromStorage();
            if (stored && Object.keys(stored).length > 0) {
                setReferencePrices(stored);
                if (import.meta.env.DEV) console.log(`Loaded ${Object.keys(stored).length} prices from LocalStorage.`);
            } else {
                const defaults = parsePriceCSV(DEFAULT_PRICES_CSV);
                setReferencePrices(defaults);
                if (import.meta.env.DEV) console.log(`Loaded ${Object.keys(defaults).length} default prices.`);
            }
        } catch (e) {
            console.error("Failed to load prices", e);
        }
    }, []);
    // Load trade data from database if no file uploaded
    useEffect(() => {
        const loadDatabaseData = async () => {
            // Only load from DB if no file data exists
            if (marketData.length === 0 && dataSource === 'NONE') {
                try {
                    // CHAMADA DIRETA AO SUPABASE (bypass IntelligenceService)
                    // ðŸ“Š INCREASED LIMIT: 5000 -> 50000 to match Supabase max_rows config
                    const { data: logs, error } = await supabase.rpc('get_trade_logs_for_market', {
                        limit_count: 50000
                    });

                    if (error) {
                        console.error('Supabase RPC error:', error);
                        return;
                    }

                    if (import.meta.env.DEV) console.log('ðŸ“Š DIRECT CALL: Supabase retornou', logs?.length || 0, 'logs');

                    if (logs && logs.length > 0) {
                        const converted: MarketItem[] = logs.map((log: any) => {
                            const raw = log.message || '';
                            let name = raw;
                            let price = 0;

                            price = FileParser.normalizePrice(raw);
                            if (raw.includes('[')) {
                                const match = raw.match(/\[(.*?)\]/);
                                if (match) {
                                    name = match[1];
                                }
                            }

                            name = name
                                .replace(/QL:[\d.]+/gi, '')
                                .replace(/DMG:[\d.]+/gi, '')
                                .replace(/WT:[\d.]+/gi, '')
                                .replace(/\bnull\b/gi, '')
                                .replace(/\bcommon\b/gi, '')
                                .replace(/\brare\b/gi, '')
                                .replace(/\bsupreme\b/gi, '')
                                .replace(/\bfantastic\b/gi, '')
                                .replace(/^[\d.]+[kx]\s*/i, '')
                                .replace(/\s+/g, ' ')
                                .trim();
                            name = name.charAt(0).toUpperCase() + name.slice(1);

                            // ðŸ”’ SECURITY: Sanitize name and seller to remove auth tokens
                            const safeName = sanitizeItemName(name);
                            const safeSeller = sanitizeSeller(log.nick || 'Unknown');

                            return {
                                id: String(log.id),
                                name: safeName,
                                seller: safeSeller,
                                price: price,
                                quantity: 1,
                                quality: 0,
                                rarity: 'Common',
                                material: 'Unknown',
                                orderType: log.trade_type || 'UNKNOWN',
                                location: log.server || 'Unknown',
                                timestamp: new Date(log.trade_timestamp_utc).toISOString()
                            };
                        });
                        setMarketData(converted);
                        setDataSource('DATABASE');
                        if (import.meta.env.DEV) console.log(`âœ… Loaded ${logs.length} records from database (Cleaned & Secured)`);
                    }
                } catch (error) {
                    console.error('Failed to load from database:', error);
                }
            }
        };
        loadDatabaseData();
    }, []);
    // If we are in callback mode, ALWAYS show AuthCallback until it redirects
    if (isCallback) {
        return <AuthCallback />;
    }
    // Show login if not authenticated
    if (authLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-slate-900">
                <div className="animate-spin w-12 h-12 border-4 border-amber-500 border-t-transparent rounded-full"></div>
            </div>
        );
    }
    if (!user) {
        return <Login />;
    }
    // Wrapper to update prices AND save to storage
    const handleUpdatePrices = (newPrices: Record<string, number>) => {
        setReferencePrices(newPrices);
        savePricesToStorage(newPrices);
    };
    const handleFileUpload = async (file: File) => {
        // RESET STATE before processing new file to clear any "bad" cache
        setMarketData([]);
        setChartData([]);
        setIsProcessingFile(true);
        setLoading(true);
        try {
            // 1. Parse File
            const parsedData = await parseTradeFile(file);
            if (parsedData.length > 0) {
                setMarketData(parsedData);
                setDataSource('FILE');
                // 2. Generate Charts from Real Data
                const realCharts = generateChartDataFromHistory(parsedData);
                setChartData(realCharts);
                // Switch to market view to see the data immediately
                setCurrentView(ViewState.MARKET);
                alert(`Successfully imported ${parsedData.length.toLocaleString()} trade records.`);
            } else {
                alert("File appears empty or unrecognized format.");
            }
        } catch (error) {
            console.error("Failed to parse file:", error);
            alert("Error parsing file. See console for details.");
        } finally {
            setIsProcessingFile(false);
            setLoading(false);
        }
    };
    const renderContent = () => {
        const t = translations[language];
        if (loading) {
            return (
                <div className="flex h-[80vh] items-center justify-center flex-col gap-4">
                    <div className="w-16 h-16 border-4 border-amber-500 border-t-transparent rounded-full animate-spin"></div>
                    <div className="text-slate-400 animate-pulse">{t.processing}</div>
                </div>
            )
        }
        switch (currentView) {
            case ViewState.DASHBOARD:
                return (
                    <Dashboard
                        onFileUpload={handleFileUpload}
                        isProcessing={isProcessingFile}
                        marketData={marketData}
                        language={language}
                        selectedPlayer={selectedPlayer}
                        onPlayerSelect={setSelectedPlayer}
                    />
                );
            case ViewState.MARKET:
                return <MarketTable data={marketData} referencePrices={referencePrices} />;
            case ViewState.ANALYTICS:
                // Pass raw marketData for the new granular charts
                return <ChartsView data={chartData} rawItems={marketData} />;
            case ViewState.PREDICTOR:
                return <MLPredictor data={marketData} />;
            case ViewState.PRICEMANAGER:
                return (
                    <ProtectedAdmin>
                        <PriceManager prices={referencePrices} onUpdatePrices={handleUpdatePrices} />
                    </ProtectedAdmin>
                );
            case ViewState.ADMIN:
                return <AdminPanel />;
            case ViewState.SETTINGS:
                return (
                    <div className="flex flex-col items-center justify-start h-full text-slate-500 pt-12 animate-fade-in">
                        <div className="bg-slate-800 p-8 rounded-xl border border-slate-700 w-full max-w-md shadow-lg">
                            <div className="text-center mb-8">
                                <h2 className="text-2xl font-bold text-white mb-2">{t.appSettings}</h2>
                                <div className="text-sm font-mono text-slate-600">v3.0.0</div>
                            </div>
                            <div className="space-y-6">
                                {/* Language Switcher */}
                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-slate-300 flex items-center gap-2">
                                        <Globe className="w-4 h-4 text-amber-500" />
                                        {t.language}
                                    </label>
                                    <div className="grid grid-cols-2 gap-2 bg-slate-900 p-1 rounded-lg border border-slate-700">
                                        <button
                                            onClick={() => setLanguage('en')}
                                            className={`py-2 text-sm font-medium rounded-md transition-all ${language === 'en' ? 'bg-slate-700 text-white shadow-sm' : 'text-slate-500 hover:text-slate-300'}`}
                                        >
                                            English
                                        </button>
                                        <button
                                            onClick={() => setLanguage('pt')}
                                            className={`py-2 text-sm font-medium rounded-md transition-all ${language === 'pt' ? 'bg-amber-600 text-white shadow-sm' : 'text-slate-500 hover:text-slate-300'}`}
                                        >
                                            Português
                                        </button>
                                    </div>
                                </div>
                                {/* Contact Info */}
                                <div className="space-y-2 pt-4 border-t border-slate-700/50">
                                    <label className="text-sm font-medium text-slate-300 flex items-center gap-2">
                                        <User className="w-4 h-4 text-emerald-500" />
                                        Developer Contact
                                    </label>
                                    <div className="bg-slate-900/50 p-4 rounded-lg border border-slate-700/50 space-y-3">
                                        <div className="flex items-center justify-between text-sm">
                                            <span className="text-slate-400">Email:</span>
                                            <span className="text-white font-mono select-all">tortadev@gmail.com</span>
                                        </div>
                                        <div className="flex items-center justify-between text-sm">
                                            <span className="text-slate-400">In-game Nick:</span>
                                            <span className="text-amber-400 font-bold">Jotasiete</span>
                                        </div>
                                        <p className="text-xs text-slate-500 mt-2 italic">
                                            Report bugs or send feedback directly.
                                        </p>
                                    </div>
                                </div>
                                <div className="pt-6 border-t border-slate-700 space-y-2">
                                    <div className="flex justify-between text-sm">
                                        <span>{t.dataSource}:</span>
                                        <span className={`font-mono font-bold ${dataSource === 'FILE' ? 'text-emerald-400' : 'text-slate-400'}`}>
                                            {dataSource}
                                        </span>
                                    </div>
                                    <div className="flex justify-between text-sm">
                                        <span>{t.version}:</span>
                                        <span className="text-slate-400">3.0.0</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                );
            default:
                return (
                    <Dashboard
                        onFileUpload={handleFileUpload}
                        isProcessing={isProcessingFile}
                        marketData={marketData}
                        language={language}
                        selectedPlayer={selectedPlayer}
                        onPlayerSelect={setSelectedPlayer}
                    />
                );
        }
    };
    return (
        <div className="min-h-screen bg-slate-900 text-slate-200 font-sans">
            {/* Global News Ticker */}
            <NewsTicker />
            <Sidebar currentView={currentView} onNavigate={setCurrentView} language={language} />
            <main className="ml-64 p-8 min-h-screen transition-all duration-300 pt-16">
                <header className="flex justify-between items-center mb-8 pb-6 border-b border-slate-800">
                    <div className="flex items-center gap-4">
                        {dataSource === 'FILE' ? (
                            <span className="px-3 py-1 bg-emerald-500/20 text-emerald-400 text-xs font-bold rounded-full border border-emerald-500/30 animate-fade-in">
                                LIVE FILE DATA
                            </span>
                        ) : dataSource === 'DATABASE' ? (
                            <span className="px-3 py-1 bg-blue-500/20 text-blue-400 text-xs font-bold rounded-full border border-blue-500/30 animate-fade-in">
                                DATABASE CONNECTED
                            </span>
                        ) : (
                            <span className="px-3 py-1 bg-slate-700 text-slate-400 text-xs font-bold rounded-full border border-slate-600">
                                NO DATA LOADED
                            </span>
                        )}
                    </div>
                    <div className="flex items-center gap-4">
                        <div className="text-right hidden sm:block cursor-pointer hover:opacity-80 transition-opacity" onClick={handleHeaderProfileClick}>
                            <div className="flex flex-col items-end">
                                {/* Nick Display - Larger & Prominent */}
                                {myVerifiedNick ? (
                                    <div className="text-2xl font-bold text-white flex items-center gap-2">
                                        <span className="text-emerald-400 flex items-center gap-1">
                                            <Shield className="w-4 h-4" /> {myVerifiedNick}
                                        </span>
                                        <span className={`px-2 py-0.5 rounded text-[10px] font-mono uppercase tracking-wider ${role === 'admin' ? 'bg-amber-500 text-black' :
                                            role === 'moderator' ? 'bg-purple-500 text-white' :
                                                'bg-slate-700 text-slate-300'
                                            }`}>
                                            {role}
                                        </span>
                                    </div>
                                ) : (
                                    <div className="text-lg font-bold text-slate-400">Guest User</div>
                                )}

                                {/* Email Display - Hidden by default with Toggle */}
                                <div className="flex items-center gap-2 mt-1 bg-slate-800/50 px-2 py-1 rounded border border-slate-700/50">
                                    <span className="text-xs text-slate-400 font-mono tracking-wide">
                                        {showEmail ? user.email : '••••••••••••••••'}
                                    </span>
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            setShowEmail(!showEmail);
                                        }}
                                        className="text-slate-600 hover:text-slate-400 transition-colors"
                                        title={showEmail ? "Hide Email" : "Show Email"}
                                    >
                                        {showEmail ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                                    </button>
                                </div>
                            </div>
                        </div>
                        <button
                            onClick={signOut}
                            className="p-2 hover:bg-slate-800 rounded-lg transition text-slate-400 hover:text-rose-400"
                            title="Sign Out"
                        >
                            <LogOut className="w-5 h-5" />
                        </button>
                    </div>
                </header>
                {renderContent()}
            </main>
        </div>
    );
};
export default App;


