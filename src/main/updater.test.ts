/** @jest-environment node */
import { EventEmitter } from 'events';

const handlers = new Map<string, (...args: unknown[]) => unknown>();
const appMock = { isPackaged: true, getVersion: jest.fn(() => '1.2.3') };
const updater = Object.assign(new EventEmitter(), {
    autoDownload: false,
    autoInstallOnAppQuit: false,
    allowPrerelease: true,
    checkForUpdates: jest.fn(),
    quitAndInstall: jest.fn(),
});

jest.mock('electron', () => ({
    app: appMock,
    ipcMain: { handle: (channel: string, fn: (...args: unknown[]) => unknown) => handlers.set(channel, fn) },
    BrowserWindow: class {},
}));
jest.mock('electron-updater', () => ({ __esModule: true, default: { autoUpdater: updater } }));

import { initAutoUpdater, checkForUpdates, installUpdate, getUpdateStatus } from './updater';

const send = jest.fn();
const window = { isDestroyed: () => false, webContents: { send } };

describe('updater', () => {
    beforeAll(() => {
        jest.useFakeTimers();
        initAutoUpdater(() => window as never);
    });
    afterAll(() => jest.useRealTimers());
    beforeEach(() => {
        updater.checkForUpdates.mockReset().mockResolvedValue(undefined);
        updater.quitAndInstall.mockClear();
        appMock.isPackaged = true;
        updater.emit('update-not-available'); // volta a um estado não ocupado
        send.mockClear();
    });

    it('configura download automático e bloqueia pré-releases', () => {
        expect(updater.autoDownload).toBe(true);
        expect(updater.autoInstallOnAppQuit).toBe(true);
        expect(updater.allowPrerelease).toBe(false);
    });

    it('propaga o ciclo checking → available → downloading → downloaded para a janela', () => {
        updater.emit('checking-for-update');
        updater.emit('update-available', { version: '2.0.0' });
        updater.emit('download-progress', { percent: 41.6 });
        updater.emit('update-downloaded', { version: '2.0.0' });
        expect(send.mock.calls.map(c => c[1])).toEqual([
            { state: 'checking' },
            { state: 'available', version: '2.0.0' },
            { state: 'downloading', version: '2.0.0', percent: 42 },
            { state: 'downloaded', version: '2.0.0' },
        ]);
        expect(send).toHaveBeenCalledWith('on-update-status', expect.anything());
    });

    it('registra falhas do updater como erro', () => {
        updater.emit('error', new Error('sem rede'));
        expect(getUpdateStatus()).toEqual({ state: 'error', message: 'sem rede' });
    });

    it('checkForUpdates consulta o feed quando empacotado', async () => {
        await checkForUpdates();
        expect(updater.checkForUpdates).toHaveBeenCalledTimes(1);
    });

    it('não consulta o feed em modo de desenvolvimento', async () => {
        appMock.isPackaged = false;
        expect(await checkForUpdates()).toMatchObject({ state: 'unsupported' });
        expect(updater.checkForUpdates).not.toHaveBeenCalled();
    });

    it('não dispara verificações concorrentes', async () => {
        updater.emit('checking-for-update');
        await checkForUpdates();
        expect(updater.checkForUpdates).not.toHaveBeenCalled();
    });

    it('converte rejeição do checkForUpdates em status de erro', async () => {
        updater.checkForUpdates.mockRejectedValue(new Error('app-update.yml ausente'));
        expect(await checkForUpdates()).toEqual({ state: 'error', message: 'app-update.yml ausente' });
    });

    it('installUpdate só reinicia depois que o download terminou', () => {
        expect(installUpdate()).toBe(false);
        expect(updater.quitAndInstall).not.toHaveBeenCalled();
        updater.emit('update-downloaded', { version: '2.0.0' });
        expect(installUpdate()).toBe(true);
        expect(updater.quitAndInstall).toHaveBeenCalledWith(false, true);
    });

    it('expõe os handlers IPC e agenda a primeira verificação', async () => {
        expect([...handlers.keys()].sort()).toEqual(['check-for-updates', 'get-app-version', 'get-update-status', 'install-update']);
        expect(handlers.get('get-app-version')?.()).toBe('1.2.3');
        updater.checkForUpdates.mockClear();
        await jest.advanceTimersByTimeAsync(15_000);
        expect(updater.checkForUpdates).toHaveBeenCalled();
    });
});
