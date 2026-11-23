import { decryptData, decryptDataWithKey, encryptData, encryptDataWithKey, getArgonKey } from './crypto';

describe('crypto', () => {
    it('derives the same key as before the Argon2id params were pinned (existing vaults stay readable)', async () => {
        const key = await getArgonKey('correct horse', Buffer.alloc(32, 7));
        expect(key.toString('hex')).toBe('7133a80c540843b463b57f08226a0179946794026e7f0cf7d990db335b082fa3');
    });

    it('round-trips data with a key and with a password', async () => {
        const key = Buffer.alloc(32, 1);
        expect(decryptDataWithKey(encryptDataWithKey('segredo', key), key)).toBe('segredo');
        expect(await decryptData(await encryptData('segredo', 'pw'), 'pw')).toBe('segredo');
    });

    it('rejects a truncated GCM auth tag instead of accepting a 4-byte prefix', () => {
        const key = Buffer.alloc(32, 1);
        const backup = encryptDataWithKey('segredo', key);
        const truncated = { ...backup, authTag: backup.authTag.slice(0, 8) };
        expect(() => decryptDataWithKey(truncated, key)).toThrow();
    });

    it('rejects a truncated tag on password-based backups', async () => {
        const backup = await encryptData('segredo', 'pw');
        await expect(decryptData({ ...backup, authTag: backup.authTag.slice(0, 8) }, 'pw')).rejects.toThrow();
    });
});
