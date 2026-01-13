import { contextBridge, ipcRenderer } from 'electron';

contextBridge.exposeInMainWorld('electron', {
    get2FAItems: () => ipcRenderer.invoke('get-2fa-items'),
    add2FAItem: (item: any) => ipcRenderer.invoke('add-2fa-item', item),
    remove2FAItem: (id: string) => ipcRenderer.invoke('remove-2fa-item', id),
    update2FAItem: (id: string, item: any) => ipcRenderer.invoke('update-2fa-item', id, item),
    export2FA: () => ipcRenderer.invoke('export-2fa'),
    import2FA: () => ipcRenderer.invoke('import-2fa'),
    importAuthy: () => ipcRenderer.invoke('import-authy'),
    setMasterPassword: (password: string) => ipcRenderer.invoke('set-master-password', password),
    checkMasterPassword: (password: string) => ipcRenderer.invoke('check-master-password', password),
    hasMasterPassword: () => ipcRenderer.invoke('has-master-password'),
});

export interface ElectronAPI {
    get2FAItems: () => Promise<any[]>;
    add2FAItem: (item: any) => Promise<any>;
    remove2FAItem: (id: string) => Promise<boolean>;
    update2FAItem: (id: string, item: any) => Promise<any>;
    export2FA: () => Promise<{ success: boolean; path?: string }>;
    import2FA: () => Promise<{ success: boolean; count?: number }>;
    importAuthy: () => Promise<{ success: boolean; count?: number; error?: string }>;
    setMasterPassword: (password: string) => Promise<boolean>;
    checkMasterPassword: (password: string) => Promise<boolean>;
    hasMasterPassword: () => Promise<boolean>;
}

declare global {
    interface Window {
        electron: ElectronAPI;
    }
}
