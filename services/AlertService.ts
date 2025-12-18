import { sendNotification } from '@tauri-apps/plugin-notification';
import { SoundService } from './SoundService';
import { TradeAlert, FiredAlert } from '../types/alerts';
import { Money } from '../src/domain/price/Money'; // Import Money class

interface ParsedTrade {
    timestamp: string;
    nick: string;
    message: string;
    type?: 'WTB' | 'WTS' | 'WTT';
    price?: Money | null; // Updated to include Money object
}

// Extended Alert interface (Backend representation)
// The frontend definition might differ slightly, but we map it here.
export interface ExtendedTradeAlert extends TradeAlert {
    maxPrice?: number | null; // stored in copper
    minPrice?: number | null; // stored in copper
}

export class AlertService {
    /**
     * Check if a trade matches any enabled alerts
     * Returns the matching alert or null
     */
    static checkAlerts(trade: ParsedTrade, alerts: ExtendedTradeAlert[]): ExtendedTradeAlert | null {
        const activeAlerts = alerts.filter(a => a.enabled);
        const lowerMsg = trade.message.toLowerCase();

        for (const alert of activeAlerts) {
            // 1. Check keywords (Term match)
            if (!this.matchesKeywords(lowerMsg, alert.term)) {
                continue;
            }

            // 2. Check trade type filter
            if (!this.matchesTradeType(trade.type, alert.tradeTypes)) {
                continue;
            }

            // 3. Check Price Thresholds
            if (!this.matchesPrice(trade.price, alert.maxPrice, alert.minPrice)) {
                continue;
            }

            return alert; // Match found
        }

        return null;
    }

    /**
     * Check if message contains all keywords (AND logic)
     */
    static matchesKeywords(message: string, term: string): boolean {
        const keywords = term.toLowerCase().split(/\s+/).filter(k => k.length > 0);
        return keywords.every(k => message.includes(k));
    }

    /**
     * Check if trade type matches filter
     * null/undefined tradeTypes = match all
     */
    static matchesTradeType(
        tradeType: 'WTB' | 'WTS' | 'WTT' | undefined,
        allowedTypes: ('WTB' | 'WTS' | 'WTT')[] | null | undefined
    ): boolean {
        if (!allowedTypes || allowedTypes.length === 0) {
            return true; // No filter = match all
        }

        if (!tradeType) {
            return false; // Trade has no type, but filter is active. Conservative: don't match.
        }

        return allowedTypes.includes(tradeType);
    }

    /**
     * Check if price meets criteria
     * @param tradePrice - Money object from the trade
     * @param maxPrice - Max price in copper (limit for Buyers)
     * @param minPrice - Min price in copper (limit for Sellers, rarely used but supported)
     */
    static matchesPrice(
        tradePrice: Money | null | undefined, 
        maxPrice: number | null | undefined, 
        minPrice: number | null | undefined
    ): boolean {
        // If no price limits are set, any price (or no price) is valid
        if ((maxPrice === null || maxPrice === undefined) && (minPrice === null || minPrice === undefined)) {
            return true;
        }

        // If limits exist but trade has no price, we cannot verify.
        // Decision: Don't fire alert if we can't verify price.
        if (!tradePrice) {
            return false; 
        }

        const copper = tradePrice.getCopper();

        // Check Max Price (e.g., "Notify if < 1g")
        if (maxPrice !== null && maxPrice !== undefined) {
            if (copper > maxPrice) return false;
        }

        // Check Min Price (e.g., "Notify if > 10g")
        if (minPrice !== null && minPrice !== undefined) {
            if (copper < minPrice) return false;
        }

        return true;
    }

    /**
     * Fire an alert (notification + sound)
     */
    static async fireAlert(alert: ExtendedTradeAlert, trade: ParsedTrade): Promise<void> {
        // Send notification
        // Determine sound based on price? For now use alert preference
        
        let priceText = '';
        if (trade.price) {
            priceText = ` [${trade.price.toString()}]`;
        }

        await sendNotification({
            title: `💰 TortaApp: ${alert.term}`,
            body: `${trade.nick}: ${trade.message}${priceText}`,
        });

        // Play sound
        SoundService.play(alert.sound || 'notification');
    }

    /**
     * Create a FiredAlert record
     */
    static createFiredAlert(alert: ExtendedTradeAlert, trade: ParsedTrade): FiredAlert {
        return {
            id: crypto.randomUUID(),
            term: alert.term,
            trade: {
                timestamp: trade.timestamp,
                nick: trade.nick,
                message: trade.message,
                type: trade.type
            },
            firedAt: Date.now()
        };
    }

    /**
     * Check if Do Not Disturb mode is active
     */
    static isDndActive(dndMode: boolean, dndSchedule: { start: string; end: string }): boolean {
        if (!dndMode) return false;

        const now = new Date();
        const currentHour = now.getHours();
        const currentMinute = now.getMinutes();
        const currentTime = currentHour * 60 + currentMinute;

        const [startHour, startMinute] = dndSchedule.start.split(':').map(Number);
        const [endHour, endMinute] = dndSchedule.end.split(':').map(Number);
        const startTime = startHour * 60 + startMinute;
        const endTime = endHour * 60 + endMinute;

        // Handle overnight schedule (e.g., 22:00 to 08:00)
        if (startTime > endTime) {
            return currentTime >= startTime || currentTime < endTime;
        }

        // Normal schedule (e.g., 08:00 to 22:00)
        return currentTime >= startTime && currentTime < endTime;
    }
}
