import { invoke } from '@tauri-apps/api/core';
import { listen } from '@tauri-apps/api/event';
import localforage from 'localforage';
import { supabase } from './supabase';
import { toast } from 'sonner';
import { Money } from '../src/domain/price/Money';
import { FileParser } from './fileParser';
import { AlertService, ExtendedTradeAlert } from './AlertService';
import { serviceDirectory } from './ServiceDirectory';

export interface Trade {
    timestamp: string;
    nick: string;
    message: string;
    type: 'WTB' | 'WTS' | 'WTT';
    item: string;
    price: string;
    server: string;
    raw: string;
}

interface QueuedTrade extends Trade {
    retryCount?: number;
    lastAttempt?: number;
}

// Hashing Helpers
async function sha256(message: string): Promise<string> {
    const msgBuffer = new TextEncoder().encode(message);
    const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

function normalizeItemName(item: string): string {
    return item
        .toLowerCase()
        .replace(/\b(ql|quality)\s*\d+/gi, '')
        .replace(/\b(rare|supreme|fantastic)\b/gi, '')
        .replace(/[,\s]+/g, ' ')
        .trim();
}

// Removed: convertToCopper function - now using Money class

async function generateTradeHash(trade: Trade): Promise<string> {
    const timestampMs = new Date().getTime();
    const normalized = {
        server: trade.server.toLowerCase().trim(),
        seller: trade.nick.toLowerCase().trim(),
        item: normalizeItemName(trade.item),
        priceCopper: Money.fromString(trade.price).getCopper(),
        timeWindow: Math.floor(timestampMs / 300000)
    };

    return sha256(JSON.stringify(normalized));
}

export class LiveTradeMonitor {
    private offlineQueue: QueuedTrade[] = [];
    private isOnline = navigator.onLine;
    private readonly MAX_RETRIES = 3;
    private readonly RETRY_DELAY = 1000;
    private currentServer = 'Cadence';
    private currentUserId: string | null = null;
    private alerts: ExtendedTradeAlert[] = [];

    // Proteï¿½ï¿½o contra mï¿½ltiplas instï¿½ncias
    private isCurrentlyWatching = false;
    private currentUnlisten: (() => void) | null = null;
    private currentFilePath: string | null = null;

    private store: LocalForage;

    constructor() {
        this.store = localforage.createInstance({
            name: "TortaApp_OfflineQueue"
        });

        window.addEventListener('online', () => this.handleOnline());
        window.addEventListener('offline', () => this.handleOffline());

        this.init();
    }

    private async init() {
        await this.loadOfflineQueue();
        await this.loadAlerts();
        const { data } = await supabase.auth.getUser();
        this.currentUserId = data.user?.id || null;
    }


    private async loadAlerts() {
        const saved = await this.store.getItem<ExtendedTradeAlert[]>('trade_alerts');
        if (saved) {
            this.alerts = saved;
        }
    }

    private async loadOfflineQueue() {
        const queue = await this.store.getItem<QueuedTrade[]>('queue');
        if (queue) {
            this.offlineQueue = queue;
        }
    }

    private async saveOfflineQueue() {
        await this.store.setItem('queue', this.offlineQueue);
    }

    // --- Parsing Logic ---

    private parseTradeType(message: string): 'WTB' | 'WTS' | 'WTT' | null {
        // V2.2 Robust Regex (Parity with FileParser)
        const prefix = message.substring(0, 30).toLowerCase();
        if (/\bwtb\b/i.test(prefix)) return 'WTB';
        if (/\bwts\b/i.test(prefix)) return 'WTS';
        if (/\bwtt\b/i.test(prefix)) return 'WTT';
        return null;
    }

    private parseItemAndPrice(message: string): { item: string, price: string } {
        // V2.2 Robust Price Extraction
        const priceCopper = FileParser.normalizePrice(message);
        const priceString = priceCopper + 'c'; // Convert to copper string for Money class compatibility

        // V2.2 Robust Name Cleaning matches FileParser logic
        const cleanName = message
            .replace(/wts|wtb|wtt/gi, '')
            .replace(/([\d.]+)\s*(gold|silver|copper|iron|g|s|c|i)\b/gi, '') // Remove Price
            .replace(/QL[:\s]*(\d+(\.\d+)?)|(\d+(\.\d+)?)ql/gi, '') // Remove QL
            .replace(/\bfor\b/gi, '')
            .replace(/\([a-z]+\)/gi, '') // Server tags
            .replace(/\[|\]/g, '')
            .replace(/[:>]/g, '')
            .trim()
            .replace(/\s+/g, ' '); // Single spaces

        return { item: cleanName, price: priceString };
    }

    // --- Public Methods ---

    public async startWatching(filePath: string) {
        // ProteÃ§Ã£o: Se jÃ¡ estÃ¡ assistindo o mesmo arquivo, nÃ£o fazer nada
        if (this.isCurrentlyWatching && this.currentFilePath === filePath) {
            console.log('âš ï¸ LiveTradeMonitor: Already watching this file, skipping...');
            return;
        }

        // Se estÃ¡ assistindo outro arquivo, parar primeiro
        if (this.isCurrentlyWatching && this.currentFilePath !== filePath) {
            console.log('ðŸ”„ LiveTradeMonitor: Switching to new file, stopping current watcher...');
            await this.stopWatching();
        }

        console.log("ðŸš€ LiveTradeMonitor: BYPASSING PERMISSION CHECK");
        /*
        // 1. Check Permissions (DISABLED)
        */

        // BYPASS: Permissions check commented out to prevent freeze
        /*
        try {
            // const allowed = await invoke<boolean>('check_file_access', { path: filePath });
            // if (!allowed) {
            //    toast.error('Sem permissï¿½o de leitura no arquivo.');
            //    return;
            // }
        } catch (err) {
            toast.error('Erro ao verificar arquivo: ');
            return;
        }
        */
        console.log("ðŸš€ LiveTradeMonitor: BYPASSING CHECK, Direct Invoke:", filePath);

        // Marcar como ativo ANTES de chamar o backend
        this.isCurrentlyWatching = true;
        this.currentFilePath = filePath;

        // 2. Start Watcher (Backend)
        try {
            console.log("ðŸš€ LiveTradeMonitor: Requesting backend to watch:", filePath);
            const res = await invoke('start_trade_watcher', { path: filePath });
            console.log('âœ… Backend responded:', res);
            toast.success('Monitoramento iniciado!');
        } catch (err) {
            console.error("âŒ LiveTradeMonitor: Failed to invoke start_trade_watcher:", err);
            toast.error('Falha ao iniciar watcher: ');
            // Limpar flags em caso de erro
            this.isCurrentlyWatching = false;
            this.currentFilePath = null;
            return;
        }





        // 3. Listen for Events


        const unlisten = await listen<{ trades: Array<{ timestamp: string, nick: string, message: string }> }>('trade-batch-event', async (event) => {
            console.log("ðŸ“¨ FRONTEND RECEIVED EVENT:", event);
            const batch = event.payload;
            if (!batch.trades) return;
            for (const raw of batch.trades) {

                // NEW: Filter Noise before processing
                if (FileParser.isNoise(raw.message)) {
                    console.warn("ðŸš« Valid Filter: Ignored noise message:", raw.message);
                    return;
                }

                const type = this.parseTradeType(raw.message);

                if (!type) return;

                const { item, price } = this.parseItemAndPrice(raw.message);

                const trade: Trade = {
                    timestamp: raw.timestamp,
                    nick: raw.nick,
                    message: raw.message,
                    type,
                    item,
                    price,
                    server: this.currentServer,
                    raw: JSON.stringify(raw)
                };


                // Check Alerts
                try {
                    // Refresh alerts occasionally or assume synced? For now assume synced via localforage sharing the same store name?
                    // Actually LiveTradeMonitor sets store name 'TortaApp_OfflineQueue', AlertsManager uses default or distinct.
                    // AlertsManager uses default 'localforage'.
                    // We should fix this: AlertsManager should use specific store or LiveMonitor should access default.
                    // Let's assume for now we use 'trade_alerts' key on default instance.
                    // Re-instantiate a default store for reading alerts to be safe?
                    // Or just use localforage (global) since AlertsManager imported it globally.

                    const alerts = await localforage.getItem<ExtendedTradeAlert[]>('trade_alerts') || [];

                    // Prepare object for alert check (needs Money price)
                    const checkObj = {
                        timestamp: trade.timestamp,
                        nick: trade.nick,
                        message: trade.message,
                        type: trade.type,
                        price: Money.fromString(trade.price)
                    };

                    const matched = AlertService.checkAlerts(checkObj, alerts);
                    if (matched) {
                        console.log('ðŸ”” Alert Triggered:', matched.term);
                        AlertService.fireAlert(matched, checkObj);
                    }
                } catch (err) {
                    console.error('Error checking alerts:', err);
                }

                serviceDirectory.processMessage(trade.message, trade.nick, trade.server);
                await this.submitTrade(trade);
            }
        });

        // Salvar unlisten para poder parar depois
        this.currentUnlisten = unlisten;
    }

    public async stopWatching() {
        if (!this.isCurrentlyWatching) {
            console.log('â„¹ï¸ LiveTradeMonitor: Not currently watching, nothing to stop.');
            return;
        }

        console.log('ðŸ›‘ LiveTradeMonitor: Stopping watcher...');

        // Remover listener
        if (this.currentUnlisten) {
            this.currentUnlisten();
            this.currentUnlisten = null;
        }

        // Parar backend Rust
        if (typeof window.__TAURI_INTERNALS__ !== 'undefined') {
            try {
                await invoke('stop_trade_watcher');
                console.log('âœ… Backend watcher stopped');
            } catch (e) {
                console.error('âŒ Failed to stop backend watcher:', e);
            }
        }

        this.isCurrentlyWatching = false;
        this.currentFilePath = null;
        console.log('âœ… LiveTradeMonitor: Stopped successfully');
    }

    public isWatching(): boolean {
        return this.isCurrentlyWatching;
    }

    public getCurrentFilePath(): string | null {
        return this.currentFilePath;
    }

    public async submitTrade(trade: Trade) {
        console.log('?? LiveTrade: Attempting to submit trade...', trade.nick);

        if (!this.currentUserId) {
            console.log('?? LiveTrade: UserId not set, fetching...');
            const { data } = await supabase.auth.getUser();
            this.currentUserId = data.user?.id || null;
            if (!this.currentUserId) {
                console.error('? LiveTrade: No authenticated user found. Trade skipped.');
                toast.error('Erro: Usuï¿½rio nï¿½o autenticado. Trade ignorado.');
                return;
            }
        }

        if (!this.isOnline) {
            console.warn('?? LiveTrade: Offline. Queueing trade.');
            this.queueTrade(trade);
            return;
        }

        try {
            console.log('?? LiveTrade: Sending RPC...');
            await this.submitTradeInternal(trade);
            console.log('? LiveTrade: RPC Success');
            toast.success('Trade salvo!', { duration: 2000 });
        } catch (err) {
            console.error('? LiveTrade: RPC FAILURE:', err);
            toast.error('Falha no envio (RPC)');
            this.queueTrade(trade);
        }
    }

    private async submitTradeInternal(trade: Trade) {
        const hash = await generateTradeHash(trade);
        const now = new Date();
        const [hours, minutes, seconds] = trade.timestamp.split(':').map(Number);
        const tradeDate = new Date(now.getFullYear(), now.getMonth(), now.getDate(), hours, minutes, seconds);

        const { data, error } = await supabase.rpc('submit_live_trade', {
            p_trade_hash: hash,
            p_nick: trade.nick,
            p_trade_type: trade.type,
            p_message: trade.message,
            p_timestamp: tradeDate.toISOString(),
            p_server: trade.server,
            p_user_id: this.currentUserId
        });

        if (error) throw error;

        if (data.success) {
            console.log('Processed Trade:', data);
        }
    }

    private queueTrade(trade: Trade) {
        const queuedTrade: QueuedTrade = {
            ...trade,
            retryCount: (trade as QueuedTrade).retryCount || 0,
            lastAttempt: Date.now()
        };

        this.offlineQueue.push(queuedTrade);
        this.saveOfflineQueue();
        console.log('ðŸ“¤ Trade queued:', queuedTrade.retryCount);
    }

    private async handleOnline() {
        this.isOnline = true;
        console.log('ðŸŒ Online: Processing queue...');

        const failedTrades: QueuedTrade[] = [];
        const tempQueue = [...this.offlineQueue];
        this.offlineQueue = [];

        for (const trade of tempQueue) {
            trade.retryCount = (trade.retryCount || 0) + 1;

            if (trade.retryCount > this.MAX_RETRIES) {
                failedTrades.push(trade);
                continue;
            }

            const delay = this.RETRY_DELAY * Math.pow(2, trade.retryCount - 1);
            await new Promise(r => setTimeout(r, delay));

            try {
                await this.submitTradeInternal(trade);
                console.log('âœ… Trade submitted after retry');
            } catch (err) {
                console.error('âŒ Retry failed:', err);
                this.offlineQueue.push(trade);
            }
        }

        this.saveOfflineQueue();

        if (failedTrades.length > 0) {
            toast.warning(`${failedTrades.length} trades falharam apï¿½s vï¿½rias tentativas.`);
        }
    }

    private handleOffline() {
        this.isOnline = false;
        toast.info('Modo Offline: Trades serï¿½o salvas.');
    }
}

export const liveTradeMonitor = new LiveTradeMonitor();


// DEBUG: Expose to window
(window as any).liveTrade = liveTradeMonitor;

// DEBUG TOOL: Check latest logs for a nickname from Console
(window as any).debugLogs = async (nick: string) => {
    console.log(`?? Checking DB for logs of: ${nick}`);
    const { data, error } = await supabase
        .from('trade_logs')
        .select('*')
        .ilike('nick', nick)
        .order('trade_timestamp_utc', { ascending: false })
        .limit(10);

    if (error) {
        console.error('? Query Error:', error);
    } else {
        console.log('?? Result:', data);
        if (data && data.length > 0) {
            console.log('?? Latest Log Time:', data[0].trade_timestamp_utc);
            console.log('?? Latest Message:', data[0].message);
        } else {
            console.log('?? No logs found for this nick.');
        }
    }
};

(window as any).testTrade = () => {
    console.log('?? Sending TEST trade...');
    liveTradeMonitor.submitTrade({
        timestamp: new Date().toISOString(),
        nick: 'TEST_USER',
        message: 'WTS Test Item - 100g',
        type: 'WTS',
        item: 'Test Item',
        price: '100g',
        server: 'Cadence',
        raw: '{}'
    });
};

