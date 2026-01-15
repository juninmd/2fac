export interface TwoFAItem {
    id: string;
    account: string;
    issuer: string;
    secret: string;
    description?: string;
    algorithm?: string;
    digits?: number;
    period?: number;
    encoding?: string;
    type?: string;
}

export interface ElectronAPI {
    get2FAItems: () => Promise<TwoFAItem[]>;
    add2FAItem: (item: any) => Promise<any>;
    remove2FAItem: (id: string) => Promise<boolean>;
    update2FAItem: (id: string, item: any) => Promise<any>;
    export2FA: () => Promise<{ success: boolean; path?: string }>;
    import2FA: () => Promise<{ success: boolean; count?: number }>;
    importAuthy: () => Promise<{ success: boolean; count?: number; error?: string }>;
    scanScreenQR: () => Promise<{ success: boolean; data?: string; error?: string }>;
    setMasterPassword: (password: string) => Promise<boolean>;
    checkMasterPassword: (password: string) => Promise<boolean>;
    hasMasterPassword: () => Promise<boolean>;
    set2FAItems: (items: TwoFAItem[]) => Promise<boolean>;
    getSettings: () => Promise<AppSettings>;
    setSettings: (settings: AppSettings) => Promise<boolean>;
}

export interface AppSettings {
    minimizeToTray: boolean;
    runOnStartup: boolean;
    autoLock: boolean;
    autoLockTimeout: number;
}

declare global {
    interface Window {
        electron: ElectronAPI;
    }
}
