import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import Settings from './Settings';

// Mock window.electron
const mockSetSettings = jest.fn();
const mockGetSettings = jest.fn();
const mockCheckMasterPassword = jest.fn();
const mockSetMasterPassword = jest.fn();

beforeAll(() => {
  (window as unknown as { electron: Partial<import("../../renderer/types").ElectronAPI> }).electron = {
    setSettings: mockSetSettings,
    getSettings: mockGetSettings,
    checkMasterPassword: mockCheckMasterPassword,
    setMasterPassword: mockSetMasterPassword,
    getAppVersion: jest.fn().mockResolvedValue('1.0.0'),
    getUpdateStatus: jest.fn().mockResolvedValue({ state: 'idle' }),
    onUpdateStatus: jest.fn(() => jest.fn()),
  };
});

describe('Settings', () => {
  const mockOnClose = jest.fn();
  const mockOnExport = jest.fn();
  const mockOnExportEncrypted = jest.fn();
  const mockOnImport = jest.fn();
  const mockOnImportEncrypted = jest.fn();
  const mockOnImportAuthy = jest.fn();
  const mockOnImportGoogleAuth = jest.fn();

  const defaultProps = {
      onClose: mockOnClose,
      onExport: mockOnExport,
      onExportEncrypted: mockOnExportEncrypted,
      onImport: mockOnImport,
      onImportEncrypted: mockOnImportEncrypted,
      onImportAuthy: mockOnImportAuthy,
      onImportGoogleAuth: mockOnImportGoogleAuth,
      itemsCount: 5,
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockGetSettings.mockResolvedValue({
        minimizeToTray: false,
        runOnStartup: false,
        autoLock: true,
        autoLockTimeout: 5,
        blurOnInactive: false
    });
  });

  it('renders settings and loads initial values (General tab)', async () => {
    render(<Settings {...defaultProps} />);

    await waitFor(() => {
        expect(mockGetSettings).toHaveBeenCalled();
    });

    expect(screen.getByText('Configurações')).toBeInTheDocument();
    expect(screen.getByLabelText('Minimizar para a bandeja ao fechar')).toBeInTheDocument();
    expect(screen.getByText('Geral')).toHaveClass('active');
  });

  it('updates minimizeToTray setting (General Tab)', async () => {
    render(<Settings {...defaultProps} />);
    await waitFor(() => expect(mockGetSettings).toHaveBeenCalled());

    const checkbox = screen.getByLabelText('Minimizar para a bandeja ao fechar');
    fireEvent.click(checkbox);

    await waitFor(() => {
        expect(mockSetSettings).toHaveBeenCalledWith(expect.objectContaining({
            minimizeToTray: true
        }));
    });
  });

  it('updates autoLockTimeout and blurOnInactive', async () => {
    render(<Settings {...defaultProps} />);
    await waitFor(() => expect(mockGetSettings).toHaveBeenCalled());

    fireEvent.click(screen.getByText('Segurança'));

    // Test autoLockTimeout
    // The input is nested inside a label with "Tempo para bloqueio (minutos):"
    const timeoutInput = screen.getByDisplayValue('5'); // Default is 5
    fireEvent.change(timeoutInput, { target: { value: '10' } });

    await waitFor(() => {
        expect(mockSetSettings).toHaveBeenCalledWith(expect.objectContaining({
            autoLockTimeout: 10
        }));
    });

    // Test blurOnInactive
    const blurCheckbox = screen.getByLabelText('Desfocar ao perder foco da janela');
    fireEvent.click(blurCheckbox);

    await waitFor(() => {
        expect(mockSetSettings).toHaveBeenCalledWith(expect.objectContaining({
            blurOnInactive: true // Since default mock returned false
        }));
    });
  });

  it('updates runOnStartup', async () => {
    render(<Settings {...defaultProps} />);
    await waitFor(() => expect(mockGetSettings).toHaveBeenCalled());

    const checkbox = screen.getByLabelText('Iniciar com o sistema');
    fireEvent.click(checkbox);

    await waitFor(() => {
        expect(mockSetSettings).toHaveBeenCalledWith(expect.objectContaining({
            runOnStartup: true
        }));
    });
  });

  it('switches to Security tab and updates autoLock', async () => {
    render(<Settings {...defaultProps} />);
    await waitFor(() => expect(mockGetSettings).toHaveBeenCalled());

    fireEvent.click(screen.getByText('Segurança'));

    expect(screen.getByText('Bloqueio e Privacidade')).toBeInTheDocument();

    const checkbox = screen.getByLabelText('Bloqueio automático por inatividade');
    fireEvent.click(checkbox);

    await waitFor(() => {
        expect(mockSetSettings).toHaveBeenCalledWith(expect.objectContaining({
            autoLock: false // It was true initially
        }));
    });
  });

  it('handles password change flow (Security Tab)', async () => {
     render(<Settings {...defaultProps} />);
     await waitFor(() => expect(mockGetSettings).toHaveBeenCalled());
     fireEvent.click(screen.getByText('Segurança'));

     fireEvent.change(screen.getByPlaceholderText('Senha Atual'), { target: { value: 'oldpass' } });
     fireEvent.change(screen.getByPlaceholderText('Nova Senha'), { target: { value: 'newpass' } });
     fireEvent.change(screen.getByPlaceholderText('Confirmar Nova Senha'), { target: { value: 'newpass' } });

     mockCheckMasterPassword.mockResolvedValue(true);
     mockSetMasterPassword.mockResolvedValue(true);

     fireEvent.click(screen.getByText('Atualizar Senha'));

     await waitFor(() => {
         expect(mockCheckMasterPassword).toHaveBeenCalledWith('oldpass');
         expect(mockSetMasterPassword).toHaveBeenCalledWith('newpass');
         expect(screen.getByText('Senha alterada com sucesso!')).toBeInTheDocument();
     });
  });

  it('switches to Data tab and triggers export/import', async () => {
    render(<Settings {...defaultProps} />);
    await waitFor(() => expect(mockGetSettings).toHaveBeenCalled());

    fireEvent.click(screen.getByText('Dados'));

    expect(screen.getByText('Backups e Importação')).toBeInTheDocument();
    expect(screen.getByText('⚠️ Atenção: Não há backup na nuvem')).toBeInTheDocument();

    fireEvent.click(screen.getByText('🔒 Exportar Backup'));
    expect(mockOnExportEncrypted).toHaveBeenCalled();

    fireEvent.click(screen.getByText('📥 Exportar JSON'));
    expect(mockOnExport).toHaveBeenCalled();

    fireEvent.click(screen.getByText('📱 Importar do Authy / URIs'));
    expect(mockOnImportAuthy).toHaveBeenCalled();

    fireEvent.click(screen.getByText('📱 Importar do Google Auth'));
    expect(mockOnImportGoogleAuth).toHaveBeenCalled();
  });

  it('switches to Devices tab and verifies local storage message', async () => {
    render(<Settings {...defaultProps} />);
    await waitFor(() => expect(mockGetSettings).toHaveBeenCalled());

    fireEvent.click(screen.getByText('Dispositivos'));

    expect(screen.getByText('Este Dispositivo (Desktop)')).toBeInTheDocument();
    expect(screen.getByText('🚫 Sincronização Desativada')).toBeInTheDocument();
    expect(screen.getByText(/Este aplicativo opera exclusivamente offline/)).toBeInTheDocument();
  });

  it('calls onClose when close button is clicked', async () => {
      render(<Settings {...defaultProps} />);
      await waitFor(() => expect(mockGetSettings).toHaveBeenCalled());

      // Try finding the close button (SVG or text)
      // Since it's a button with title "Fechar", we can use getByTitle
      fireEvent.click(screen.getByTitle('Fechar'));
      expect(mockOnClose).toHaveBeenCalled();

      // Also check the "Fechar" button at the bottom
      fireEvent.click(screen.getByText('Fechar', { selector: 'button.btn-secondary' }));
      expect(mockOnClose).toHaveBeenCalledTimes(2);
  });

  it('switches to About tab and verifies content', async () => {
    render(<Settings {...defaultProps} />);
    await waitFor(() => expect(mockGetSettings).toHaveBeenCalled());

    fireEvent.click(screen.getByText('Sobre'));

    expect(screen.getByText('Sobre o 2FAC')).toBeInTheDocument();
    expect(screen.getByText('Contas Protegidas:')).toBeInTheDocument();
    expect(screen.getByText('5')).toBeInTheDocument(); // itemsCount
  });

  it('shows error when newPassword !== confirmPassword', async () => {
    render(<Settings {...defaultProps} />);
    await waitFor(() => expect(mockGetSettings).toHaveBeenCalled());
    fireEvent.click(screen.getByText('Segurança'));

    fireEvent.change(screen.getByPlaceholderText('Senha Atual'), { target: { value: 'oldpass' } });
    fireEvent.change(screen.getByPlaceholderText('Nova Senha'), { target: { value: 'newpass' } });
    fireEvent.change(screen.getByPlaceholderText('Confirmar Nova Senha'), { target: { value: 'diffpass' } });

    fireEvent.click(screen.getByText('Atualizar Senha'));

    await waitFor(() => {
        expect(screen.getByText('As novas senhas não conferem.')).toBeInTheDocument();
    });
  });

  it('shows error when newPassword.length < 4', async () => {
    render(<Settings {...defaultProps} />);
    await waitFor(() => expect(mockGetSettings).toHaveBeenCalled());
    fireEvent.click(screen.getByText('Segurança'));

    fireEvent.change(screen.getByPlaceholderText('Senha Atual'), { target: { value: 'oldpass' } });
    fireEvent.change(screen.getByPlaceholderText('Nova Senha'), { target: { value: '123' } });
    fireEvent.change(screen.getByPlaceholderText('Confirmar Nova Senha'), { target: { value: '123' } });

    fireEvent.click(screen.getByText('Atualizar Senha'));

    await waitFor(() => {
        expect(screen.getByText('A nova senha deve ter pelo menos 4 caracteres.')).toBeInTheDocument();
    });
  });

  it('shows error when checkMasterPassword returns false', async () => {
    render(<Settings {...defaultProps} />);
    await waitFor(() => expect(mockGetSettings).toHaveBeenCalled());
    fireEvent.click(screen.getByText('Segurança'));

    fireEvent.change(screen.getByPlaceholderText('Senha Atual'), { target: { value: 'wrongpass' } });
    fireEvent.change(screen.getByPlaceholderText('Nova Senha'), { target: { value: 'newpass' } });
    fireEvent.change(screen.getByPlaceholderText('Confirmar Nova Senha'), { target: { value: 'newpass' } });

    mockCheckMasterPassword.mockResolvedValue(false);

    fireEvent.click(screen.getByText('Atualizar Senha'));

    await waitFor(() => {
        expect(screen.getByText('Senha atual incorreta.')).toBeInTheDocument();
    });
  });

  it('handles exception in checkMasterPassword or setMasterPassword', async () => {
    render(<Settings {...defaultProps} />);
    await waitFor(() => expect(mockGetSettings).toHaveBeenCalled());
    fireEvent.click(screen.getByText('Segurança'));

    fireEvent.change(screen.getByPlaceholderText('Senha Atual'), { target: { value: 'oldpass' } });
    fireEvent.change(screen.getByPlaceholderText('Nova Senha'), { target: { value: 'newpass' } });
    fireEvent.change(screen.getByPlaceholderText('Confirmar Nova Senha'), { target: { value: 'newpass' } });

    mockCheckMasterPassword.mockRejectedValue(new Error('Crash'));

    fireEvent.click(screen.getByText('Atualizar Senha'));

    await waitFor(() => {
        expect(screen.getByText('Erro ao alterar senha.')).toBeInTheDocument();
    });
  });
});
