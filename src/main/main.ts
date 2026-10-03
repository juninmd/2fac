import { app, BrowserWindow, Menu, ipcMain, dialog, desktopCapturer, Tray, nativeImage } from 'electron';
import * as path from 'path';
import { existsSync } from 'fs';
import { writeFile } from 'fs/promises';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
import Store from 'electron-store';
import jsQR from 'jsqr';
import {
    createStore,
    getTwoFAItems,
    setTwoFAItems,
    addTwoFAItem,
    removeTwoFAItem,
    updateTwoFAItem,
    getAppSettings,
    setAppSettings,
    setSessionKey,
    getSessionKey,
} from './store';
import { hashPassword, encryptData, getArgonKey } from './crypto';
import * as crypto from 'crypto';
import {
    importGoogleAuth,
    importAuthy,
    importEncrypted,
    importPlain,
} from './importers';
import { initAutoUpdater } from './updater';
import { TwoFAItem, AppSettings } from './types';

const sleep = (ms: number): Promise<void> => new Promise(resolve => setTimeout(resolve, ms));

const writeFileAsync = async (filePath: string, data: string): Promise<void> => {
    await writeFile(filePath, data, 'utf-8');
};

const getErrorMessage = (error: unknown): string =>
    error instanceof Error ? error.message : String(error);

const START_HIDDEN_ARG = '--hidden';
const isDev = process.env.NODE_ENV === 'development';
app.disableHardwareAcceleration();

const store = createStore();

let mainWindow: BrowserWindow | null = null;
let tray: Tray | null = null;
let isQuitting = false;
let initialProtocolUrl: string | null = null;

const createTray = (): void => {
    if (tray) return;

    const iconPath = path.join(__dirname, '../../public/icon.png');
    let icon = nativeImage.createEmpty();
    if (existsSync(iconPath)) {
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
            },
        },
        { type: 'separator' },
        {
            label: 'Sair',
            click: () => {
                isQuitting = true;
                app.quit();
            },
        },
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

const createWindow = (): void => {
    mainWindow = new BrowserWindow({
        show: !process.argv.includes(START_HIDDEN_ARG),
        width: 900,
        height: 700,
        minWidth: 600,
        minHeight: 400,
        webPreferences: {
            preload: path.join(__dirname, '../preload/preload.cjs'),
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
        const settings = getAppSettings(store);
        if (settings.minimizeToTray && !isQuitting) {
            event.preventDefault();
            mainWindow?.hide();
        }
    });

    mainWindow.on('closed', () => {
        mainWindow = null;
    });
};

const focusMainWindow = (): void => {
    if (mainWindow) {
        if (mainWindow.isMinimized()) mainWindow.restore();
        mainWindow.show();
        mainWindow.focus();
    }
};

const gotTheLock = app.requestSingleInstanceLock();

if (!gotTheLock) {
    app.quit();
} else {
    app.on('second-instance', (_event, commandLine) => {
        focusMainWindow();
        const url = commandLine.find(arg => arg.startsWith('otpauth://'));
        if (url) {
            mainWindow?.webContents.send('on-protocol-url', url);
        }
    });

    app.on('ready', () => {
        if (process.platform !== 'darwin') {
            const urlArg = process.argv.find(arg => arg.startsWith('otpauth://'));
            if (urlArg) {
                initialProtocolUrl = urlArg;
            }
        }

        createWindow();
        createTray();
        initAutoUpdater(() => mainWindow);

        if (process.defaultApp) {
            if (process.argv.length >= 2) {
                app.setAsDefaultProtocolClient('otpauth', process.execPath, [path.resolve(process.argv[1])]);
            }
        } else {
            app.setAsDefaultProtocolClient('otpauth');
        }

        const settings = getAppSettings(store);
        app.setLoginItemSettings({
            openAtLogin: !!settings.runOnStartup,
            args: settings.minimizeToTray ? [START_HIDDEN_ARG] : [],
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
    const settings = getAppSettings(store);
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

ipcMain.handle('get-2fa-items', () => {
    return getTwoFAItems(store);
});

ipcMain.handle('add-2fa-item', (_event, item: Omit<TwoFAItem, 'id'>) => {
    return addTwoFAItem(store, item);
});

ipcMain.handle('remove-2fa-item', (_event, id: string) => {
    return removeTwoFAItem(store, id);
});

ipcMain.handle('update-2fa-item', (_event, id: string, updatedItem: Partial<TwoFAItem>) => {
    return updateTwoFAItem(store, id, updatedItem);
});

ipcMain.handle('set-2fa-items', (_event, items: TwoFAItem[]) => {
    setTwoFAItems(store, items);
    return true;
});

ipcMain.handle('export-2fa', async () => {
    const items = getTwoFAItems(store);
    const result = await dialog.showSaveDialog(mainWindow!, {
        defaultPath: `2fa-backup-${Date.now()}.json`,
        filters: [{ name: 'JSON Files', extensions: ['json'] }],
    });

    if (!result.canceled && result.filePath) {
        await writeFile(result.filePath, JSON.stringify(items, null, 2), 'utf-8');
        return { success: true, path: result.filePath };
    }
    return { success: false };
});

ipcMain.handle('export-2fa-encrypted', async (_event, password: string) => {
    const items = getTwoFAItems(store);
    const result = await dialog.showSaveDialog(mainWindow!, {
        defaultPath: `2fa-backup-encrypted-${Date.now()}.enc`,
        filters: [{ name: 'Encrypted 2FA Backup', extensions: ['enc'] }],
    });

    if (!result.canceled && result.filePath) {
        try {
            const backupFile = await encryptData(JSON.stringify(items), password);
            await writeFile(result.filePath, JSON.stringify(backupFile), 'utf-8');
            return { success: true, path: result.filePath };
        } catch (error) {
            console.error('Export encryption error:', error);
            return { success: false, error: getErrorMessage(error) };
        }
    }
    return { success: false };
});

ipcMain.handle('import-2fa-encrypted', async (_event, password: string) => {
    const result = await dialog.showOpenDialog(mainWindow!, {
        filters: [{ name: 'Encrypted 2FA Backup', extensions: ['enc'] }],
        properties: ['openFile'],
    });

    if (!result.canceled && result.filePaths[0]) {
        return importEncrypted(result.filePaths[0], password, store);
    }
    return { success: false };
});

ipcMain.handle('import-2fa', async () => {
    const result = await dialog.showOpenDialog(mainWindow!, {
        filters: [{ name: 'JSON Files', extensions: ['json'] }],
        properties: ['openFile'],
    });

    if (!result.canceled && result.filePaths[0]) {
        return importPlain(result.filePaths[0], store);
    }
    return { success: false };
});

ipcMain.handle('import-google-auth', async () => {
    const result = await dialog.showOpenDialog(mainWindow!, {
        filters: [{ name: 'Links otpauth-migration', extensions: ['txt'] }],
        title: 'Importar do Google Authenticator (Cole o URI num .txt e selecione)',
        properties: ['openFile'],
    });

    if (!result.canceled && result.filePaths[0]) {
        return importGoogleAuth(result.filePaths[0], store);
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
        return importAuthy(result.filePaths[0], store);
    }
    return { success: false };
});

ipcMain.handle('scan-screen-qr', async () => {
    try {
        if (mainWindow) {
            mainWindow.minimize();
        }

        await sleep(500);

        const sources = await desktopCapturer.getSources({
            types: ['screen'],
            thumbnailSize: { width: 3840, height: 2160 },
        });

        for (const source of sources) {
            const { thumbnail } = source;
            const size = thumbnail.getSize();
            const bitmap = thumbnail.toBitmap();
            const code = jsQR(new Uint8ClampedArray(bitmap), size.width, size.height);

            if (code) {
                if (mainWindow) mainWindow.restore();
                return { success: true, data: code.data };
            }
        }

        if (mainWindow) mainWindow.restore();
        return { success: false, error: 'QR Code not found on screen' };
    } catch (error) {
        console.error('QR Scan error:', error);
        if (mainWindow) mainWindow.restore();
        return { success: false, error: getErrorMessage(error) };
    }
});

ipcMain.handle('set-master-password', async (_event, password: string) => {
    const salt = crypto.randomBytes(32).toString('hex');
    const hash = await hashPassword(password, salt);
    store.set('masterPassword', { hash, salt });

    // Derive key and set session key
    const saltBuffer = Buffer.from(salt, 'hex');
    const key = await getArgonKey(password, saltBuffer);
    setSessionKey(key);

    // Trigger a read which will encrypt existing plaintext items
    getTwoFAItems(store);

    return true;
});

ipcMain.handle('check-master-password', async (_event, password: string) => {
    const savedData = store.get('masterPassword') as { hash: string; salt: string } | undefined;
    if (!savedData || !savedData.salt || !savedData.hash) return false;
    const hash = await hashPassword(password, savedData.salt);

    const isValid = savedData.hash === hash;
    if (isValid) {
        const saltBuffer = Buffer.from(savedData.salt, 'hex');
        const key = await getArgonKey(password, saltBuffer);
        setSessionKey(key);
    }

    return isValid;
});

ipcMain.handle('lock-app', () => {
    setSessionKey(null);
    return true;
});

ipcMain.handle('has-master-password', () => {
    return store.has('masterPassword');
});

ipcMain.handle('get-settings', () => {
    return getAppSettings(store);
});

ipcMain.handle('set-settings', (_event, settings: AppSettings) => {
    setAppSettings(store, settings);
    app.setLoginItemSettings({
        openAtLogin: !!settings.runOnStartup,
        args: settings.minimizeToTray ? [START_HIDDEN_ARG] : [],
    });
    return true;
});
