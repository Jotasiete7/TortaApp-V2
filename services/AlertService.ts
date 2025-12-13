import { sendNotification } from '@tauri-apps/plugin-notification';
import { SoundService } from './SoundService';
import { TradeAlert, FiredAlert } from '../types/alerts';

interface ParsedTrade {
    timestamp: string;
    nick: string;
    message: string;
    type?: 'WTB' | 'WTS' | 'WTT';
}

export class AlertService {
    /**
     * Check if a trade matches any enabled alerts
     * Returns the matching alert or null
     */
    static checkAlerts(trade: ParsedTrade, alerts: TradeAlert[]): TradeAlert | null {
        const activeAlerts = alerts.filter(a => a.enabled);
        const lowerMsg = trade.message.toLowerCase();

        for (const alert of activeAlerts) {
            // Check keywords
            if (!this.matchesKeywords(lowerMsg, alert.term)) {
                continue;
            }

            // Check trade type filter
            if (!this.matchesTradeType(trade.type, alert.tradeTypes)) {
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
            return false; // Trade has no type, but filter is active
        }

        return allowedTypes.includes(tradeType);
    }

    /**
     * Fire an alert (notification + sound)
     */
    static async fireAlert(alert: TradeAlert, trade: ParsedTrade): Promise<void> {
        // Send notification
        await sendNotification({
            title: `TortaApp: ${alert.term}`,
            body: `${trade.nick}: ${trade.message}`,
        });

        // Play sound
        SoundService.play(alert.sound || 'notification');
    }

    /**
     * Create a FiredAlert record
     */
    static createFiredAlert(alert: TradeAlert, trade: ParsedTrade): FiredAlert {
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
