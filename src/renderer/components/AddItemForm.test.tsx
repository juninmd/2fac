import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { ToastProvider } from '@juninmd/sonido';
import AddItemForm from './AddItemForm';
import { COLORS } from '../constants';

// Mock window.electron
const mockScanScreenQR = jest.fn();

beforeAll(() => {
  (window as unknown as { electron: Partial<import("../../renderer/types").ElectronAPI> }).electron = {
    scanScreenQR: mockScanScreenQR,
  };
});

describe('AddItemForm', () => {
  const mockOnAdd = jest.fn();

  const renderForm = (initialUri?: string) => render(
    <ToastProvider>
      <AddItemForm onAdd={mockOnAdd} initialUri={initialUri} />
    </ToastProvider>
  );

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders correctly', () => {
    renderForm();

    expect(screen.getByPlaceholderText('ex: seu_email@gmail.com')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('ex: Google, GitHub')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Cole aqui sua chave secreta')).toBeInTheDocument();
  });

  it('submits form with valid data', async () => {
    renderForm();

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
      renderForm();

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

      renderForm();

      fireEvent.click(screen.getByText('Escanear QR da Tela'));

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

    renderForm();

    fireEvent.click(screen.getByText('Escanear QR da Tela'));

    await waitFor(() => {
        expect(screen.getByText('Scan failed')).toBeInTheDocument();
    });
  });

  it('handles scan QR code failure (exception)', async () => {
    mockScanScreenQR.mockRejectedValueOnce(new Error('Crash'));
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

    renderForm();

    fireEvent.click(screen.getByText('Escanear QR da Tela'));

    await waitFor(() => {
        expect(screen.getByText('Erro ao escanear.')).toBeInTheDocument();
        expect(consoleSpy).toHaveBeenCalledWith(expect.any(Error));
    });
    consoleSpy.mockRestore();
  });

  it('handles scan QR code with valid data but no secret (invalid uri)', async () => {
      // otpauth URI without secret
      mockScanScreenQR.mockResolvedValueOnce({
          success: true,
          data: 'otpauth://totp/Example:alice@google.com'
      });

      renderForm();
      fireEvent.click(screen.getByText('Escanear QR da Tela'));

      await waitFor(() => {
          // OTPAuth rejects a URI without a secret, so the parse lands in the catch.
          expect(screen.getByText('QR Code inválido ou não suportado.')).toBeInTheDocument();
      });
  });

   it('handles scan QR code with invalid uri', async () => {
      mockScanScreenQR.mockResolvedValueOnce({
          success: true,
          data: 'not-a-uri'
      });

      renderForm();
      fireEvent.click(screen.getByText('Escanear QR da Tela'));

      await waitFor(() => {
          expect(screen.getByText('QR Code inválido ou não suportado.')).toBeInTheDocument();
      });
  });

  it('updates algorithm and other selects', () => {
      renderForm();

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
        const { container } = renderForm();

        const grid = container.querySelector('.color-grid');
        fireEvent.click(grid!.children[1]); // Click 2nd color

        fireEvent.change(screen.getByPlaceholderText('ex: seu_email@gmail.com'), { target: { value: 'test@example.com' } });
        fireEvent.change(screen.getByPlaceholderText('ex: Google, GitHub'), { target: { value: 'TestIssuer' } });
        fireEvent.change(screen.getByPlaceholderText('Cole aqui sua chave secreta'), { target: { value: 'SECRET' } });

        fireEvent.click(screen.getByText('+ Adicionar Conta'));

        expect(mockOnAdd).toHaveBeenCalledWith(expect.objectContaining({
            color: COLORS[1]
        }));
    });

    it('handles pasted invalid otpauth URI gracefully', () => {
        const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
        renderForm();

        // valid prefix but invalid content that throws
        const invalidUri = 'otpauth://totp/Invalid%%%';
        fireEvent.change(screen.getByPlaceholderText('Cole aqui sua chave secreta'), { target: { value: invalidUri } });

        expect(consoleSpy).toHaveBeenCalledWith('Failed to parse pasted URI', expect.any(Error));
        consoleSpy.mockRestore();
    });

    it('handles initial invalid otpauth URI gracefully', () => {
        const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
        const invalidUri = 'otpauth://totp/Invalid%%%';

        renderForm(invalidUri);

        expect(consoleSpy).toHaveBeenCalledWith('Failed to parse initial URI', expect.any(Error));
        consoleSpy.mockRestore();
    });

    it('handles valid pasted otpauth URI without secret', () => {
        renderForm();

        // A valid URI syntactically, but missing a secret
        const noSecretUri = 'otpauth://totp/Example:alice@google.com?issuer=Example';
        fireEvent.change(screen.getByPlaceholderText('Cole aqui sua chave secreta'), { target: { value: noSecretUri } });

        // Shouldn't update form data entirely because secret is missing.
        // We check that account name is NOT 'alice@google.com'
        expect(screen.queryByDisplayValue('alice@google.com')).not.toBeInTheDocument();
    });

    it('handles valid initial otpauth URI', () => {
        const validUri = 'otpauth://totp/Example:alice@google.com?secret=JBSWY3DPEHPK3PXP&issuer=Example&algorithm=SHA256&digits=8&period=60';
        renderForm(validUri);

        expect(screen.getByDisplayValue('alice@google.com')).toBeInTheDocument();
        expect(screen.getByDisplayValue('Example')).toBeInTheDocument();
        expect(screen.getByDisplayValue('JBSWY3DPEHPK3PXP')).toBeInTheDocument();
    });

    it('handles valid pasted otpauth URI', () => {
        renderForm();

        const validUri = 'otpauth://totp/Example:alice@google.com?secret=JBSWY3DPEHPK3PXP&issuer=Example&algorithm=SHA256&digits=8&period=60';
        fireEvent.change(screen.getByPlaceholderText('Cole aqui sua chave secreta'), { target: { value: validUri } });

        expect(screen.getByDisplayValue('alice@google.com')).toBeInTheDocument();
        expect(screen.getByDisplayValue('Example')).toBeInTheDocument();
        expect(screen.getByDisplayValue('JBSWY3DPEHPK3PXP')).toBeInTheDocument();
    });
});
