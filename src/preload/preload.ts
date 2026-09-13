import { contextBridge, ipcRenderer } from 'electron';
import { TwoFAItem, AppSettings } from '../main/types';

contextBridge.exposeInMainWorld('electron', {
    get2FAItems: () => ipcRenderer.invoke('get-2fa-items'),
    add2FAItem: (item: Omit<TwoFAItem, 'id'>) => ipcRenderer.invoke('add-2fa-item', item),
    remove2FAItem: (id: string) => ipcRenderer.invoke('remove-2fa-item', id),
    update2FAItem: (id: string, item: Partial<TwoFAItem>) => ipcRenderer.invoke('update-2fa-item', id, item),
    export2FA: () => ipcRenderer.invoke('export-2fa'),
    export2FAEncrypted: (password: string) => ipcRenderer.invoke('export-2fa-encrypted', password),
    import2FA: () => ipcRenderer.invoke('import-2fa'),
    import2FAEncrypted: (password: string) => ipcRenderer.invoke('import-2fa-encrypted', password),
    importAuthy: () => ipcRenderer.invoke('import-authy'),
    importGoogleAuth: () => ipcRenderer.invoke('import-google-auth'),
    scanScreenQR: () => ipcRenderer.invoke('scan-screen-qr'),
    setMasterPassword: (password: string) => ipcRenderer.invoke('set-master-password', password),
    checkMasterPassword: (password: string) => ipcRenderer.invoke('check-master-password', password),
    lockApp: () => ipcRenderer.invoke('lock-app'),
    hasMasterPassword: () => ipcRenderer.invoke('has-master-password'),
    set2FAItems: (items: TwoFAItem[]) => ipcRenderer.invoke('set-2fa-items', items),
    getSettings: () => ipcRenderer.invoke('get-settings'),
    setSettings: (settings: AppSettings) => ipcRenderer.invoke('set-settings', settings),
    onProtocolUrl: (callback: (url: string) => void) => {
        const subscription = (_event: Electron.IpcRendererEvent, url: string) => callback(url);
        ipcRenderer.on('on-protocol-url', subscription);
        return () => ipcRenderer.removeListener('on-protocol-url', subscription);
    },
});

