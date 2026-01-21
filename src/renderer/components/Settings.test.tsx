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

  it('renders settings and loads initial values', async () => {
    render(<Settings onClose={mockOnClose} />);

    await waitFor(() => {
        expect(mockGetSettings).toHaveBeenCalled();
    });

    expect(screen.getByText('Configurações')).toBeInTheDocument();
    expect(screen.getByLabelText('Minimizar para a bandeja ao fechar')).toBeInTheDocument();
  });

  it('updates minimizeToTray setting', async () => {
    render(<Settings onClose={mockOnClose} />);
    await waitFor(() => expect(mockGetSettings).toHaveBeenCalled());

    const checkbox = screen.getByLabelText('Minimizar para a bandeja ao fechar');
    fireEvent.click(checkbox);

    await waitFor(() => {
        expect(mockSetSettings).toHaveBeenCalledWith(expect.objectContaining({
            minimizeToTray: true
        }));
    });
  });

  it('updates runOnStartup setting', async () => {
    render(<Settings onClose={mockOnClose} />);
    await waitFor(() => expect(mockGetSettings).toHaveBeenCalled());

    const checkbox = screen.getByLabelText('Iniciar com o sistema');
    fireEvent.click(checkbox);

    await waitFor(() => {
        expect(mockSetSettings).toHaveBeenCalledWith(expect.objectContaining({
            runOnStartup: true
        }));
    });
  });

  it('updates autoLock setting', async () => {
    render(<Settings onClose={mockOnClose} />);
    await waitFor(() => expect(mockGetSettings).toHaveBeenCalled());

    const checkbox = screen.getByLabelText('Bloqueio automático por inatividade');
    fireEvent.click(checkbox);

    await waitFor(() => {
        expect(mockSetSettings).toHaveBeenCalledWith(expect.objectContaining({
            autoLock: false // It was true initially
        }));
    });
  });

  it('updates blurOnInactive setting', async () => {
    render(<Settings onClose={mockOnClose} />);
    await waitFor(() => expect(mockGetSettings).toHaveBeenCalled());

    const checkbox = screen.getByLabelText('Desfocar ao perder foco da janela (Segurança)');
    fireEvent.click(checkbox);

    await waitFor(() => {
        expect(mockSetSettings).toHaveBeenCalledWith(expect.objectContaining({
            blurOnInactive: true
        }));
    });
  });

  it('updates autoLock timeout', async () => {
     render(<Settings onClose={mockOnClose} />);
     await waitFor(() => expect(mockGetSettings).toHaveBeenCalled());

    const input = screen.getByLabelText('Tempo para bloqueio (minutos):');
    fireEvent.change(input, { target: { value: '10' } });

    expect(mockSetSettings).toHaveBeenCalledWith(expect.objectContaining({
        autoLockTimeout: 10
    }));
  });

    it('updates autoLock timeout with default fallback', async () => {
     render(<Settings onClose={mockOnClose} />);
     await waitFor(() => expect(mockGetSettings).toHaveBeenCalled());

    const input = screen.getByLabelText('Tempo para bloqueio (minutos):');
    fireEvent.change(input, { target: { value: '' } }); // Invalid

    expect(mockSetSettings).toHaveBeenCalledWith(expect.objectContaining({
        autoLockTimeout: 1
    }));
  });

  it('handles password change success', async () => {
     render(<Settings onClose={mockOnClose} />);
     await waitFor(() => expect(mockGetSettings).toHaveBeenCalled());

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

  it('handles password change mismatch', async () => {
     render(<Settings onClose={mockOnClose} />);
     await waitFor(() => expect(mockGetSettings).toHaveBeenCalled());

     fireEvent.change(screen.getByPlaceholderText('Senha Atual'), { target: { value: 'oldpass' } });
     fireEvent.change(screen.getByPlaceholderText('Nova Senha'), { target: { value: 'newpass' } });
     fireEvent.change(screen.getByPlaceholderText('Confirmar Nova Senha'), { target: { value: 'different' } });

     fireEvent.click(screen.getByText('Atualizar Senha'));

     await waitFor(() => {
         expect(screen.getByText('As novas senhas não conferem.')).toBeInTheDocument();
         expect(mockCheckMasterPassword).not.toHaveBeenCalled();
     });
  });

  it('handles password too short', async () => {
     render(<Settings onClose={mockOnClose} />);
     await waitFor(() => expect(mockGetSettings).toHaveBeenCalled());

     fireEvent.change(screen.getByPlaceholderText('Senha Atual'), { target: { value: 'oldpass' } });
     fireEvent.change(screen.getByPlaceholderText('Nova Senha'), { target: { value: '123' } });
     fireEvent.change(screen.getByPlaceholderText('Confirmar Nova Senha'), { target: { value: '123' } });

     fireEvent.click(screen.getByText('Atualizar Senha'));

     await waitFor(() => {
         expect(screen.getByText('A nova senha deve ter pelo menos 4 caracteres.')).toBeInTheDocument();
         expect(mockCheckMasterPassword).not.toHaveBeenCalled();
     });
  });

  it('handles incorrect current password', async () => {
     render(<Settings onClose={mockOnClose} />);
     await waitFor(() => expect(mockGetSettings).toHaveBeenCalled());

     fireEvent.change(screen.getByPlaceholderText('Senha Atual'), { target: { value: 'wrongpass' } });
     fireEvent.change(screen.getByPlaceholderText('Nova Senha'), { target: { value: 'newpass' } });
     fireEvent.change(screen.getByPlaceholderText('Confirmar Nova Senha'), { target: { value: 'newpass' } });

     mockCheckMasterPassword.mockResolvedValue(false);

     fireEvent.click(screen.getByText('Atualizar Senha'));

     await waitFor(() => {
         expect(mockCheckMasterPassword).toHaveBeenCalledWith('wrongpass');
         expect(screen.getByText('Senha atual incorreta.')).toBeInTheDocument();
         expect(mockSetMasterPassword).not.toHaveBeenCalled();
     });
  });

  it('handles error during password update', async () => {
     render(<Settings onClose={mockOnClose} />);
     await waitFor(() => expect(mockGetSettings).toHaveBeenCalled());

     fireEvent.change(screen.getByPlaceholderText('Senha Atual'), { target: { value: 'oldpass' } });
     fireEvent.change(screen.getByPlaceholderText('Nova Senha'), { target: { value: 'newpass' } });
     fireEvent.change(screen.getByPlaceholderText('Confirmar Nova Senha'), { target: { value: 'newpass' } });

     mockCheckMasterPassword.mockRejectedValue(new Error('Network error'));

     fireEvent.click(screen.getByText('Atualizar Senha'));

     await waitFor(() => {
         expect(screen.getByText('Erro ao alterar senha.')).toBeInTheDocument();
     });
  });

  it('calls onClose when back button is clicked', async () => {
      render(<Settings onClose={mockOnClose} />);
      await waitFor(() => expect(mockGetSettings).toHaveBeenCalled());

      fireEvent.click(screen.getByText('Voltar'));
      expect(mockOnClose).toHaveBeenCalled();
  });
});
