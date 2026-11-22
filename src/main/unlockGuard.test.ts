/** @jest-environment node */
import { createUnlockGuard } from './unlockGuard';

describe('createUnlockGuard', () => {
    let now = 0;
    const guard = () => createUnlockGuard({ maxAttempts: 5, lockoutMs: 30_000, now: () => now });

    beforeEach(() => { now = 1_000_000; });

    it('allows attempts below the limit', () => {
        const g = guard();
        for (let i = 0; i < 4; i++) g.recordFailure();
        expect(g.isLocked()).toBe(false);
    });

    it('locks after the maximum number of failures', () => {
        const g = guard();
        for (let i = 0; i < 5; i++) g.recordFailure();
        expect(g.isLocked()).toBe(true);
    });

    // Before, five typos refused even the correct password until the app restarted.
    it('unlocks again once the lockout period has passed', () => {
        const g = guard();
        for (let i = 0; i < 5; i++) g.recordFailure();
        now += 30_000;
        expect(g.isLocked()).toBe(false);
        g.recordFailure();
        expect(g.isLocked()).toBe(false);
    });

    it('resets the counter on success', () => {
        const g = guard();
        for (let i = 0; i < 4; i++) g.recordFailure();
        g.recordSuccess();
        for (let i = 0; i < 4; i++) g.recordFailure();
        expect(g.isLocked()).toBe(false);
    });
});
