export interface TwoFAItem {
    id: string;
    account: string;
    issuer: string;
    secret: string;
    algorithm: string;
    digits: number;
    period: number;
    type: string;
}

export interface AppSettings {
    minimizeToTray: boolean;
    runOnStartup: boolean;
    autoLock: boolean;
    autoLockTimeout: number;
    blurOnInactive: boolean;
}

export interface BackupFile {
    version: number;
    salt: string;
    iv: string;
    authTag: string;
    data: string;
}

export interface ImportResult {
    success: boolean;
    count?: number;
    error?: string;
}

export interface ExportResult {
    success: boolean;
    path?: string;
    error?: string;
}
