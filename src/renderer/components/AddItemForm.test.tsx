import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import AddItemForm from './AddItemForm';
import { COLORS } from '../constants';

// Mock window.electron
const mockScanScreenQR = jest.fn();

beforeAll(() => {
  (window as any).electron = {
    scanScreenQR: mockScanScreenQR,
  };
});

describe('AddItemForm', () => {
  const mockOnAdd = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders correctly', () => {
    render(<AddItemForm onAdd={mockOnAdd} />);

    expect(screen.getByPlaceholderText('ex: seu_email@gmail.com')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('ex: Google, GitHub')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Cole aqui sua chave secreta')).toBeInTheDocument();
  });

  it('submits form with valid data', async () => {
    render(<AddItemForm onAdd={mockOnAdd} />);

    fireEvent.change(screen.getByPlaceholderText('ex: seu_email@gmail.com'), { target: { value: 'test@example.com' } });
    fireEvent.change(screen.getByPlaceholderText('ex: Google, GitHub'), { target: { value: 'Google' } });
    fireEvent.change(screen.getByPlaceholderText('Cole aqui sua chave secreta'), { target: { value: 'SECRET' } });

    fireEvent.click(screen.getByText('+ Adicionar Conta'));

    await waitFor(() => {
      expect(mockOnAdd).toHaveBeenCalledWith(expect.objectContaining({
        account: 'test@example.com',
        issuer: 'Google',
        secret: 'SECRET'
      }));
    });
  });

  it('handles validation errors and clears them', () => {
      render(<AddItemForm onAdd={mockOnAdd} />);

      fireEvent.click(screen.getByText('+ Adicionar Conta'));

      expect(screen.getByText('Nome da conta é obrigatório')).toBeInTheDocument();
      expect(screen.getByText('Emissor é obrigatório')).toBeInTheDocument();
      expect(screen.getByText('Chave secreta é obrigatória')).toBeInTheDocument();

      expect(mockOnAdd).not.toHaveBeenCalled();

      // Clear error by typing
      fireEvent.change(screen.getByPlaceholderText('ex: seu_email@gmail.com'), { target: { value: 'a' } });
      expect(screen.queryByText('Nome da conta é obrigatório')).not.toBeInTheDocument();
  });

  it('handles scan QR code success', async () => {
      // Mock scanScreen to return a success result
      mockScanScreenQR.mockResolvedValueOnce({
          success: true,
          data: 'otpauth://totp/Example:alice@google.com?secret=JBSWY3DPEHPK3PXP&issuer=Example'
      });

      render(<AddItemForm onAdd={mockOnAdd} />);

      fireEvent.click(screen.getByText('📷 Escanear QR da Tela'));

      expect(screen.getByText('Procurando QR Code...')).toBeInTheDocument();

      // Wait for the scan to "complete" and populate fields
      await waitFor(() => {
          expect(screen.getByDisplayValue('alice@google.com')).toBeInTheDocument();
          expect(screen.getByDisplayValue('Example')).toBeInTheDocument();
          expect(screen.getByDisplayValue('JBSWY3DPEHPK3PXP')).toBeInTheDocument();
      });
  });

  it('handles scan QR code failure (error from electron)', async () => {
    mockScanScreenQR.mockResolvedValueOnce({ success: false, error: 'Scan failed' });
    const alertSpy = jest.spyOn(window, 'alert').mockImplementation(() => {});

    render(<AddItemForm onAdd={mockOnAdd} />);

    fireEvent.click(screen.getByText('📷 Escanear QR da Tela'));

    await waitFor(() => {
        expect(alertSpy).toHaveBeenCalledWith('Scan failed');
    });
    alertSpy.mockRestore();
  });

  it('handles scan QR code failure (exception)', async () => {
    mockScanScreenQR.mockRejectedValueOnce(new Error('Crash'));
    const alertSpy = jest.spyOn(window, 'alert').mockImplementation(() => {});
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

    render(<AddItemForm onAdd={mockOnAdd} />);

    fireEvent.click(screen.getByText('📷 Escanear QR da Tela'));

    await waitFor(() => {
        expect(alertSpy).toHaveBeenCalledWith('Erro ao escanear.');
        expect(consoleSpy).toHaveBeenCalledWith(expect.any(Error));
    });
    alertSpy.mockRestore();
    consoleSpy.mockRestore();
  });

  it('handles scan QR code with valid data but no secret (invalid uri)', async () => {
      // otpauth URI without secret
      mockScanScreenQR.mockResolvedValueOnce({
          success: true,
          data: 'otpauth://totp/Example:alice@google.com'
      });
      const alertSpy = jest.spyOn(window, 'alert').mockImplementation(() => {});

      render(<AddItemForm onAdd={mockOnAdd} />);
      fireEvent.click(screen.getByText('📷 Escanear QR da Tela'));

      await waitFor(() => {
          expect(alertSpy).toHaveBeenCalled();
      });
      alertSpy.mockRestore();
  });

   it('handles scan QR code with invalid uri', async () => {
      mockScanScreenQR.mockResolvedValueOnce({
          success: true,
          data: 'not-a-uri'
      });
      const alertSpy = jest.spyOn(window, 'alert').mockImplementation(() => {});

      render(<AddItemForm onAdd={mockOnAdd} />);
      fireEvent.click(screen.getByText('📷 Escanear QR da Tela'));

      await waitFor(() => {
          expect(alertSpy).toHaveBeenCalled();
      });
      alertSpy.mockRestore();
  });

  it('updates algorithm and other selects', () => {
      render(<AddItemForm onAdd={mockOnAdd} />);

      fireEvent.change(screen.getByLabelText('Algoritmo'), { target: { value: 'SHA256' } });
      fireEvent.change(screen.getByLabelText('Dígitos'), { target: { value: '8' } });

      fireEvent.change(screen.getByPlaceholderText('ex: seu_email@gmail.com'), { target: { value: 'test@example.com' } });
      fireEvent.change(screen.getByPlaceholderText('ex: Google, GitHub'), { target: { value: 'Google' } });
      fireEvent.change(screen.getByPlaceholderText('Cole aqui sua chave secreta'), { target: { value: 'SECRET' } });

      fireEvent.click(screen.getByText('+ Adicionar Conta'));

      expect(mockOnAdd).toHaveBeenCalledWith(expect.objectContaining({
          algorithm: 'SHA256',
          digits: 8
      }));
  });

    it('changes color', () => {
        const { container } = render(<AddItemForm onAdd={mockOnAdd} />);

        const grid = container.querySelector('div[style*="grid-template-columns"]');
        const colorDivs = grid?.children;
        fireEvent.click(colorDivs![1]); // Click 2nd color

        fireEvent.change(screen.getByPlaceholderText('ex: seu_email@gmail.com'), { target: { value: 'test@example.com' } });
        fireEvent.change(screen.getByPlaceholderText('ex: Google, GitHub'), { target: { value: 'Google' } });
        fireEvent.change(screen.getByPlaceholderText('Cole aqui sua chave secreta'), { target: { value: 'SECRET' } });

        fireEvent.click(screen.getByText('+ Adicionar Conta'));

        expect(mockOnAdd).toHaveBeenCalledWith(expect.objectContaining({
            color: COLORS[1]
        }));
    });
});
