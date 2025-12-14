import { describe, it, expect, vi } from 'vitest';
import { AlertService, ExtendedTradeAlert } from '../services/AlertService';
import { Money } from '../src/domain/price/Money';

describe('AlertService', () => {
    const defaultAlert: ExtendedTradeAlert = {
        id: '1',
        term: 'Casket',
        enabled: true,
        sound: 'notification'
    };

    describe('checkAlerts - Keywords', () => {
        it('matches simple keyword', () => {
            const trade = {
                timestamp: '', nick: 'Test', message: 'WTS Casket',
                price: null
            };
            const alert = AlertService.checkAlerts(trade, [defaultAlert]);
            expect(alert).not.toBeNull();
            expect(alert?.id).toBe('1');
        });

        it('is case insensitive', () => {
            const trade = {
                timestamp: '', nick: 'Test', message: 'wts casket',
                price: null
            };
            const alert = AlertService.checkAlerts(trade, [defaultAlert]);
            expect(alert).not.toBeNull();
        });

        it('ignores non-matching messages', () => {
            const trade = {
                timestamp: '', nick: 'Test', message: 'WTS Sword',
                price: null
            };
            const alert = AlertService.checkAlerts(trade, [defaultAlert]);
            expect(alert).toBeNull();
        });
    });

    describe('checkAlerts - Trade Type', () => {
        const wtsAlert: ExtendedTradeAlert = { ...defaultAlert, tradeTypes: ['WTS'] };

        it('matches correct trade type', () => {
            const trade = {
                timestamp: '', nick: 'Test', message: 'WTS Casket',
                type: 'WTS' as const,
                price: null
            };
            expect(AlertService.checkAlerts(trade, [wtsAlert])).not.toBeNull();
        });

        it('ignores incorrect trade type', () => {
            const trade = {
                timestamp: '', nick: 'Test', message: 'WTB Casket',
                type: 'WTB' as const,
                price: null
            };
            expect(AlertService.checkAlerts(trade, [wtsAlert])).toBeNull();
        });
    });

    describe('checkAlerts - Price Logic', () => {
        // 1g = 10000c
        const cheapAlert: ExtendedTradeAlert = { 
            ...defaultAlert, 
            maxPrice: 10000 // 1g
        };

        it('matches price below maxPrice (Good Deal)', () => {
            const trade = {
                timestamp: '', nick: 'Test', message: 'WTS Casket',
                price: Money.fromCopper(5000) // 50s
            };
            expect(AlertService.checkAlerts(trade, [cheapAlert])).not.toBeNull();
        });

        it('ignores price above maxPrice (Bad Deal)', () => {
            const trade = {
                timestamp: '', nick: 'Test', message: 'WTS Casket',
                price: Money.fromCopper(20000) // 2g
            };
            expect(AlertService.checkAlerts(trade, [cheapAlert])).toBeNull();
        });

        it('matches exact maxPrice', () => {
            const trade = {
                timestamp: '', nick: 'Test', message: 'WTS Casket',
                price: Money.fromCopper(10000) // 1g
            };
            expect(AlertService.checkAlerts(trade, [cheapAlert])).not.toBeNull();
        });

        const expensiveAlert: ExtendedTradeAlert = { 
            ...defaultAlert, 
            minPrice: 50000 // 5g
        };

        it('matches price above minPrice (High Value)', () => {
            const trade = {
                timestamp: '', nick: 'Test', message: 'WTS Rare Casket',
                price: Money.fromCopper(60000) // 6g
            };
            expect(AlertService.checkAlerts(trade, [expensiveAlert])).not.toBeNull();
        });

        it('ignores price below minPrice', () => {
            const trade = {
                timestamp: '', nick: 'Test', message: 'WTS Casket',
                price: Money.fromCopper(40000) // 4g
            };
            expect(AlertService.checkAlerts(trade, [expensiveAlert])).toBeNull();
        });
    });

    describe('checkAlerts - Integration', () => {
        it('handles missing price gracefully', () => {
            const alertWithPrice: ExtendedTradeAlert = { ...defaultAlert, maxPrice: 10000 };
            const trade = {
                timestamp: '', nick: 'Test', message: 'WTS Casket',
                price: null // No price parsed
            };
            // Should NOT match if price restriction exists but price is missing
            expect(AlertService.checkAlerts(trade, [alertWithPrice])).toBeNull();
        });

        it('matches alert without price limits even if trade has no price', () => {
            const trade = {
                timestamp: '', nick: 'Test', message: 'WTS Casket',
                price: null
            };
            expect(AlertService.checkAlerts(trade, [defaultAlert])).not.toBeNull();
        });
    });
});
