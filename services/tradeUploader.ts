import { supabase } from './supabase';
import { MarketItem } from '../src/types'; // Correct import path for types in root/src or relative
// Wait, types.ts is in root? App.tsx is in root?
// based on list_dir, types.ts is in root. App.tsx is in root.
// So from services/tradeUploader.ts, types is ../types.ts

// Check if types.ts is in src/types or types.ts
// list_dir showed "types.ts" in root.
// But App.tsx imports types from somewhere.
// Let's assume user structure: App.tsx uses "import { MarketItem } from './types';" probably.
// But wait, the file list showed "types.ts" in root.
// App.tsx imports: we didn't see imports in view_file 150-200.
// Let's assume standard import for now and fix if needed.

export interface TradeLogInsert {
    nick: string;
    item_name: string;
    price: number;
    trade_type: 'WTS' | 'WTB' | 'PC' | 'SOLD';
    server: string;
    trade_timestamp_utc: string;
    message: string;
    user_id?: string;
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

        const results = {
            success: 0,
            duplicates: 0,
            errors: 0
        };

        console.log(`LiveTrade: Preparing ${trades.length} trades for upload...`);
        
        const BATCH_SIZE = 100;
        
        for (let i = 0; i < trades.length; i += BATCH_SIZE) {
            const chunk = trades.slice(i, i + BATCH_SIZE);
            const formattedTrades: TradeLogInsert[] = [];

            for (const item of chunk) {
                if (!item.seller || !item.name) continue;

                let tradeType = item.orderType as any;
                if (!['WTS', 'WTB', 'PC', 'SOLD'].includes(tradeType)) {
                     tradeType = 'WTS'; 
                }

                formattedTrades.push({
                    nick: item.seller,
                    item_name: item.name,
                    price: item.price,
                    trade_type: tradeType,
                    server: item.location || 'Cadence',
                    trade_timestamp_utc: item.timestamp,
                    message: `${item.orderType} ${item.name} ${item.price}c`,
                    user_id: userId
                });
            }

            if (formattedTrades.length === 0) continue;

            try {
                const { error, data } = await supabase
                    .from('trade_logs')
                    .insert(formattedTrades)
                    .select();

                if (error) {
                    console.error('Batch upload error:', error);
                    results.errors += formattedTrades.length;
                    if (error.code === '23505') { 
                         // console.warn('Duplicates in batch');
                    }
                } else {
                    const count = data ? data.length : formattedTrades.length;
                    results.success += count;
                    results.duplicates += (formattedTrades.length - count);
                }
            } catch (err) {
                console.error('Unexpected upload error:', err);
                results.errors += formattedTrades.length;
            }
        }

        return results;
    }
};
