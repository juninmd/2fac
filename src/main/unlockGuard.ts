export interface UnlockGuard {
    isLocked(): boolean;
    recordFailure(): void;
    recordSuccess(): void;
}

interface UnlockGuardOptions {
    maxAttempts: number;
    lockoutMs: number;
    now?: () => number;
}

/** Brute-force guard for the master password: locks for `lockoutMs` after `maxAttempts` failures in a row. */
export const createUnlockGuard = ({ maxAttempts, lockoutMs, now = Date.now }: UnlockGuardOptions): UnlockGuard => {
    let failedAttempts = 0;
    let lockedUntil = 0;

    return {
        isLocked: () => now() < lockedUntil,
        recordFailure: () => {
            failedAttempts++;
            if (failedAttempts >= maxAttempts) {
                failedAttempts = 0;
                lockedUntil = now() + lockoutMs;
            }
        },
        recordSuccess: () => {
            failedAttempts = 0;
            lockedUntil = 0;
        },
    };
};
