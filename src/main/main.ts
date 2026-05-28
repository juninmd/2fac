import { app, BrowserWindow, Menu, ipcMain, dialog, desktopCapturer, Tray, nativeImage } from 'electron';
import * as path from 'path';
import * as fs from 'fs';
import * as crypto from 'crypto';
import Store from 'electron-store';
import jsQR from 'jsqr';
import * as OTPAuth from 'otpauth';
import * as protobuf from 'protobufjs';

interface TwoFAItem {
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

interface AppSettings {
    minimizeToTray: boolean;
    runOnStartup: boolean;
    autoLock: boolean;
    autoLockTimeout: number;
    blurOnInactive: boolean;
    theme?: 'light' | 'dark';
    accentColor?: string;
}

interface MasterPassword {
    salt: string;
    hash: string;
}

interface BackupFile {
    version: number;
    salt: string;
    iv: string;
    authTag: string;
    data: string;
}

const isDev = process.env.NODE_ENV === 'development';
app.disableHardwareAcceleration();

// Initialize store with encryption for sensitive 2FA data
const store = new Store({
    name: '2fac-config',
    encryptionKey: crypto.randomBytes(32).toString('hex'),
});

let mainWindow: BrowserWindow | null;
let tray: Tray | null = null;
let isQuitting = false;
let initialProtocolUrl: string | null = null;

const createTray = () => {
    if (tray) return;

    // Use a default icon or placeholder. In a real app, ensure 'icon.png' exists in resources.
    // For now, we try to load an icon if it exists, otherwise it might fail or show empty.
    // We'll generate a simple 1x1 png to avoid errors if file missing, or try standard path.
    const iconPath = path.join(__dirname, '../../public/icon.png'); // Hypothetical path
    let icon = nativeImage.createEmpty();
    if (fs.existsSync(iconPath)) {
        icon = nativeImage.createFromPath(iconPath);
    }

    tray = new Tray(icon);
    const contextMenu = Menu.buildFromTemplate([
        {
            label: 'Abrir',
            click: () => {
                if (mainWindow) {
                    mainWindow.show();
                    mainWindow.focus();
                } else {
                    createWindow();
                }
            }
        },
        { type: 'separator' },
        {
            label: 'Sair',
            click: () => {
                isQuitting = true;
                app.quit();
            }
        }
    ]);
    tray.setToolTip('2FAC');
    tray.setContextMenu(contextMenu);

    tray.on('double-click', () => {
        if (mainWindow) {
            mainWindow.show();
            mainWindow.focus();
        }
    });
};

const createWindow = () => {
    mainWindow = new BrowserWindow({
        width: 900,
        height: 700,
        minWidth: 600,
        minHeight: 400,
        webPreferences: {
            preload: path.join(__dirname, '../preload/preload.js'),
            contextIsolation: true,
            nodeIntegration: false,
            sandbox: true,
        },
    });

    const startUrl = isDev
        ? 'http://localhost:3000'
        : `file://${path.join(__dirname, '../renderer/index.html')}`;

    mainWindow.loadURL(startUrl);

    mainWindow.webContents.on('did-finish-load', () => {
        if (initialProtocolUrl) {
            mainWindow?.webContents.send('on-protocol-url', initialProtocolUrl);
            initialProtocolUrl = null;
        }
    });

    if (isDev) {
        mainWindow.webContents.openDevTools();
    }

    // Prevent screen capture for security (mimic Authy behavior)
    mainWindow.setContentProtection(true);

    mainWindow.on('close', (event) => {
        const settings = (store.get('appSettings') as AppSettings | undefined) || {} as AppSettings;
        if (settings.minimizeToTray && !isQuitting) {
            event.preventDefault();
            mainWindow?.hide();
            return false;
        }
        return true;
    });

    mainWindow.on('closed', () => {
        mainWindow = null;
    });
};

const gotTheLock = app.requestSingleInstanceLock();

if (!gotTheLock) {
    app.quit();
} else {
    app.on('second-instance', (_event, commandLine, _workingDirectory) => {
        // Someone tried to run a second instance, we should focus our window.
        if (mainWindow) {
            if (mainWindow.isMinimized()) mainWindow.restore();
            mainWindow.show();
            mainWindow.focus();

            // Find otpauth:// argument
            const url = commandLine.find(arg => arg.startsWith('otpauth://'));
            if (url) {
                mainWindow.webContents.send('on-protocol-url', url);
            }
        }
    });

    app.on('ready', () => {
        // Check for cold start URL on Windows/Linux
        if (process.platform !== 'darwin') {
            const urlArg = process.argv.find(arg => arg.startsWith('otpauth://'));
            if (urlArg) {
                initialProtocolUrl = urlArg;
            }
        }

        createWindow();
        createTray();

        if (process.defaultApp) {
            if (process.argv.length >= 2) {
                app.setAsDefaultProtocolClient('otpauth', process.execPath, [path.resolve(process.argv[1])]);
            }
        } else {
            app.setAsDefaultProtocolClient('otpauth');
        }

        // Apply startup settings
        const settings = (store.get('appSettings') as AppSettings | undefined) || {} as AppSettings;
        app.setLoginItemSettings({
            openAtLogin: !!settings.runOnStartup,
            openAsHidden: !!settings.minimizeToTray
        });
    });
}

app.on('open-url', (event, url) => {
    event.preventDefault();
    if (mainWindow) {
        if (mainWindow.isMinimized()) mainWindow.restore();
        mainWindow.show();
        mainWindow.focus();
        mainWindow.webContents.send('on-protocol-url', url);
    } else {
        initialProtocolUrl = url;
    }
});

app.on('before-quit', () => {
    isQuitting = true;
});

app.on('window-all-closed', () => {
    const settings = (store.get('appSettings') as AppSettings | undefined) || {} as AppSettings;
    if (process.platform !== 'darwin' && !settings.minimizeToTray) {
        app.quit();
    }
    // If minimizeToTray is true, we stay running in background (tray)
});

app.on('activate', () => {
    if (mainWindow === null) {
        createWindow();
    }
});

// IPC Handlers

// Google Authenticator Protobuf definitions
const googleAuthProto = `
syntax = "proto3";
message MigrationPayload {
  repeated OtpParameters otp_parameters = 1;
  int32 version = 2;
  int32 batch_size = 3;
  int32 batch_index = 4;
  int32 batch_id = 5;
}
message OtpParameters {
  bytes secret = 1;
  string name = 2;
  string issuer = 3;
  Algorithm algorithm = 4;
  int32 digits = 5;
  OtpType type = 6;
  int64 counter = 7;
}
enum Algorithm {
  ALGORITHM_UNSPECIFIED = 0;
  ALGORITHM_SHA1 = 1;
  ALGORITHM_SHA256 = 2;
  ALGORITHM_SHA512 = 3;
  ALGORITHM_MD5 = 4;
}
enum OtpType {
  OTP_TYPE_UNSPECIFIED = 0;
  OTP_TYPE_HOTP = 1;
  OTP_TYPE_TOTP = 2;
}
`;

const root = protobuf.parse(googleAuthProto).root;
const MigrationPayload = root.lookupType("MigrationPayload");

function decodeBase32(buffer: Uint8Array): string {
    const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
    let bits = 0;
    let value = 0;
    let output = '';

    for (let i = 0; i < buffer.length; i++) {
        value = (value << 8) | buffer[i];
        bits += 8;
        while (bits >= 5) {
            output += alphabet[(value >>> (bits - 5)) & 31];
            bits -= 5;
        }
    }
    if (bits > 0) {
        output += alphabet[(value << (5 - bits)) & 31];
    }
    return output;
}

ipcMain.handle('import-google-auth', async () => {
    const result = await dialog.showOpenDialog(mainWindow!, {
        filters: [{ name: 'Links otpauth-migration', extensions: ['txt'] }],
        title: 'Importar do Google Authenticator (Cole o URI num .txt e selecione)',
        properties: ['openFile'],
    });

    if (!result.canceled && result.filePaths[0]) {
        try {
            const filePath = result.filePaths[0];
            const fileContent = fs.readFileSync(filePath, 'utf-8');
            const trimmed = fileContent.trim();

            if (!trimmed.startsWith('otpauth-migration://offline?data=')) {
                return { success: false, error: 'O arquivo não contém um link válido do otpauth-migration' };
            }

            const dataPart = trimmed.replace('otpauth-migration://offline?data=', '');
            const decodedData = Buffer.from(decodeURIComponent(dataPart), 'base64');

            const message = MigrationPayload.decode(decodedData) as unknown as Record<string, unknown>;
            const otpParamsList = message.otpParameters as unknown[];
            if (!otpParamsList || otpParamsList.length === 0) {
                 return { success: false, error: 'Nenhum token encontrado' };
            }

            let importedCount = 0;
            const currentItems = store.get('twoFAItems', []) as TwoFAItem[];
            const existingSecrets = new Set(currentItems.map(i => i.secret));
            const newItems: TwoFAItem[] = [];

            otpParamsList.forEach((otp: unknown) => {
                 const otpEntry = otp as { secret?: Uint8Array; name?: string; issuer?: string; algorithm?: number; digits?: number; type?: number; counter?: number };
                 const secretBase32 = decodeBase32(otpEntry.secret || new Uint8Array());
                 if (!secretBase32 || existingSecrets.has(secretBase32)) return;

                 const algorithmMap: Record<number, string> = { 1: 'SHA1', 2: 'SHA256', 3: 'SHA512' };
                 const alg = algorithmMap[otpEntry.algorithm || 0] || 'SHA1';

                 newItems.push({
                    id: crypto.randomUUID(),
                    account: otpEntry.name || 'Conta Google Auth',
                    issuer: otpEntry.issuer || 'Google Authenticator',
                    secret: secretBase32,
                    algorithm: alg,
                    digits: otpEntry.digits === 2 ? 8 : 6,
                    period: 30,
                    type: otpEntry.type === 1 ? 'hotp' : 'totp'
                 });
                 existingSecrets.add(secretBase32);
                 importedCount++;
            });

            if (newItems.length > 0) {
                store.set('twoFAItems', [...currentItems, ...newItems]);
                return { success: true, count: importedCount };
            }

            return { success: false, error: 'Nenhum token novo encontrado (já existem ou inválidos)' };

        } catch (error: unknown) {
            console.error('Erro na importação Google Authenticator:', error);
            return { success: false, error: 'Ocorreu um erro inesperado durante a importação.' };
        }
    }
    return { success: false };
});

ipcMain.handle('get-2fa-items', () => {
    const items = store.get('twoFAItems', []) as TwoFAItem[];
    return items;
});

ipcMain.handle('add-2fa-item', (_event, item: Omit<TwoFAItem, 'id'>) => {
    const items = store.get('twoFAItems', []) as TwoFAItem[];
    const newItem: TwoFAItem = { ...item, id: Date.now().toString() };
    items.push(newItem);
    store.set('twoFAItems', items);
    return newItem;
});

ipcMain.handle('remove-2fa-item', (_event, id: string) => {
    const items = store.get('twoFAItems', []) as TwoFAItem[];
    const filtered = items.filter((item: TwoFAItem) => item.id !== id);
    store.set('twoFAItems', filtered);
    return true;
});

ipcMain.handle('update-2fa-item', (_event, id: string, updatedItem: Partial<TwoFAItem>) => {
    const items = store.get('twoFAItems', []) as TwoFAItem[];
    const index = items.findIndex((item: TwoFAItem) => item.id === id);
    if (index >= 0) {
        items[index] = { ...items[index], ...updatedItem } as TwoFAItem;
        store.set('twoFAItems', items);
        return items[index];
    }
    return null;
});

ipcMain.handle('set-2fa-items', (_event, items: TwoFAItem[]) => {
    store.set('twoFAItems', items);
    return true;
});

ipcMain.handle('export-2fa', async () => {
    const items = store.get('twoFAItems', []) as TwoFAItem[];
    const result = await dialog.showSaveDialog(mainWindow!, {
        defaultPath: `2fa-backup-${new Date().getTime()}.json`,
        filters: [{ name: 'JSON Files', extensions: ['json'] }],
    });

    if (!result.canceled && result.filePath) {
        fs.writeFileSync(result.filePath, JSON.stringify(items, null, 2));
        return { success: true, path: result.filePath };
    }
    return { success: false };
});

ipcMain.handle('export-2fa-encrypted', async (_event, password) => {
    const items = store.get('twoFAItems', []) as TwoFAItem[];
    const result = await dialog.showSaveDialog(mainWindow!, {
        defaultPath: `2fa-backup-encrypted-${new Date().getTime()}.enc`,
        filters: [{ name: 'Encrypted 2FA Backup', extensions: ['enc'] }],
    });

    if (!result.canceled && result.filePath) {
        try {
            const data = JSON.stringify(items);
            const algorithm = 'aes-256-gcm';
            // Use PBKDF2 to derive a key from the password
            const salt = crypto.randomBytes(32);
            const key = crypto.pbkdf2Sync(password, salt, 100000, 32, 'sha256');
            const iv = crypto.randomBytes(16);

            const cipher = crypto.createCipheriv(algorithm, key, iv);
            let encrypted = cipher.update(data, 'utf8', 'hex');
            encrypted += cipher.final('hex');
            const authTag = cipher.getAuthTag();

            // Format: version(1)|salt(32)|iv(16)|authTag(16)|encryptedData
            // We use hex encoding for the file content to be text-safe, or just binary buffer.
            // Let's use a JSON wrapper for easier parsing or just concat buffers.
            // JSON wrapper is safer for versioning.
            const backupFile = {
                version: 1,
                salt: salt.toString('hex'),
                iv: iv.toString('hex'),
                authTag: authTag.toString('hex'),
                data: encrypted
            };

            fs.writeFileSync(result.filePath, JSON.stringify(backupFile));
            return { success: true, path: result.filePath };
        } catch (error: unknown) {
            console.error('Export encryption error:', error);
            return { success: false, error: 'Falha ao criptografar o arquivo de backup.' };
        }
    }
    return { success: false };
});

ipcMain.handle('import-2fa-encrypted', async (_event, password) => {
    const result = await dialog.showOpenDialog(mainWindow!, {
        filters: [{ name: 'Encrypted 2FA Backup', extensions: ['enc'] }],
        properties: ['openFile'],
    });

    if (!result.canceled && result.filePaths[0]) {
        try {
            const filePath = result.filePaths[0];
            const fileContent = fs.readFileSync(filePath, 'utf-8');

            let backupData: BackupFile | undefined;
            try {
                backupData = JSON.parse(fileContent) as BackupFile;
            } catch (e) {
                return { success: false, error: 'Invalid backup file format' };
            }

            if (!backupData || !backupData.version || !backupData.salt || !backupData.iv || !backupData.authTag || !backupData.data) {
                return { success: false, error: 'Invalid backup file structure' };
            }

            const algorithm = 'aes-256-gcm';
            const salt = Buffer.from(backupData.salt, 'hex');
            const iv = Buffer.from(backupData.iv, 'hex');
            const authTag = Buffer.from(backupData.authTag, 'hex');
            const encryptedData = backupData.data;

            const key = crypto.pbkdf2Sync(password, salt, 100000, 32, 'sha256');
            const decipher = crypto.createDecipheriv(algorithm, key, iv);
            decipher.setAuthTag(authTag);

            let decrypted = decipher.update(encryptedData, 'hex', 'utf8');
            decrypted += decipher.final('utf8');

            const importedItems = JSON.parse(decrypted) as TwoFAItem[];

            // Assign new IDs to imported items to avoid collisions?
            // Or keep IDs if they are backups. Authy restore keeps context.
            // Let's regenerate IDs to be safe against duplicates if we are merging.
            const itemsWithIds = importedItems.map((item: TwoFAItem) => ({
                ...item,
                id: Date.now().toString() + Math.random(),
            }));

            const currentItems = store.get('twoFAItems', []) as TwoFAItem[];
            const allItems = [...currentItems, ...itemsWithIds];
            store.set('twoFAItems', allItems);

            return { success: true, count: itemsWithIds.length };

        } catch (error: unknown) {
            console.error('Import decryption error:', error);
            return { success: false, error: 'Senha incorreta ou arquivo corrompido' };
        }
    }
    return { success: false };
});

ipcMain.handle('scan-screen-qr', async () => {
    try {
        // Minimize window to reveal screen content
        if (mainWindow) {
            mainWindow.minimize();
        }

        // Wait for minimize animation
        await new Promise(resolve => setTimeout(resolve, 500));

        const sources = await desktopCapturer.getSources({
            types: ['screen'],
            thumbnailSize: { width: 3840, height: 2160 }
        });

        for (const source of sources) {
            const image = source.thumbnail;
            const size = image.getSize();
            const bitmap = image.toBitmap();

            // jsQR expects Uint8ClampedArray (RGBA)
            const code = jsQR(new Uint8ClampedArray(bitmap), size.width, size.height);

            if (code) {
                if (mainWindow) mainWindow.restore();
                return { success: true, data: code.data };
            }
        }

        if (mainWindow) mainWindow.restore();
        return { success: false, error: 'QR Code not found on screen' };

    } catch (error: unknown) {
        console.error('QR Scan error:', error);
        if (mainWindow) mainWindow.restore();
        return { success: false, error: 'Falha ao escanear a tela.' };
    }
});

ipcMain.handle('set-master-password', (_event, password) => {
    const salt = crypto.randomBytes(32).toString('hex');
    const hash = crypto.pbkdf2Sync(password, salt, 600000, 32, 'sha256').toString('hex');
    store.set('masterPassword', { salt, hash });
    return true;
});

ipcMain.handle('check-master-password', (_event, password) => {
    const saved = store.get('masterPassword') as { salt: string; hash: string } | undefined;
    if (!saved) return false;
    const hash = crypto.pbkdf2Sync(password, saved.salt, 600000, 32, 'sha256').toString('hex');
    return saved.hash === hash;
});

ipcMain.handle('has-master-password', () => {
    return store.has('masterPassword');
});

ipcMain.handle('get-settings', () => {
    return store.get('appSettings', {
        minimizeToTray: false,
        runOnStartup: false,
        autoLock: true,
        autoLockTimeout: 5,
        blurOnInactive: true
    }) as AppSettings;
});

ipcMain.handle('set-settings', (_event, settings: AppSettings) => {
    store.set('appSettings', settings);
    app.setLoginItemSettings({
        openAtLogin: !!settings.runOnStartup,
        openAsHidden: !!settings.minimizeToTray
    });
    return true;
});

ipcMain.handle('import-2fa', async () => {
    const result = await dialog.showOpenDialog(mainWindow!, {
        filters: [{ name: 'JSON Files', extensions: ['json'] }],
        properties: ['openFile'],
    });

    if (!result.canceled && result.filePaths[0]) {
        const filePath = result.filePaths[0];
        const fileContent = fs.readFileSync(filePath, 'utf-8');
        const importedItems = JSON.parse(fileContent) as TwoFAItem[];

        // Assign new IDs to imported items
        const itemsWithIds = importedItems.map((item: TwoFAItem) => ({
            ...item,
            id: Date.now().toString() + Math.random(),
        }));

        const currentItems = store.get('twoFAItems', []) as TwoFAItem[];
        const allItems = [...currentItems, ...itemsWithIds];
        store.set('twoFAItems', allItems);

        return { success: true, count: itemsWithIds.length };
    }
    return { success: false };
});

ipcMain.handle('import-authy', async () => {
    const result = await dialog.showOpenDialog(mainWindow!, {
        filters: [{ name: 'Arquivos de Backup', extensions: ['json', 'txt', 'uri'] }],
        title: 'Importar de Authy ou Lista de URIs',
        properties: ['openFile'],
    });

    if (!result.canceled && result.filePaths[0]) {
        try {
            const filePath = result.filePaths[0];
            const fileContent = fs.readFileSync(filePath, 'utf-8');
            let importedCount = 0;
            const currentItems = store.get('twoFAItems', []) as TwoFAItem[];
            const existingSecrets = new Set(currentItems.map(i => i.secret));
            const newItems: TwoFAItem[] = [];

            interface ImportEntry {
                secret?: string;
                decrypted_seed?: string;
                seed?: string;
                name?: string;
                account?: string;
                label?: string;
                issuer?: string;
                provider?: string;
                algorithm?: string;
                digits?: number;
                period?: number;
                type?: string;
            }

            const addItem = (entry: ImportEntry) => {
                const secret = (entry.secret || entry.decrypted_seed || entry.seed || '').replace(/\s+/g, '').toUpperCase();
                if (!secret) return;

                if (existingSecrets.has(secret)) return;

                newItems.push({
                    id: Date.now().toString() + Math.random(),
                    account: entry.name || entry.account || entry.label || 'Conta Importada',
                    issuer: entry.issuer || entry.provider || 'Authy/Importado',
                    secret: secret,
                    algorithm: entry.algorithm || 'SHA1',
                    digits: entry.digits || 6,
                    period: entry.period || 30,
                    type: entry.type || 'totp',
                });
                existingSecrets.add(secret);
                importedCount++;
            };

            // 1. Try JSON parsing
            try {
                const data = JSON.parse(fileContent) as unknown;
                let entries: ImportEntry[] = [];

                if (Array.isArray(data)) {
                    entries = data as ImportEntry[];
                } else if (data && typeof data === 'object') {
                    const obj = data as Record<string, unknown>;
                    if (Array.isArray(obj.entries)) {
                        entries = obj.entries as ImportEntry[];
                    } else if (Array.isArray(obj.tokens)) {
                        entries = obj.tokens as ImportEntry[];
                    } else if (Array.isArray(obj.items)) {
                        entries = obj.items as ImportEntry[];
                    } else {
                        entries = [obj as ImportEntry];
                    }
                }

                entries.forEach(addItem);
            } catch (e) {
                // Not a valid JSON or failed to parse, proceed to URI parsing
            }

            // 2. Try OTPAuth URI parsing (line by line)
            if (newItems.length === 0) {
                const lines = fileContent.split(/\r?\n/);
                for (const line of lines) {
                    const trimmed = line.trim();
                    if (trimmed.startsWith('otpauth://')) {
                        try {
                            const parsed = OTPAuth.URI.parse(trimmed);
                            if (parsed) {
                                addItem({
                                    account: parsed.label,
                                    issuer: parsed.issuer,
                                    secret: parsed.secret.base32,
                                    algorithm: parsed.algorithm,
                                    digits: parsed.digits,
                                    period: parsed instanceof OTPAuth.TOTP ? (parsed as OTPAuth.TOTP).period : 30,
                                    type: 'totp'
                                });
                            }
                        } catch (err) {
                            console.error('Falha ao processar URI:', trimmed);
                        }
                    } else if (trimmed.length > 10 && !trimmed.includes(' ')) {
                        // Maybe it's just a raw secret?
                        addItem({ secret: trimmed });
                    }
                }
            }

            if (newItems.length > 0) {
                store.set('twoFAItems', [...currentItems, ...newItems]);
                return { success: true, count: importedCount };
            }

            return { success: false, error: 'Nenhum token válido encontrado no arquivo.' };

        } catch (error: unknown) {
            console.error('Erro na importação Authy:', error);
            return { success: false, error: 'Ocorreu um erro durante a importação.' };
        }
    }
    return { success: false };
});
