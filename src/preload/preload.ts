import { contextBridge, ipcRenderer } from 'electron';

contextBridge.exposeInMainWorld('electron', {
    get2FAItems: () => ipcRenderer.invoke('get-2fa-items'),
    add2FAItem: (item: any) => ipcRenderer.invoke('add-2fa-item', item),
    remove2FAItem: (id: string) => ipcRenderer.invoke('remove-2fa-item', id),
    update2FAItem: (id: string, item: any) => ipcRenderer.invoke('update-2fa-item', id, item),
    export2FA: () => ipcRenderer.invoke('export-2fa'),
    import2FA: () => ipcRenderer.invoke('import-2fa'),
    importAuthy: () => ipcRenderer.invoke('import-authy'),
    scanScreenQR: () => ipcRenderer.invoke('scan-screen-qr'),
    setMasterPassword: (password: string) => ipcRenderer.invoke('set-master-password', password),
    checkMasterPassword: (password: string) => ipcRenderer.invoke('check-master-password', password),
    hasMasterPassword: () => ipcRenderer.invoke('has-master-password'),
    set2FAItems: (items: any[]) => ipcRenderer.invoke('set-2fa-items', items),
    getSettings: () => ipcRenderer.invoke('get-settings'),
    setSettings: (settings: any) => ipcRenderer.invoke('set-settings', settings),
});

