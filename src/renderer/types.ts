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
    color?: string;
    category?: string;
}

export interface ElectronAPI {
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
    lockApp: () => Promise<boolean>;
    hasMasterPassword: () => Promise<boolean>;
    set2FAItems: (items: TwoFAItem[]) => Promise<boolean>;
    getSettings: () => Promise<AppSettings>;
    setSettings: (settings: AppSettings) => Promise<boolean>;
    onProtocolUrl: (callback: (url: string) => void) => () => void;
}

export interface AppSettings {
    minimizeToTray: boolean;
    runOnStartup: boolean;
    autoLock: boolean;
    autoLockTimeout: number;
    blurOnInactive: boolean;
    maskSecrets: boolean;
    theme?: 'light' | 'dark';
    accentColor?: string;
}

declare global {
    interface Window {
        electron: ElectronAPI;
    }
}
