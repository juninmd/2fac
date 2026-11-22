/** @jest-environment node */
import { isValidMasterPassword, MIN_MASTER_PASSWORD_LENGTH } from './masterPassword';

describe('isValidMasterPassword', () => {
    it('accepts a password at the minimum length', () => {
        expect(isValidMasterPassword('a'.repeat(MIN_MASTER_PASSWORD_LENGTH))).toBe(true);
    });

    // The IPC handler is a trust boundary: the renderer check alone let '' rekey the vault.
    it.each([
        ['empty', ''],
        ['too short', 'abc'],
        ['too long', 'a'.repeat(1025)],
        ['number', 1234],
        ['undefined', undefined],
        ['object', { length: 8 }],
    ])('rejects %s', (_label, value) => {
        expect(isValidMasterPassword(value)).toBe(false);
    });
});
