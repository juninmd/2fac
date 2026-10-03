import { app, ipcMain, BrowserWindow } from 'electron';
import electronUpdater from 'electron-updater';
import type { ProgressInfo, UpdateInfo } from 'electron-updater';
import { UpdateStatus } from './types';

const { autoUpdater } = electronUpdater;

const FIRST_CHECK_DELAY_MS = 15_000;
const CHECK_INTERVAL_MS = 6 * 60 * 60 * 1000;
const BUSY_STATES: UpdateStatus['state'][] = ['checking', 'downloading', 'downloaded'];

let status: UpdateStatus = { state: 'idle' };
let pendingVersion = '';
let getWindow: () => BrowserWindow | null = () => null;

const setStatus = (next: UpdateStatus): void => {
    status = next;
    const window = getWindow();
    if (window && !window.isDestroyed()) {
        window.webContents.send('on-update-status', status);
    }
};

export const getUpdateStatus = (): UpdateStatus => status;

export const checkForUpdates = async (): Promise<UpdateStatus> => {
    if (!app.isPackaged) {
        setStatus({ state: 'unsupported', reason: 'Atualizações automáticas só funcionam na versão instalada.' });
        return status;
    }
    if (BUSY_STATES.includes(status.state)) return status;

    try {
        await autoUpdater.checkForUpdates();
    } catch (error) {
        setStatus({ state: 'error', message: error instanceof Error ? error.message : String(error) });
    }
    return status;
};

/** Reinicia o app para aplicar a atualização, apenas se ela já foi baixada. */
export const installUpdate = (): boolean => {
    if (status.state !== 'downloaded') return false;
    autoUpdater.quitAndInstall(false, true);
    return true;
};

export const initAutoUpdater = (windowGetter: () => BrowserWindow | null): void => {
    getWindow = windowGetter;
    autoUpdater.autoDownload = true;
    autoUpdater.autoInstallOnAppQuit = true;
    autoUpdater.allowPrerelease = false;

    autoUpdater.on('checking-for-update', () => setStatus({ state: 'checking' }));
    autoUpdater.on('update-not-available', () => setStatus({ state: 'not-available' }));
    autoUpdater.on('update-available', (info: UpdateInfo) => {
        pendingVersion = info.version;
        setStatus({ state: 'available', version: info.version });
    });
    autoUpdater.on('download-progress', (progress: ProgressInfo) =>
        setStatus({ state: 'downloading', version: pendingVersion, percent: Math.round(progress.percent) }));
    autoUpdater.on('update-downloaded', (info: UpdateInfo) => setStatus({ state: 'downloaded', version: info.version }));
    autoUpdater.on('error', (error: Error) => setStatus({ state: 'error', message: error.message }));

    ipcMain.handle('get-app-version', () => app.getVersion());
    ipcMain.handle('get-update-status', () => getUpdateStatus());
    ipcMain.handle('check-for-updates', () => checkForUpdates());
    ipcMain.handle('install-update', () => installUpdate());

    if (app.isPackaged) {
        setTimeout(() => void checkForUpdates(), FIRST_CHECK_DELAY_MS).unref();
        setInterval(() => void checkForUpdates(), CHECK_INTERVAL_MS).unref();
    }
};
