import React from 'react';
import { render, screen, act, fireEvent, waitFor } from '@testing-library/react';
import UpdateSection, { describeUpdate } from './UpdateSection';
import UpdateBanner from './UpdateBanner';
import { UpdateStatus } from '../types';

const api = window.electron as jest.Mocked<typeof window.electron>;
let push: (status: UpdateStatus) => void = () => undefined;

beforeEach(() => {
    jest.clearAllMocks();
    api.getAppVersion.mockResolvedValue('1.0.0');
    api.getUpdateStatus.mockResolvedValue({ state: 'idle' });
    api.checkForUpdates.mockResolvedValue({ state: 'not-available' });
    api.installUpdate.mockResolvedValue(true);
    api.onUpdateStatus.mockImplementation(cb => { push = cb; return jest.fn(); });
});

describe('UpdateSection', () => {
    it('mostra a versão e verifica atualizações sob demanda', async () => {
        render(<UpdateSection />);
        expect(await screen.findByText(/Versão atual: 1.0.0/)).toBeInTheDocument();
        fireEvent.click(screen.getByText('Verificar atualizações'));
        await waitFor(() => expect(screen.getByRole('status')).toHaveTextContent('versão mais recente'));
        expect(api.checkForUpdates).toHaveBeenCalledTimes(1);
    });

    it('desabilita o botão enquanto baixa e oferece instalar quando pronto', async () => {
        render(<UpdateSection />);
        await screen.findByText(/Versão atual/);
        act(() => push({ state: 'downloading', version: '2.0.0', percent: 40 }));
        expect(screen.getByRole('status')).toHaveTextContent('40%');
        expect(screen.getByText('Verificar atualizações')).toBeDisabled();

        act(() => push({ state: 'downloaded', version: '2.0.0' }));
        fireEvent.click(screen.getByText('Reiniciar e atualizar'));
        expect(api.installUpdate).toHaveBeenCalledTimes(1);
    });

    it('descreve todos os estados', () => {
        expect(describeUpdate({ state: 'idle' })).toBe('');
        expect(describeUpdate({ state: 'checking' })).toMatch(/Verificando/);
        expect(describeUpdate({ state: 'available', version: '2' })).toMatch(/2/);
        expect(describeUpdate({ state: 'unsupported', reason: 'dev' })).toBe('dev');
        expect(describeUpdate({ state: 'error', message: 'falhou' })).toMatch(/falhou/);
    });

    it('cancela a inscrição ao desmontar', async () => {
        const unsubscribe = jest.fn();
        api.onUpdateStatus.mockReturnValue(unsubscribe);
        const { unmount } = render(<UpdateSection />);
        await screen.findByText(/Versão atual/);
        unmount();
        expect(unsubscribe).toHaveBeenCalled();
    });
});

describe('UpdateBanner', () => {
    it('fica oculto sem atualização e aparece quando baixando ou pronta', async () => {
        const { container } = render(<UpdateBanner />);
        await waitFor(() => expect(api.getUpdateStatus).toHaveBeenCalled());
        expect(container).toBeEmptyDOMElement();

        act(() => push({ state: 'downloading', version: '2.0.0', percent: 10 }));
        expect(screen.getByRole('status')).toHaveTextContent('Baixando atualização 2.0.0');

        act(() => push({ state: 'downloaded', version: '2.0.0' }));
        fireEvent.click(screen.getByText('Reiniciar e atualizar'));
        expect(api.installUpdate).toHaveBeenCalled();
    });

    it('ignora erros de verificação em segundo plano', async () => {
        const { container } = render(<UpdateBanner />);
        act(() => push({ state: 'error', message: 'offline' }));
        expect(container).toBeEmptyDOMElement();
    });
});
