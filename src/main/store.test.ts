/** @jest-environment node */
import * as crypto from 'crypto';
import type Store from 'electron-store';
import { getTwoFAItems, rekeyVault, setSessionKey, setTwoFAItems } from './store';
import type { TwoFAItem } from './types';

// electron-store exige o binário do Electron; os testes usam um store em memória.
jest.mock('electron-store', () => class FakeStore {});

const createFakeStore = (): Store => {
    const data = new Map<string, unknown>();
    return {
        has: (k: string) => data.has(k),
        get: (k: string, d?: unknown) => (data.has(k) ? data.get(k) : d),
        set: (k: string, v: unknown) => void data.set(k, v),
        delete: (k: string) => void data.delete(k),
    } as unknown as Store;
};

const item: TwoFAItem = { id: '1', account: 'me@example.com', issuer: 'GitHub', secret: 'JBSWY3DPEHPK3PXP' };
const key = () => crypto.randomBytes(32);

describe('rekeyVault (master password change)', () => {
    afterEach(() => setSessionKey(null));

    it('keeps the codes readable with the new key', () => {
        const store = createFakeStore();
        setSessionKey(key());
        setTwoFAItems(store, [item]);

        rekeyVault(store, key());

        expect(getTwoFAItems(store)).toEqual([item]);
    });

    it('encrypts plain items when the first password is set', () => {
        const store = createFakeStore();
        setTwoFAItems(store, [item]);

        rekeyVault(store, key());

        expect(store.has('twoFAItems')).toBe(false);
        expect(store.has('encryptedVault')).toBe(true);
        expect(getTwoFAItems(store)).toEqual([item]);
    });

    it('refuses to rekey a locked vault and leaves it untouched', () => {
        const store = createFakeStore();
        const oldKey = key();
        setSessionKey(oldKey);
        setTwoFAItems(store, [item]);
        const before = store.get('encryptedVault');
        const saved = Buffer.from(oldKey); // setSessionKey(null) zeroes the buffer
        setSessionKey(null);

        expect(() => rekeyVault(store, key())).toThrow(/locked/);
        expect(store.get('encryptedVault')).toBe(before);
        setSessionKey(saved);
        expect(getTwoFAItems(store)).toEqual([item]);
    });

    it('refuses to rekey when the current key cannot decrypt the vault', () => {
        const store = createFakeStore();
        setSessionKey(key());
        setTwoFAItems(store, [item]);
        const before = store.get('encryptedVault');
        setSessionKey(key());

        expect(() => rekeyVault(store, key())).toThrow();
        expect(store.get('encryptedVault')).toBe(before);
    });
});
