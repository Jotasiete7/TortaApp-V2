/**
 * hashGenerator.ts
 * CRC32 hash generation for log deduplication
 */

/**
 * Generates a CRC32 hash for deduplication.
 * Based on: timestamp + nick + message
 */
export function generateContentHash(
    timestamp_raw: string,
    nick_normalized: string,
    message_normalized: string
): string {
    const combined = `${timestamp_raw}|${nick_normalized}|${message_normalized}`;
    return crc32(combined).toString(16).toUpperCase().padStart(8, '0');
}

/**
 * CRC32 implementation (standard algorithm)
 */
function crc32(str: string): number {
    const table = makeCRCTable();
    let crc = 0 ^ (-1);

    for (let i = 0; i < str.length; i++) {
        crc = (crc >>> 8) ^ table[(crc ^ str.charCodeAt(i)) & 0xFF];
    }

    return (crc ^ (-1)) >>> 0;
}

/**
 * Generate CRC32 lookup table
 */
function makeCRCTable(): number[] {
    const table: number[] = [];
    for (let n = 0; n < 256; n++) {
        let c = n;
        for (let k = 0; k < 8; k++) {
            c = ((c & 1) ? (0xEDB88320 ^ (c >>> 1)) : (c >>> 1));
        }
        table[n] = c;
    }
    return table;
}
