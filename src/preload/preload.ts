import { contextBridge, ipcRenderer, IpcRendererEvent } from 'electron';

import type { TwoFAItem, AppSettings } from '../main/types.js';

interface ElectronAPI {
    get2FAItems: () => Promise<TwoFAItem[]>;
    add2FAItem: (item: Omit<TwoFAItem, 'id'>) => Promise<TwoFAItem>;
    remove2FAItem: (id: string) => Promise<boolean>;
    update2FAItem: (id: string, item: Partial<TwoFAItem>) => Promise<TwoFAItem | null>;
    export2FA: () => Promise<{ success: boolean; path?: string }>;
    export2FAEncrypted: (password: string) => Promise<{ success: boolean; path?: string; error?: string }>;
    import2FA: () => Promise<{ success: boolean; count?: number }>;
    import2FAEncrypted: (password: string) => Promise<{ success: boolean; count?: number; error?: string }>;
    importAuthy: () => Promise<{ success: boolean; count?: number; error?: string }>;
    importGoogleAuth: () => Promise<{ success: boolean; count?: number; error?: string }>;
    scanScreenQR: () => Promise<{ success: boolean; data?: string; error?: string }>;
    setMasterPassword: (password: string) => Promise<boolean>;
    checkMasterPassword: (password: string) => Promise<boolean>;
    hasMasterPassword: () => Promise<boolean>;
    set2FAItems: (items: TwoFAItem[]) => Promise<boolean>;
    getSettings: () => Promise<AppSettings>;
    setSettings: (settings: AppSettings) => Promise<boolean>;
    onProtocolUrl: (callback: (url: string) => void) => () => void;
}

contextBridge.exposeInMainWorld('electron', {
    get2FAItems: (): Promise<TwoFAItem[]> => ipcRenderer.invoke('get-2fa-items'),
    add2FAItem: (item: Omit<TwoFAItem, 'id'>): Promise<TwoFAItem> => ipcRenderer.invoke('add-2fa-item', item),
    remove2FAItem: (id: string): Promise<boolean> => ipcRenderer.invoke('remove-2fa-item', id),
    update2FAItem: (id: string, item: Partial<TwoFAItem>): Promise<TwoFAItem | null> => ipcRenderer.invoke('update-2fa-item', id, item),
    export2FA: (): Promise<{ success: boolean; path?: string }> => ipcRenderer.invoke('export-2fa'),
    export2FAEncrypted: (password: string): Promise<{ success: boolean; path?: string; error?: string }> => ipcRenderer.invoke('export-2fa-encrypted', password),
    import2FA: (): Promise<{ success: boolean; count?: number }> => ipcRenderer.invoke('import-2fa'),
    import2FAEncrypted: (password: string): Promise<{ success: boolean; count?: number; error?: string }> => ipcRenderer.invoke('import-2fa-encrypted', password),
    importAuthy: (): Promise<{ success: boolean; count?: number; error?: string }> => ipcRenderer.invoke('import-authy'),
    importGoogleAuth: (): Promise<{ success: boolean; count?: number; error?: string }> => ipcRenderer.invoke('import-google-auth'),
    scanScreenQR: (): Promise<{ success: boolean; data?: string; error?: string }> => ipcRenderer.invoke('scan-screen-qr'),
    setMasterPassword: (password: string): Promise<boolean> => ipcRenderer.invoke('set-master-password', password),
    checkMasterPassword: (password: string): Promise<boolean> => ipcRenderer.invoke('check-master-password', password),
    hasMasterPassword: (): Promise<boolean> => ipcRenderer.invoke('has-master-password'),
    set2FAItems: (items: TwoFAItem[]): Promise<boolean> => ipcRenderer.invoke('set-2fa-items', items),
    getSettings: (): Promise<AppSettings> => ipcRenderer.invoke('get-settings'),
    setSettings: (settings: AppSettings): Promise<boolean> => ipcRenderer.invoke('set-settings', settings),
    onProtocolUrl: (callback: (url: string) => void): (() => void) => {
        const subscription = (_: IpcRendererEvent, url: string): void => callback(url);
        ipcRenderer.on('on-protocol-url', subscription);
        return () => ipcRenderer.removeListener('on-protocol-url', subscription);
    },
} satisfies ElectronAPI);

