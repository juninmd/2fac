import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import LockScreen from './LockScreen';

// Mock window.electron
const mockHasMasterPassword = jest.fn();
const mockCheckMasterPassword = jest.fn();
const mockSetMasterPassword = jest.fn();

beforeAll(() => {
  (window as any).electron = {
    hasMasterPassword: mockHasMasterPassword,
    checkMasterPassword: mockCheckMasterPassword,
    setMasterPassword: mockSetMasterPassword,
  };
});

describe('LockScreen', () => {
  const mockOnUnlock = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders unlock screen if password exists', async () => {
    mockHasMasterPassword.mockResolvedValue(true);

    render(<LockScreen onUnlock={mockOnUnlock} />);

    expect(screen.getByText('Carregando...')).toBeInTheDocument();

    await waitFor(() => {
        expect(screen.getByText('Desbloquear 2FAC')).toBeInTheDocument();
        expect(screen.queryByPlaceholderText('Confirmar Senha')).not.toBeInTheDocument();
    });
  });

  it('renders setup screen if password does not exist', async () => {
    mockHasMasterPassword.mockResolvedValue(false);

    render(<LockScreen onUnlock={mockOnUnlock} />);

    await waitFor(() => {
        expect(screen.getByText('Configurar Senha Mestre')).toBeInTheDocument();
        expect(screen.getByPlaceholderText('Confirmar Senha')).toBeInTheDocument();
    });
  });

  it('unlocks with correct password', async () => {
    mockHasMasterPassword.mockResolvedValue(true);
    mockCheckMasterPassword.mockResolvedValue(true);

    render(<LockScreen onUnlock={mockOnUnlock} />);
    await waitFor(() => expect(screen.getByText('Desbloquear 2FAC')).toBeInTheDocument());

    fireEvent.change(screen.getByPlaceholderText('Senha'), { target: { value: 'password' } });
    fireEvent.click(screen.getByText('Desbloquear'));

    await waitFor(() => {
        expect(mockCheckMasterPassword).toHaveBeenCalledWith('password');
        expect(mockOnUnlock).toHaveBeenCalled();
    });
  });

  it('shows error with incorrect password', async () => {
    mockHasMasterPassword.mockResolvedValue(true);
    mockCheckMasterPassword.mockResolvedValue(false);

    render(<LockScreen onUnlock={mockOnUnlock} />);
    await waitFor(() => expect(screen.getByText('Desbloquear 2FAC')).toBeInTheDocument());

    fireEvent.change(screen.getByPlaceholderText('Senha'), { target: { value: 'wrong' } });
    fireEvent.click(screen.getByText('Desbloquear'));

    await waitFor(() => {
        expect(screen.getByText('Senha incorreta')).toBeInTheDocument();
        expect(mockOnUnlock).not.toHaveBeenCalled();
    });
  });

  it('sets up password correctly', async () => {
    mockHasMasterPassword.mockResolvedValue(false);
    mockSetMasterPassword.mockResolvedValue(true);

    render(<LockScreen onUnlock={mockOnUnlock} />);
    await waitFor(() => expect(screen.getByText('Configurar Senha Mestre')).toBeInTheDocument());

    fireEvent.change(screen.getByPlaceholderText('Senha'), { target: { value: 'newpass' } });
    fireEvent.change(screen.getByPlaceholderText('Confirmar Senha'), { target: { value: 'newpass' } });
    fireEvent.click(screen.getByText('Criar Senha'));

    await waitFor(() => {
        expect(mockSetMasterPassword).toHaveBeenCalledWith('newpass');
        expect(mockOnUnlock).toHaveBeenCalled();
    });
  });

  it('shows error if setup passwords do not match', async () => {
    mockHasMasterPassword.mockResolvedValue(false);

    render(<LockScreen onUnlock={mockOnUnlock} />);
    await waitFor(() => expect(screen.getByText('Configurar Senha Mestre')).toBeInTheDocument());

    fireEvent.change(screen.getByPlaceholderText('Senha'), { target: { value: 'pass1' } });
    fireEvent.change(screen.getByPlaceholderText('Confirmar Senha'), { target: { value: 'pass2' } });
    fireEvent.click(screen.getByText('Criar Senha'));

    await waitFor(() => {
        expect(screen.getByText('As senhas não conferem')).toBeInTheDocument();
        expect(mockSetMasterPassword).not.toHaveBeenCalled();
    });
  });

  it('shows error if setup password is too short', async () => {
    mockHasMasterPassword.mockResolvedValue(false);

    render(<LockScreen onUnlock={mockOnUnlock} />);
    await waitFor(() => expect(screen.getByText('Configurar Senha Mestre')).toBeInTheDocument());

    fireEvent.change(screen.getByPlaceholderText('Senha'), { target: { value: '123' } });
    fireEvent.change(screen.getByPlaceholderText('Confirmar Senha'), { target: { value: '123' } });
    fireEvent.click(screen.getByText('Criar Senha'));

    await waitFor(() => {
        expect(screen.getByText('A senha deve ter pelo menos 4 caracteres')).toBeInTheDocument();
        expect(mockSetMasterPassword).not.toHaveBeenCalled();
    });
  });
});
