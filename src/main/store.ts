import Store from 'electron-store';
import { TwoFAItem, AppSettings } from './types';

const DEFAULT_SETTINGS: AppSettings = {
    minimizeToTray: false,
    runOnStartup: false,
    autoLock: true,
    autoLockTimeout: 5,
    blurOnInactive: true,
};

export const createStore = (): Store => new Store();

export const getTwoFAItems = (store: Store): TwoFAItem[] => {
    return (store.get('twoFAItems', []) as TwoFAItem[]) || [];
};

export const setTwoFAItems = (store: Store, items: TwoFAItem[]): void => {
    store.set('twoFAItems', items);
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
    return Date.now().toString() + Math.random().toString(36).substring(2, 9);
};

export const getAppSettings = (store: Store): AppSettings => {
    return (store.get('appSettings', DEFAULT_SETTINGS) as AppSettings) || DEFAULT_SETTINGS;
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
