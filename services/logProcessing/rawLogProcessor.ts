/**
 * rawLogProcessor.ts
 * Main log processing function - parse, clean, normalize
 * Adapted from Gemini's code with improvements
 */

import { RawLogLine, CleanedLog } from './types';
import { generateContentHash } from './hashGenerator';

/**
 * Normalizes text for hashing (lowercase, alphanumeric only)
 */
function normalizeText(text: string): string {
    return text
        .toLowerCase()
        .replace(/[^a-z0-9\s]/g, '') // Keep letters, numbers, and spaces
        .replace(/\s+/g, ' ')        // Normalize multiple spaces
        .trim();
}

/**
 * Parses a single RAW log line
 * Format: [HH:MM:SS] <Nick> (Server) Message
 */
export function parseRawLogLine(line: string, lineNumber: number): RawLogLine | null {
    // Regex: [HH:MM:SS] <Nick> (Server) Message
    const regex = /^\[(\d{2}:\d{2}:\d{2})\]\s*<([^>]+)>\s*\(([A-Za-z]+)\)\s*(.*)$/;
    const match = line.trim().match(regex);

    if (!match) {
        return null; // Invalid line format
    }

    const [, timestamp_raw, nick_raw, server, message_raw] = match;

    return {
        timestamp_raw,
        nick_raw,
        server,
        message_raw,
        line_number: lineNumber
    };
}

/**
 * Processes a RAW log line into a cleaned, canonical record
 */
export function processLogLine(
    logLine: string,
    processingDate: Date,
    lineNumber: number
): CleanedLog | null {

    // 1. Parse RAW line
    const raw = parseRawLogLine(logLine, lineNumber);
    if (!raw) {
        return null; // Invalid format
    }

    // 2. Normalize nick
    const game_nick = raw.nick_raw.toLowerCase().trim();

    // 3. Identify trade type
    let trade_type: CleanedLog['trade_type'] = null;
    let message_trimmed = raw.message_raw.trim();

    const trade_match = message_trimmed.match(/^(WTS|WTB|WTT|PC)\s+/i);
    if (trade_match) {
        trade_type = trade_match[1].toUpperCase() as CleanedLog['trade_type'];
        message_trimmed = message_trimmed.substring(trade_match[0].length).trim();
    } else if (message_trimmed.startsWith('@TORTA-')) {
        // Verification Token detected!
        // Assign 'PC' type to pass filters, but the trigger will catch the token content.
        trade_type = 'PC';
    } else if (message_trimmed.startsWith('@')) {
        // Reply messages (e.g., @nick thanks) - ignore
        return null;
    } else {
        // No valid trade type - ignore
        return null;
    }

    // 4. Clean message
    // Remove OLD @tortaapp verification codes if any, but KEEP the new @TORTA- token
    if (!message_trimmed.startsWith('@TORTA-')) {
        message_trimmed = message_trimmed
            .replace(/@tortaapp\s+\d+/gi, '')
            .trim();
    }

    // 5. Normalize for hashing
    const message_normalized = normalizeText(message_trimmed);

    // 6. Filter out noise (too short messages)
    if (message_normalized.length < 5 && trade_type !== 'PC') {
        return null;
    }

    // 7. Normalize timestamp to UTC
    const [hour, minute, second] = raw.timestamp_raw.split(':').map(Number);
    const trade_date = new Date(processingDate);
    trade_date.setHours(hour, minute, second, 0);
    const trade_timestamp_utc = trade_date.toISOString();

    // 8. Generate content hash
    const content_hash = generateContentHash(
        raw.timestamp_raw,
        game_nick,
        message_normalized
    );

    return {
        trade_timestamp_utc,
        game_nick,
        server_code: raw.server,
        trade_type,
        message_clean: message_trimmed,
        message_normalized,
        content_hash
    };
}

/**
 * Processes an entire log file (batch processing)
 */
export function processLogFile(
    fileContent: string,
    processingDate: Date
): { records: CleanedLog[]; stats: { total: number; valid: number; ignored: number } } {
    const lines = fileContent.split('\n');
    const records: CleanedLog[] = [];
    let ignored = 0;

    for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        if (!line.trim()) continue; // Skip empty lines

        const record = processLogLine(line, processingDate, i + 1);
        if (record) {
            records.push(record);
        } else {
            ignored++;
        }
    }

    return {
        records,
        stats: {
            total: lines.length,
            valid: records.length,
            ignored
        }
    };
}
