import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GamificationService } from '../services/GamificationService';

// Use vi.hoisted to allow access inside vi.mock
const mocks = vi.hoisted(() => ({
    select: vi.fn(),
    eq: vi.fn(),
    single: vi.fn(),
    rpc: vi.fn(),
}));

vi.mock('../services/supabase', () => ({
    supabase: {
        from: vi.fn(() => ({
            select: mocks.select.mockReturnValue({
                eq: mocks.eq.mockReturnValue({
                    single: mocks.single,
                }),
            }),
        })),
        rpc: mocks.rpc,
    },
}));

describe('GamificationService', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    describe('getStreak', () => {
        it('should return streak data when found', async () => {
            const mockStreak = { current_streak: 5, user_id: '123' };
            mocks.single.mockResolvedValue({ data: mockStreak, error: null });

            const result = await GamificationService.getStreak('123');
            expect(result).toEqual(mockStreak);
            expect(mocks.eq).toHaveBeenCalledWith('user_id', '123');
        });

        it('should return null when not found (PGRST116)', async () => {
            mocks.single.mockResolvedValue({ data: null, error: { code: 'PGRST116' } });

            const result = await GamificationService.getStreak('123');
            expect(result).toBeNull();
        });
    });

    describe('claimDailyReward', () => {
        it('should return success result from RPC', async () => {
            const mockResponse = { success: true, new_streak: 2 };
            mocks.rpc.mockResolvedValue({ data: mockResponse, error: null });

            const result = await GamificationService.claimDailyReward();
            expect(result).toEqual(mockResponse);
            expect(mocks.rpc).toHaveBeenCalledWith('claim_daily_rewards');
        });

        it('should throw error on RPC failure', async () => {
            mocks.rpc.mockResolvedValue({ data: null, error: { message: 'RPC Error' } });

            await expect(GamificationService.claimDailyReward()).rejects.toEqual({ message: 'RPC Error' });
        });
    });
});
