import { toast } from 'sonner';
import { supabase } from './supabase';
import { MarketItem } from '../types';

async function generateTradeHash(nick: string, message: string, timestamp: string): Promise<string> {
    const msgBuffer = new TextEncoder().encode(JSON.stringify({
        nick: nick.toLowerCase(),
        message: message.toLowerCase(),
        timestamp
    }));
    const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

export const TradeUploader = {
    uploadTrades: async (trades: MarketItem[]): Promise<{
        success: number;
        duplicates: number;
        errors: number;
    }> => {
        if (!supabase) {
            console.error('❌ Supabase not initialized');
            return { success: 0, duplicates: 0, errors: 0 };
        }

        const { data: { user } } = await supabase.auth.getUser();
        const userId = user?.id;

        if (!userId) {
            console.error('❌ No authenticated user');
            return { success: 0, duplicates: 0, errors: 0 };
        }

        const results = {
            success: 0,
            duplicates: 0,
            errors: 0
        };

        console.log(`LiveTrade: Preparing ${trades.length} trades for upload...`);
        
        // Process one by one using RPC (same as LiveTradeMonitor)
        
        let processedCount = 0;
        const totalItems = trades.length;
        const toastId = toast.loading(`Iniciando upload de ${totalItems} itens...`);
        
        for (const item of trades) {
            processedCount++;
            if (processedCount % 50 === 0) {
                toast.loading(`Processando: ${processedCount}/${totalItems}`, { id: toastId });
            }
            
            
            // DEBUG LOGGING
            if (processedCount <= 5) {
                console.log(`Processing item ${processedCount}:`, item);
            }
            
            if (!item.seller || !item.name) {
                console.warn(`❌ Invalid item (No seller/name):`, item);
                continue;
            }


            try {
                const hash = await generateTradeHash(
                    item.seller,
                    `${item.orderType} ${item.name} ${item.price}c`,
                    new Date(item.timestamp).toISOString()
                );

                const { data, error } = await supabase.rpc('submit_live_trade', {
                    p_trade_hash: hash,
                    p_nick: item.seller,
                    p_trade_type: item.orderType || 'WTS',
                    p_message: `${item.orderType} ${item.name} ${item.price}c`,
                    p_timestamp: new Date(item.timestamp).toISOString(),
                    p_server: item.location || 'Cadence',
                    p_user_id: userId
                });

                if (error) {
                    console.error('RPC error:', error);
                    results.errors++;
                } else {
                    // Start Patch: Handle Array Response
                    const result = Array.isArray(data) ? data[0] : data;
                    if (result && (result.success || result.trade_id)) {
                        if (result.is_duplicate) {
                             results.duplicates++;
                        } else {
                             results.success++;
                        }
                    } else {
                        // Fallback logging if success is missing but no error
                        console.warn('RPC returned no error but success flag is missing:', result);
                        results.errors++;
                    }
                    // End Patch
                }
            
            } catch (err) {
                console.error('Upload error:', err);
                results.errors++;
            }
        }

        console.log(`Upload complete: ${results.success} saved, ${results.duplicates} duplicates, ${results.errors} errors`);
        
        // Dispatch event to trigger UI refresh
        window.dispatchEvent(new CustomEvent('tradesUploaded', { 
            detail: { success: results.success, duplicates: results.duplicates, errors: results.errors }
        }));
        
        toast.dismiss(toastId);
        return results;
    }
};
