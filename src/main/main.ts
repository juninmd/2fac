import { app, BrowserWindow, Menu, ipcMain, dialog } from 'electron';
import * as path from 'path';
import * as fs from 'fs';
import * as crypto from 'crypto';
import Store from 'electron-store';

const isDev = process.env.NODE_ENV === 'development';
const store = new Store();

let mainWindow: BrowserWindow | null;

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

    if (isDev) {
        mainWindow.webContents.openDevTools();
    }

    mainWindow.on('closed', () => {
        mainWindow = null;
    });
};

app.on('ready', createWindow);

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
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
    const items = store.get('twoFAItems', []);
    return items;
});

ipcMain.handle('add-2fa-item', (_event, item) => {
    const items = store.get('twoFAItems', []) as any[];
    item.id = Date.now().toString();
    items.push(item);
    store.set('twoFAItems', items);
    return item;
});

ipcMain.handle('remove-2fa-item', (_event, id) => {
    const items = store.get('twoFAItems', []) as any[];
    const filtered = items.filter((item: any) => item.id !== id);
    store.set('twoFAItems', filtered);
    return true;
});

ipcMain.handle('update-2fa-item', (_event, id, updatedItem) => {
    const items = store.get('twoFAItems', []) as any[];
    const index = items.findIndex((item: any) => item.id === id);
    if (index >= 0) {
        items[index] = { ...items[index], ...updatedItem };
        store.set('twoFAItems', items);
        return items[index];
    }
    return null;
});

ipcMain.handle('export-2fa', async () => {
    const items = store.get('twoFAItems', []);
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

ipcMain.handle('set-master-password', (_event, password) => {
    const hash = crypto.createHash('sha256').update(password).digest('hex');
    store.set('masterPassword', hash);
    return true;
});

ipcMain.handle('check-master-password', (_event, password) => {
    const savedHash = store.get('masterPassword');
    const hash = crypto.createHash('sha256').update(password).digest('hex');
    return savedHash === hash;
});

ipcMain.handle('has-master-password', () => {
    return store.has('masterPassword');
});

ipcMain.handle('import-2fa', async () => {
    const result = await dialog.showOpenDialog(mainWindow!, {
        filters: [{ name: 'JSON Files', extensions: ['json'] }],
        properties: ['openFile'],
    });

    if (!result.canceled && result.filePaths[0]) {
        const filePath = result.filePaths[0];
        const fileContent = fs.readFileSync(filePath, 'utf-8');
        const importedItems = JSON.parse(fileContent);

        // Assign new IDs to imported items
        const itemsWithIds = importedItems.map((item: any) => ({
            ...item,
            id: Date.now().toString() + Math.random(),
        }));

        const currentItems = store.get('twoFAItems', []) as any[];
        const allItems = [...currentItems, ...itemsWithIds];
        store.set('twoFAItems', allItems);

        return { success: true, count: itemsWithIds.length };
    }
    return { success: false };
});

ipcMain.handle('import-authy', async () => {
    const result = await dialog.showOpenDialog(mainWindow!, {
        filters: [{ name: 'JSON Files', extensions: ['json'] }],
        properties: ['openFile'],
    });

    if (!result.canceled && result.filePaths[0]) {
        const filePath = result.filePaths[0];
        const fileContent = fs.readFileSync(filePath, 'utf-8');

        try {
            // Handle both Authy export formats
            let authyData = JSON.parse(fileContent);

            // Some Authy backups are encrypted or nested
            let entries = authyData.entries || authyData;
            if (!Array.isArray(entries)) {
                entries = [authyData];
            }

            const convertedItems = entries
                .filter((entry: any) => entry.secret)
                .map((entry: any) => ({
                    id: Date.now().toString() + Math.random(),
                    account: entry.name || entry.account || 'Unknown',
                    issuer: entry.issuer || 'Imported',
                    secret: entry.secret,
                    algorithm: entry.algorithm || 'SHA1',
                    digits: entry.digits || 6,
                    period: entry.period || 30,
                    type: entry.type || 'totp',
                }));

            if (convertedItems.length === 0) {
                return { success: false, error: 'No valid 2FA entries found in file' };
            }

            const currentItems = store.get('twoFAItems', []) as any[];
            const allItems = [...currentItems, ...convertedItems];
            store.set('twoFAItems', allItems);

            return { success: true, count: convertedItems.length };
        } catch (error) {
            return { success: false, error: 'Failed to parse Authy file' };
        }
    }
    return { success: false };
});
