export interface TwoFAItem {
    id: string;
    account: string;
    issuer: string;
    secret: string;
    algorithm?: string;
    digits?: number;
    period?: number;
    type?: string;
    color?: string;
    category?: string;
    description?: string;
    encoding?: string;
}

export interface AppSettings {
    minimizeToTray: boolean;
    runOnStartup: boolean;
    autoLock: boolean;
    autoLockTimeout: number;
    blurOnInactive: boolean;
    maskSecrets: boolean;
}

export interface EncryptedBackup {
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

export interface FileDialogResult {
    canceled: boolean;
    filePaths: string[];
}

export interface SaveDialogResult {
    canceled: boolean;
    filePath?: string;
}

export type AlgorithmMap = Record<number, string>;
