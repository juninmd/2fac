import { app, BrowserWindow, Menu, ipcMain, dialog, desktopCapturer, Tray, nativeImage } from 'electron';
import * as path from 'path';
import * as fs from 'fs';
import jsQR from 'jsqr';
import { TwoFAItem, AppSettings, BackupFile, ImportResult } from './types';
import {
    getTwoFAItems, setTwoFAItems, addTwoFAItem, removeTwoFAItem,
    updateTwoFAItem, mergeTwoFAItems, getAppSettings, setAppSettings,
    hasMasterPassword, getMasterPasswordHash, setMasterPasswordHash
} from './store';
import { hashPassword, encryptData, decryptData, generateId } from './crypto';
import { importAuthy } from './importers/authy';
import { importGoogleAuth } from './importers/google-auth';

const isDev = process.env.NODE_ENV === 'development';
app.disableHardwareAcceleration();

let mainWindow: BrowserWindow | null;
let tray: Tray | null = null;
let isQuitting = false;
let initialProtocolUrl: string | null = null;

function createTray(): void {
    if (tray) return;

    const iconPath = path.join(__dirname, '../../public/icon.png');
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
}

function createWindow(): void {
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

    mainWindow.setContentProtection(true);

    mainWindow.on('close', (event) => {
        const settings = getAppSettings();
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
}

function focusMainWindow(): void {
    if (!mainWindow) return;
    if (mainWindow.isMinimized()) mainWindow.restore();
    mainWindow.show();
    mainWindow.focus();
}

function findOtpauthUrl(args: string[]): string | undefined {
    return args.find((arg) => arg.startsWith('otpauth://'));
}

const gotTheLock = app.requestSingleInstanceLock();

if (!gotTheLock) {
    app.quit();
} else {
    app.on('second-instance', (_event, commandLine) => {
        focusMainWindow();
        const url = findOtpauthUrl(commandLine);
        if (url) {
            mainWindow?.webContents.send('on-protocol-url', url);
        }
    });

    app.on('ready', () => {
        if (process.platform !== 'darwin') {
            const urlArg = findOtpauthUrl(process.argv);
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

        const settings = getAppSettings();
        app.setLoginItemSettings({
            openAtLogin: !!settings.runOnStartup,
            openAsHidden: !!settings.minimizeToTray
        });
    });
}

app.on('open-url', (event, url) => {
    event.preventDefault();
    if (mainWindow) {
        focusMainWindow();
        mainWindow.webContents.send('on-protocol-url', url);
    } else {
        initialProtocolUrl = url;
    }
});

app.on('before-quit', () => {
    isQuitting = true;
});

app.on('window-all-closed', () => {
    const settings = getAppSettings();
    if (process.platform !== 'darwin' && !settings.minimizeToTray) {
        app.quit();
    }
});

app.on('activate', () => {
    if (mainWindow === null) {
        createWindow();
    }
});

// IPC Handlers

ipcMain.handle('import-google-auth', async (): Promise<ImportResult> => {
    const result = await dialog.showOpenDialog(mainWindow!, {
        filters: [{ name: 'Links otpauth-migration', extensions: ['txt'] }],
        title: 'Importar do Google Authenticator (Cole o URI num .txt e selecione)',
        properties: ['openFile'],
    });

    if (!result.canceled && result.filePaths[0]) {
        return importGoogleAuth(result.filePaths[0]);
    }
    return { success: false };
});

ipcMain.handle('get-2fa-items', () => {
    return getTwoFAItems();
});

ipcMain.handle('add-2fa-item', (_event, item: Omit<TwoFAItem, 'id'>) => {
    return addTwoFAItem(item);
});

ipcMain.handle('remove-2fa-item', (_event, id: string) => {
    return removeTwoFAItem(id);
});

ipcMain.handle('update-2fa-item', (_event, id: string, updatedItem: Partial<TwoFAItem>) => {
    return updateTwoFAItem(id, updatedItem);
});

ipcMain.handle('set-2fa-items', (_event, items: TwoFAItem[]) => {
    setTwoFAItems(items);
    return true;
});

ipcMain.handle('export-2fa', async () => {
    const items = getTwoFAItems();
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

ipcMain.handle('export-2fa-encrypted', async (_event, password: string) => {
    const items = getTwoFAItems();
    const result = await dialog.showSaveDialog(mainWindow!, {
        defaultPath: `2fa-backup-encrypted-${new Date().getTime()}.enc`,
        filters: [{ name: 'Encrypted 2FA Backup', extensions: ['enc'] }],
    });

    if (!result.canceled && result.filePath) {
        try {
            const data = JSON.stringify(items);
            const { salt, iv, authTag, encrypted } = encryptData(data, password);

            const backupFile: BackupFile = {
                version: 1,
                salt,
                iv,
                authTag,
                data: encrypted,
            };

            fs.writeFileSync(result.filePath, JSON.stringify(backupFile));
            return { success: true, path: result.filePath };
        } catch (error: unknown) {
            const message = error instanceof Error ? error.message : String(error);
            console.error('Export encryption error:', error);
            return { success: false, error: message };
        }
    }
    return { success: false };
});

ipcMain.handle('import-2fa-encrypted', async (_event, password: string): Promise<ImportResult> => {
    const result = await dialog.showOpenDialog(mainWindow!, {
        filters: [{ name: 'Encrypted 2FA Backup', extensions: ['enc'] }],
        properties: ['openFile'],
    });

    if (!result.canceled && result.filePaths[0]) {
        try {
            const filePath = result.filePaths[0];
            const fileContent = fs.readFileSync(filePath, 'utf-8');

            let backupData: BackupFile;
            try {
                backupData = JSON.parse(fileContent);
            } catch {
                return { success: false, error: 'Invalid backup file format' };
            }

            if (!backupData.version || !backupData.salt || !backupData.iv || !backupData.authTag || !backupData.data) {
                return { success: false, error: 'Invalid backup file structure' };
            }

            const decrypted = decryptData(backupData.data, password, backupData.salt, backupData.iv, backupData.authTag);
            const importedItems: TwoFAItem[] = JSON.parse(decrypted);

            const itemsWithIds = importedItems.map((item) => ({
                ...item,
                id: generateId(),
            }));

            mergeTwoFAItems(itemsWithIds);
            return { success: true, count: itemsWithIds.length };
        } catch (error: unknown) {
            const message = error instanceof Error ? error.message : String(error);
            console.error('Import decryption error:', error);
            if (message.includes('auth tag')) {
                return { success: false, error: 'Senha incorreta ou arquivo corrompido' };
            }
            return { success: false, error: message };
        }
    }
    return { success: false };
});

ipcMain.handle('scan-screen-qr', async () => {
    try {
        if (mainWindow) {
            mainWindow.minimize();
        }

        await new Promise((resolve) => setTimeout(resolve, 500));

        const sources = await desktopCapturer.getSources({
            types: ['screen'],
            thumbnailSize: { width: 3840, height: 2160 }
        });

        for (const source of sources) {
            const image = source.thumbnail;
            const size = image.getSize();
            const bitmap = image.toBitmap();

            const code = jsQR(new Uint8ClampedArray(bitmap), size.width, size.height);

            if (code) {
                if (mainWindow) mainWindow.restore();
                return { success: true, data: code.data };
            }
        }

        if (mainWindow) mainWindow.restore();
        return { success: false, error: 'QR Code not found on screen' };
    } catch (error: unknown) {
        const message = error instanceof Error ? error.message : String(error);
        console.error('QR Scan error:', error);
        if (mainWindow) mainWindow.restore();
        return { success: false, error: message };
    }
});

ipcMain.handle('set-master-password', (_event, password: string) => {
    const hash = hashPassword(password);
    setMasterPasswordHash(hash);
    return true;
});

ipcMain.handle('check-master-password', (_event, password: string) => {
    const savedHash = getMasterPasswordHash();
    const hash = hashPassword(password);
    return savedHash === hash;
});

ipcMain.handle('has-master-password', () => {
    return hasMasterPassword();
});

ipcMain.handle('get-settings', () => {
    return getAppSettings();
});

ipcMain.handle('set-settings', (_event, settings: AppSettings) => {
    setAppSettings(settings);
    app.setLoginItemSettings({
        openAtLogin: !!settings.runOnStartup,
        openAsHidden: !!settings.minimizeToTray
    });
    return true;
});

ipcMain.handle('import-2fa', async (): Promise<ImportResult> => {
    const result = await dialog.showOpenDialog(mainWindow!, {
        filters: [{ name: 'JSON Files', extensions: ['json'] }],
        properties: ['openFile'],
    });

    if (!result.canceled && result.filePaths[0]) {
        const filePath = result.filePaths[0];
        const fileContent = fs.readFileSync(filePath, 'utf-8');
        const importedItems: TwoFAItem[] = JSON.parse(fileContent);

        const itemsWithIds = importedItems.map((item) => ({
            ...item,
            id: generateId(),
        }));

        mergeTwoFAItems(itemsWithIds);
        return { success: true, count: itemsWithIds.length };
    }
    return { success: false };
});

ipcMain.handle('import-authy', async (): Promise<ImportResult> => {
    const result = await dialog.showOpenDialog(mainWindow!, {
        filters: [{ name: 'Arquivos de Backup', extensions: ['json', 'txt', 'uri'] }],
        title: 'Importar de Authy ou Lista de URIs',
        properties: ['openFile'],
    });

    if (!result.canceled && result.filePaths[0]) {
        return importAuthy(result.filePaths[0]);
    }
    return { success: false };
});
