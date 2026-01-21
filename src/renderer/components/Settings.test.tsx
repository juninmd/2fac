import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import Settings from './Settings';

// Mock window.electron
const mockSetSettings = jest.fn();
const mockGetSettings = jest.fn();
const mockCheckMasterPassword = jest.fn();
const mockSetMasterPassword = jest.fn();

beforeAll(() => {
  (window as any).electron = {
    setSettings: mockSetSettings,
    getSettings: mockGetSettings,
    checkMasterPassword: mockCheckMasterPassword,
    setMasterPassword: mockSetMasterPassword,
  };
});

describe('Settings', () => {
  const mockOnClose = jest.fn();
  const mockOnExport = jest.fn();
  const mockOnExportEncrypted = jest.fn();
  const mockOnImport = jest.fn();
  const mockOnImportEncrypted = jest.fn();
  const mockOnImportAuthy = jest.fn();

  const defaultProps = {
      onClose: mockOnClose,
      onExport: mockOnExport,
      onExportEncrypted: mockOnExportEncrypted,
      onImport: mockOnImport,
      onImportEncrypted: mockOnImportEncrypted,
      onImportAuthy: mockOnImportAuthy,
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

    fireEvent.click(screen.getByText('🔒 Exportar Backup'));
    expect(mockOnExportEncrypted).toHaveBeenCalled();

    fireEvent.click(screen.getByText('📥 Exportar JSON'));
    expect(mockOnExport).toHaveBeenCalled();
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
});
