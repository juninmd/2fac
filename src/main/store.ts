import Store from 'electron-store';
import { TwoFAItem, AppSettings, EncryptedBackup } from './types';
import { encryptDataWithKey, decryptDataWithKey } from './crypto';

const DEFAULT_SETTINGS: AppSettings = {
    minimizeToTray: false,
    runOnStartup: false,
    autoLock: true,
    autoLockTimeout: 5,
    blurOnInactive: true,
};

let sessionKey: Buffer | null = null;

export const setSessionKey = (key: Buffer | null): void => {
    if (!key && sessionKey) {
        sessionKey.fill(0);
    }
    sessionKey = key;
};

export const getSessionKey = (): Buffer | null => {
    return sessionKey;
};

export const createStore = (): Store => new Store();

export const getTwoFAItems = (store: Store): TwoFAItem[] => {
    if (store.has('encryptedVault')) {
        if (!sessionKey) {
            console.warn('Attempted to read encrypted vault without session key');
            return []; // Or throw error
        }
        try {
            const encryptedBackup = store.get('encryptedVault') as EncryptedBackup;
            const decrypted = decryptDataWithKey(encryptedBackup, sessionKey);
            return JSON.parse(decrypted) as TwoFAItem[];
        } catch (error) {
            console.error('Failed to decrypt vault:', error);
            return [];
        }
    }

    // Fallback to plain text, and migrate if session key is present
    const items = (store.get('twoFAItems', []) as TwoFAItem[]);
    if (sessionKey && items.length > 0) {
        setTwoFAItems(store, items); // This will save encrypted and delete plain
    }
    return items;
};

export const setTwoFAItems = (store: Store, items: TwoFAItem[]): void => {
    if (sessionKey) {
        const data = JSON.stringify(items);
        const encrypted = encryptDataWithKey(data, sessionKey);
        store.set('encryptedVault', encrypted);
        if (store.has('twoFAItems')) {
            store.delete('twoFAItems');
        }
    } else {
        if (store.has('encryptedVault')) {
            console.warn('Attempted to overwrite encrypted vault without session key. Operation aborted to prevent data loss.');
            return;
        }
        store.set('twoFAItems', items);
    }
};

export const addTwoFAItem = (store: Store, item: Omit<TwoFAItem, 'id'>): TwoFAItem => {
    const items = getTwoFAItems(store);
    const newItem: TwoFAItem = {
        ...item,
        id: generateItemId(),
    };
    items.push(newItem);
    setTwoFAItems(store, items);
    return newItem;
};

export const removeTwoFAItem = (store: Store, id: string): boolean => {
    const items = getTwoFAItems(store);
    const filtered = items.filter(item => item.id !== id);
    setTwoFAItems(store, filtered);
    return true;
};

export const updateTwoFAItem = (store: Store, id: string, updates: Partial<TwoFAItem>): TwoFAItem | null => {
    const items = getTwoFAItems(store);
    const index = items.findIndex(item => item.id === id);
    if (index >= 0) {
        items[index] = { ...items[index], ...updates };
        setTwoFAItems(store, items);
        return items[index];
    }
    return null;
};

export const generateItemId = (): string => {
    return Date.now().toString(36) + Math.random().toString(36).substring(2, 9);
};

export const getAppSettings = (store: Store): AppSettings => {
    return { ...DEFAULT_SETTINGS, ...(store.get('appSettings', DEFAULT_SETTINGS) as AppSettings) };
};

export const setAppSettings = (store: Store, settings: AppSettings): void => {
    store.set('appSettings', settings);
};

export const getExistingSecrets = (store: Store): Set<string> => {
    const items = getTwoFAItems(store);
    return new Set(items.map(item => item.secret));
};

export const appendItems = (store: Store, newItems: TwoFAItem[]): void => {
    const currentItems = getTwoFAItems(store);
    setTwoFAItems(store, [...currentItems, ...newItems]);
};
