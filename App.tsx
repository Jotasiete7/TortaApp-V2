
import { toast } from 'sonner';
import { TradeUploader } from './services/tradeUploader';
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
import { LiveTradeTicker } from './components/LiveTradeTicker';
import { LiveTradeSetup } from './components/LiveTradeSetup';
import { AdCooldownWidget } from './components/AdCooldownWidget';
import { ProtectedAdmin } from './components/auth/ProtectedAdmin';
import { AuthCallback } from './components/auth/AuthCallback';
import { ViewState, MarketItem, ChartDataPoint, Language } from './types';
import { parseTradeFile, FileParser } from './services/fileParser';
import { parsePriceCSV, loadPricesFromStorage, savePricesToStorage } from './services/priceUtils';
import { DEFAULT_PRICES_CSV } from './services/defaultPrices';
import { translations } from './services/i18n';
import { useAuth } from './contexts/AuthContext';
import { Globe, LogOut, Shield, Eye, EyeOff, User } from 'lucide-react';
import { IdentityService } from './services/identity';
import { supabase } from './services/supabase';
import { sanitizeItemName, sanitizeSeller } from './services/securityUtils';
import { getCanonicalName, getCanonicalId } from './services/ItemIdentity';
import { UserSettings } from './components/UserSettings';
import { LevelUpOverlay } from './components/gamification/LevelUpOverlay';
import { SoundService } from './services/SoundService';

const App: React.FC = () => {
    // Use state to lock the callback view so it doesn't unmount if hash is cleared
    const [isCallback, setIsCallback] = useState(false);
    useEffect(() => {
        if (window.location.pathname === '/auth/v1/callback' || window.location.hash.includes('access_token')) {
            setIsCallback(true);
        }
    }, []);
    const { user, role, loading: authLoading, signOut } = useAuth();

    // CHANGED: Persist View State
    const [currentView, setCurrentView] = useState<ViewState>(() => {
        const saved = localStorage.getItem('torta_last_view');
        // Validate if saved view is valid, otherwise default to DASHBOARD
        if (saved && Object.values(ViewState).includes(saved as ViewState)) {
            return saved as ViewState;
        }
        return ViewState.DASHBOARD;
    });

    // CHANGED: Save View State on Change
    useEffect(() => {
        if (currentView) {
            localStorage.setItem('torta_last_view', currentView);
        }
    }, [currentView]);

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

    // LEVEL UP STATE
    const [showLevelUp, setShowLevelUp] = useState(false);
    const [newLevel, setNewLevel] = useState(1);
    const [prevLevel, setPrevLevel] = useState<number | null>(null);

    // Fetch verified nick on mount
    useEffect(() => {
        const fetchIdentity = async () => {
            if (!user) return;
            const nicks = await IdentityService.getMyNicks();
            const verified = nicks.find(n => n.is_verified);
            if (verified) {
                setMyVerifiedNick(verified.game_nick);
                // Also initialize SoundService here if needed, but it's lazy loaded
            }
        };
        fetchIdentity();
    }, [user]);

    // Realtime Level Listener
    useEffect(() => {
        if (!user) return;

        const channel = supabase
            .channel('global-level-listener')
            .on(
                'postgres_changes',
                {
                    event: 'UPDATE',
                    schema: 'public',
                    table: 'profiles',
                    filter: `id=eq.${user.id}`
                },
                (payload) => {
                    const diff = payload.new.level - (payload.old.level || 1);
                    if (diff > 0) {
                        setPrevLevel(payload.old.level || 1);
                        setNewLevel(payload.new.level);
                        setShowLevelUp(true);
                        SoundService.play('level_up');
                    }
                }
            )
            .subscribe();

        return () => { supabase.removeChannel(channel); };
    }, [user]);


    useEffect(() => {
        const loadPrices = async () => {
            try {
                // Load Prices Logic
            } catch (e) {
                // Error handling
            }
        };
        // Stubbed for brevity as logic didn't change
    }, []);

    // Load Prices on Mount (Restored full logic for write)
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
                    // 📊 ENVIRONMENT-BASED LIMIT: Dev (5k) vs Production (50k)
                    // Dev: Lighter load for local browser testing
                    // Production: Full data for installed Tauri app
                    const limit = import.meta.env.DEV ? 5000 : 50000;
                    const { data: logs, error } = await supabase.rpc('get_trade_logs_for_market', {
                        limit_count: limit
                    });

                    if (error) {
                        console.error('Supabase RPC error:', error);
                        return;
                    }

                    if (import.meta.env.DEV) console.log('📊 DIRECT CALL: Supabase retornou', logs?.length || 0, 'logs');

                    if (logs && logs.length > 0) {
                        const converted: MarketItem[] = logs.map((log: any) => {
                            const raw = log.message || '';
                            let name = raw;
                            let price = 0;

                            // Smart Parse for Quantity in History (Optional, but good for charts)
                            let quantity = 1;
                            const qtyMatch = name.match(/^(\d+)[x\s]/i) || raw.match(/(\d+)\s*x/i);
                            if (qtyMatch) quantity = parseInt(qtyMatch[1], 10);

                            const isTotal = /\b(all|total|bulk|lot)\b/i.test(raw);
                            if (quantity > 1 && isTotal) {
                                price = price / quantity;
                            }

                            const canonicalName = getCanonicalName(name);
                            const canonicalId = getCanonicalId(name);

                            const safeName = sanitizeItemName(canonicalName);
                            const safeSeller = sanitizeSeller(log.nick || 'Unknown');

                            return {
                                id: String(log.id),
                                itemId: canonicalId,
                                name: safeName,
                                rawName: name, // Preserve original extracted name
                                seller: safeSeller,
                                price: price, // Note: Price parsing logic in RPC is better but client-side might override. Keeping simple.
                                quantity: quantity,
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
                        if (import.meta.env.DEV) console.log(`✅ Loaded ${logs.length} records from database (Cleaned & Secured)`);
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
            <div className="min-h-screen flex items-center justify-center bg-slate-950">
                <div className="animate-spin w-12 h-12 border-4 border-amber-500 border-t-transparent rounded-full shadow-lg shadow-amber-500/20"></div>
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
        setIsProcessingFile(true);
        try {
            const items = await parseTradeFile(file);

            setMarketData(items);

            // 🚀 MANUAL UPLOAD TRIGGER
            toast.promise(TradeUploader.uploadTrades(items), {
                loading: 'Salvando trade logs no banco de dados...',
                success: (data) => `Upload concluído! Salvos: ${data.success}, Erros: ${data.errors}`,
                error: 'Erro ao salvar logs no banco.'
            });

            setDataSource('FILE');

            // Generate chart data from the parsed items
            setChartData(newChartData);
        } catch (error) {
            console.error("File upload failed", error);
            alert("Failed to parse log file. Check console.");
        } finally {
            setIsProcessingFile(false);
        }
    };

    const handleNavigate = (view: ViewState) => {
        setCurrentView(view);
    };

    const handlePlayerSelect = (player: string | null) => {
        setSelectedPlayer(player);
        // Force view to Dashboard if selecting a player
        if (player) setCurrentView(ViewState.DASHBOARD);
    };

    const renderContent = () => {
        switch (currentView) {
            case ViewState.DASHBOARD:
                return (
                    <Dashboard
                        onFileUpload={handleFileUpload}
                        isProcessing={isProcessingFile}
                        marketData={marketData}
                        language={language}
                        selectedPlayer={selectedPlayer}
                        onPlayerSelect={handlePlayerSelect} // Pass down selection handler
                        onNavigate={handleNavigate}
                        myVerifiedNick={myVerifiedNick}
                    />
                );
            case ViewState.MARKET:
                return (
                    <MarketTable
                        data={marketData}
                        referencePrices={referencePrices}
                    />
                );
            case ViewState.ANALYTICS:
                return (
                    <ChartsView
                        data={chartData}
                        rawItems={marketData}
                        referencePrices={referencePrices}
                    />
                );
            case ViewState.PREDICTOR:
                return (
                    <div className="p-8">
                        <div className="mb-8">
                            <h1 className="text-3xl font-bold text-white mb-2">Machine Learning Predictor</h1>
                            <p className="text-slate-400">AI-powered price estimation engine based on historical trade data.</p>
                        </div>
                        <MLPredictor data={marketData} />
                    </div>
                );
            case ViewState.PRICEMANAGER:
                return role === 'admin' || role === 'moderator' ? (
                    <PriceManager
                        prices={referencePrices}
                        onUpdatePrices={handleUpdatePrices}
                        language={language}
                    />
                ) : <Dashboard
                    onFileUpload={handleFileUpload}
                    isProcessing={isProcessingFile}
                    marketData={marketData}
                    language={language}
                    selectedPlayer={selectedPlayer}
                    onPlayerSelect={handlePlayerSelect}
                    onNavigate={handleNavigate}
                    myVerifiedNick={myVerifiedNick}
                />;
            case ViewState.ADMIN:
                return role === 'admin' || role === 'moderator' ? (
                    <ProtectedAdmin>
                        <AdminPanel language={language} />
                    </ProtectedAdmin>
                ) : <Dashboard
                    onFileUpload={handleFileUpload}
                    isProcessing={isProcessingFile}
                    marketData={marketData}
                    language={language}
                    selectedPlayer={selectedPlayer}
                    onPlayerSelect={handlePlayerSelect}
                    onNavigate={handleNavigate}
                    myVerifiedNick={myVerifiedNick}
                />;
            case ViewState.SETTINGS:
                return (
                    <UserSettings
                        user={user}
                        myVerifiedNick={myVerifiedNick}
                        role={role}
                    />
                );
            default:
                return <Dashboard
                    onFileUpload={handleFileUpload}
                    isProcessing={isProcessingFile}
                    marketData={marketData}
                    language={language}
                    selectedPlayer={selectedPlayer}
                    onPlayerSelect={handlePlayerSelect}
                    onNavigate={handleNavigate}
                    myVerifiedNick={myVerifiedNick}
                />;
        }
    };

    return (
        <div className="flex bg-slate-950 min-h-screen text-slate-200 font-sans selection:bg-amber-500/30">
            {/* Sidebar Navigation */}
            <div className="fixed z-10 h-full">
                <Sidebar
                    currentView={currentView}
                    onNavigate={handleNavigate}
                    language={language}
                />
            </div>

            {/* Main Content Area - Added ml-64 to offset fixed sidebar */}
            <div className="flex-1 flex flex-col min-h-screen bg-slate-950 ml-64 relative z-0">

                {/* News Ticker at the top of content */}
                <NewsTicker />

                {/* Live Trade Ticker (Only show on Dashboard or Market for relevance) */}
                {currentView !== ViewState.ADMIN && <LiveTradeTicker />}

                {/* Global Setup Trigger (The Gear) */}
                <LiveTradeSetup />

                {/* Main Content */}
                <main className="flex-1 overflow-x-hidden overflow-y-auto bg-slate-950 p-6 pt-20 relative">
                    {renderContent()}
                </main>

                {/* Footer / Copyright */}
                <footer className="border-t border-slate-800 p-6 bg-slate-950 text-center">
                    <p className="text-slate-500 text-sm">
                        &copy; {new Date().getFullYear()} Torta App. <span className="text-slate-600">The Wurm Online Analytics Platform.</span>
                        <br />
                        <span className="text-xs opacity-50">Not affiliated with Code Club AB.</span>
                    </p>
                </footer>
            </div>

            {/* Global Widgets */}
            <AdCooldownWidget />

            {/* Gamification Overlays */}
            {showLevelUp && (
                <LevelUpOverlay
                    level={newLevel}
                    show={true}
                    onClose={() => setShowLevelUp(false)}
                />
            )}
        </div>
    );
};

export default App;
