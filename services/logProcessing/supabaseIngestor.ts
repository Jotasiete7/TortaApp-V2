/**
 * supabaseIngestor.ts
 * Handles batch submission of cleaned logs to Supabase
 */

import { supabase } from '../supabase';
import { CleanedLog } from './types';

export interface TradeLogEntry {
    trade_timestamp_utc: string;
    log_hash: string;
    nick: string;
    trade_type: string;
    message: string;
    server: string;
    item_category?: string | null;
}

/**
 * Submits logs in batches to optimize network usage and avoid timeouts.
 * Uses UPSERT to handle deduplication automatically.
 */
export async function submitLogsBatch(
    logs: CleanedLog[],
    onProgress?: (current: number, total: number) => void
): Promise<{ success: number; duplicates: number; errors: number }> {
    const BATCH_SIZE = 500;
    let success = 0;
    let duplicates = 0;
    let errors = 0;

    // Filter out invalid logs before processing
    const validLogs = logs.filter(log => log.trade_type !== null);

    for (let i = 0; i < validLogs.length; i += BATCH_SIZE) {
        const batch = validLogs.slice(i, i + BATCH_SIZE);

        // Map to database schema (Canonical Adapter Logic)
        const entries: TradeLogEntry[] = batch.map(log => ({
            trade_timestamp_utc: log.trade_timestamp_utc,
            log_hash: log.content_hash,
            nick: log.game_nick,
            trade_type: log.trade_type || 'UNKNOWN',
            message: log.message_clean,
            server: log.server_code,
            item_category: null // Placeholder for future categorization logic
        }));

        try {
            // 2. INGESTÃO OTIMIZADA COM DEDUPLICAÇÃO:
            // Usamos 'upsert' com 'ignoreDuplicates: true' e 'onConflict'
            const { data, error } = await supabase
                .from('trade_logs')
                .upsert(entries, {
                    onConflict: 'trade_timestamp_utc,log_hash',
                    ignoreDuplicates: true
                })
                .select();

            if (error) {
                console.error('Batch error:', error);
                errors += entries.length;
            } else {
                // Supabase upsert with ignoreDuplicates returns null for duplicates if they are not updated.
                // However, if we select(), it might return only inserted rows or all rows depending on config.
                // With ignoreDuplicates: true, it usually returns only the rows that were actually inserted/updated.
                // If data is null/empty but no error, it means all were duplicates.

                const insertedCount = data?.length || 0;
                success += insertedCount;
                duplicates += (entries.length - insertedCount);
            }
        } catch (err) {
            console.error('Unexpected error:', err);
            errors += entries.length;
        }

        // Progress callback
        if (onProgress) {
            onProgress(Math.min(i + BATCH_SIZE, validLogs.length), validLogs.length);
        }
    }

    return { success, duplicates, errors };
}

/**
 * Submits bulk NDJSON data directly to Supabase (for pre-cleaned files like CLEAN2025).
 * Parses NDJSON line-by-line to avoid memory issues with large files.
 */
export async function submitBulkNDJSON(
    fileContent: string,
    onProgress?: (current: number, total: number) => void
): Promise<{ success: number; duplicates: number; errors: number; totalLines: number }> {
    const logs: CleanedLog[] = [];
    let totalLines = 0;
    let parseErrors = 0;

    // Parse NDJSON line by line
    const lines = fileContent.split('\n');
    totalLines = lines.length;

    for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line) continue; // Skip empty lines

        try {
            const record = JSON.parse(line);

            // Map NDJSON record to CleanedLog format
            // Expected fields: timestamp, player/nick, trade_type, message, server, etc.
            const cleanedLog: CleanedLog = {
                trade_timestamp_utc: record.timestamp || record.trade_timestamp_utc || new Date().toISOString(),
                game_nick: (record.player || record.nick || record.game_nick || 'Unknown').toLowerCase(),
                server_code: record.server || record.server_code || 'Unknown',
                trade_type: (record.trade_type || record.type || null) as 'WTS' | 'WTB' | 'PC' | 'WTT' | null,
                message_clean: record.message || record.message_clean || record.raw_text || '',
                message_normalized: (record.message || record.message_clean || '').toLowerCase().replace(/[^a-z0-9\s]/g, ''),
                content_hash: record.log_hash || record.content_hash || `${i}-${Date.now()}` // Use existing hash or generate
            };

            logs.push(cleanedLog);
        } catch (err) {
            parseErrors++;
            // Skip invalid JSON lines
            continue;
        }
    }

    if (import.meta.env.DEV) console.log(`Parsed ${logs.length} valid records from ${totalLines} lines (${parseErrors} parse errors)`);

    // Use existing batch upload function
    const result = await submitLogsBatch(logs, onProgress);

    return {
        ...result,
        totalLines
    };
}
