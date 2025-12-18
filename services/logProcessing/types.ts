/**
 * types.ts
 * TypeScript interfaces for RAW log processing module
 */

export interface RawLogLine {
    timestamp_raw: string;    // "07:07:08"
    nick_raw: string;         // "Jotasiete"
    server: string;           // "Har", "Cad", etc.
    message_raw: string;      // "WTS Iron 1g"
    line_number: number;      // For debugging
}

export interface CleanedLog {
    trade_timestamp_utc: string;  // ISO 8601: "2025-12-01T10:07:08.000Z"
    game_nick: string;            // Normalized: "jotasiete"
    server_code: string;          // "Har", "Cad"
    trade_type: 'WTS' | 'WTB' | 'PC' | 'WTT' | null;
    message_clean: string;        // Original message cleaned
    message_normalized: string;   // For hashing (lowercase, no special chars)
    content_hash: string;         // CRC32 hash for deduplication
}

export interface ProcessingStats {
    total_lines: number;
    valid_trades: number;
    ignored_lines: number;
    errors: number;
}

export interface SupabaseTradeLog {
    trade_timestamp_utc: string;
    log_hash: string;
    nick: string;
    server: string;
    trade_type: string;
    message: string;
}
