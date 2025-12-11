import { invoke } from '@tauri-apps/api/core';
import { listen } from '@tauri-apps/api/event';
import localforage from 'localforage';
import { supabase } from './supabase';
import { toast } from 'sonner';

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

function convertToCopper(price: string): number {
    let copper = 0;
    const silverMatch = price.match(/(\d+)s/i);
    if (silverMatch) {
        copper += parseInt(silverMatch[1], 10) * 100;
    }
    const copperMatch = price.match(/(\d+)c/i);
    if (copperMatch) {
        copper += parseInt(copperMatch[1], 10);
    }
    return copper;
}

async function generateTradeHash(trade: Trade): Promise<string> {
    const timestampMs = new Date().getTime(); 
    const normalized = {
        server: trade.server.toLowerCase().trim(),
        seller: trade.nick.toLowerCase().trim(),
        item: normalizeItemName(trade.item),
        priceCopper: convertToCopper(trade.price),
        timeWindow: Math.floor(timestampMs / 300000)
    };

    return sha256(JSON.stringify(normalized));
}

class LiveTradeMonitor {
    private offlineQueue: QueuedTrade[] = [];
    private isOnline = navigator.onLine;
    private readonly MAX_RETRIES = 3;
    private readonly RETRY_DELAY = 1000;
    private currentServer = 'Cadence'; 
    private currentUserId: string | null = null;

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
        const { data } = await supabase.auth.getUser();
        this.currentUserId = data.user?.id || null;
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
        const upper = message.toUpperCase();
        if (upper.includes('WTB')) return 'WTB';
        if (upper.includes('WTS')) return 'WTS';
        if (upper.includes('WTT')) return 'WTT';
        return null; 
    }

    private parseItemAndPrice(message: string): { item: string, price: string } {
        const priceRegex = /(\d+s\d+c|\d+s|\d+c)/i;
        const priceMatch = message.match(priceRegex);
        const price = priceMatch ? priceMatch[0] : '0c'; 

        let item = message
            .replace(/wts|wtb|wtt/gi, '')
            .replace(priceRegex, '') 
            .replace(/\bfor\b/gi, '') 
            .trim();

        return { item, price };
    }

    // --- Public Methods ---

    public async startWatching(filePath: string) {
        // BYPASS: Permissions check commented out to prevent freeze
        /*
        try {
            const allowed = await invoke<boolean>('check_file_access', { path: filePath });
            if (!allowed) {
                toast.error('Sem permissão de leitura no arquivo.');
                return;
            }
        } catch (err) {
            toast.error(`Erro ao verificar arquivo: ${err}`);
            return;
        }
        */
        console.log("🚀 LiveTradeMonitor: BYPASSING CHECK, Direct Invoke:", filePath);

        // 2. Start Watcher (Backend)
        try {
            console.log("🚀 LiveTradeMonitor: Requesting backend to watch:", filePath);
            const res = await invoke('start_trade_watcher', { path: filePath }); 
            console.log('✅ Backend responded:', res);
            toast.success('Monitoramento iniciado!');
        } catch (err) {
            console.error("❌ LiveTradeMonitor: Failed to invoke start_trade_watcher:", err);
            toast.error(`Falha ao iniciar watcher: ${err}`);
            return;
        }

        // 3. Listen for Events
        await listen<{ timestamp: string, nick: string, message: string }>('trade-event', async (event) => {
            console.log("📨 FRONTEND RECEIVED EVENT:", event);
            const raw = event.payload;
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

            await this.submitTrade(trade);
        });
    }

    public async submitTrade(trade: Trade) {
        if (!this.currentUserId) {
            const { data } = await supabase.auth.getUser();
            this.currentUserId = data.user?.id || null;
            if (!this.currentUserId) return; 
        }

        if (!this.isOnline) {
            this.queueTrade(trade);
            return;
        }

        try {
            await this.submitTradeInternal(trade);
        } catch (err) {
            console.error('Failed to submit trade:', err);
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
        console.log('📴 Trade queued:', queuedTrade.retryCount);
    }

    private async handleOnline() {
        this.isOnline = true;
        console.log('🌐 Online: Processing queue...');

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
                console.log(`✅ Trade submitted after retry`);
            } catch (err) {
                console.error(`❌ Retry failed:`, err);
                this.offlineQueue.push(trade);
            }
        }

        this.saveOfflineQueue();

        if (failedTrades.length > 0) {
            toast.warning(`${failedTrades.length} trades falharam após várias tentativas.`);
        }
    }

    private handleOffline() {
        this.isOnline = false;
        toast.info('Modo Offline: Trades serão salvas.');
    }
}

export const liveTradeMonitor = new LiveTradeMonitor();
