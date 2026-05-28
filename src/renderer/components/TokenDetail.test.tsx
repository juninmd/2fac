import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import TokenDetail from './TokenDetail.js';
import { TwoFAItem } from '../types.js';

// Mock useToken
const mockUseToken = jest.fn();
jest.mock('../hooks/useToken', () => ({
  useToken: (item: any) => mockUseToken(item),
}));

describe('TokenDetail', () => {
  const mockItem: TwoFAItem = {
    id: '1',
    account: 'test@example.com',
    issuer: 'Google',
    secret: 'SECRET',
    algorithm: 'SHA1',
    digits: 6,
    period: 30,
    color: '#ff0000',
  };

  const mockOnUpdate = jest.fn();
  const mockOnRemove = jest.fn();

  beforeAll(() => {
    Object.assign(navigator, {
      clipboard: {
        writeText: jest.fn(),
      },
    });
  });

  beforeEach(() => {
    jest.clearAllMocks();
    mockUseToken.mockReturnValue({
        token: '123 456',
        timeLeft: 15,
        period: 30,
    });
  });

  it('renders details', () => {
    render(<TokenDetail item={mockItem} onUpdate={mockOnUpdate} onRemove={mockOnRemove} />);

    expect(screen.getByText('Google')).toBeInTheDocument();
    expect(screen.getByText('test@example.com')).toBeInTheDocument();
    expect(screen.getByText('123 456')).toBeInTheDocument();
    expect(screen.getByText('15s')).toBeInTheDocument();
  });

  it('copies token to clipboard', async () => {
    render(<TokenDetail item={mockItem} onUpdate={mockOnUpdate} onRemove={mockOnRemove} />);

    fireEvent.click(screen.getByText('123 456'));

    expect(navigator.clipboard.writeText).toHaveBeenCalledWith('123456');
    expect(screen.getByText('Copiado!')).toBeInTheDocument();

    await waitFor(() => {
        expect(screen.queryByText('Copiado!')).not.toBeInTheDocument();
    }, { timeout: 3000 });
  });

  it('enters edit mode and updates issuer and account', () => {
    render(<TokenDetail item={mockItem} onUpdate={mockOnUpdate} onRemove={mockOnRemove} />);

    fireEvent.click(screen.getByText('✎ Editar'));

    expect(screen.getByText('Editar Conta')).toBeInTheDocument();

    // Update Issuer
    fireEvent.change(screen.getByDisplayValue('Google'), { target: { value: 'Google Updated' } });

    // Update Account (cover line 70)
    fireEvent.change(screen.getByDisplayValue('test@example.com'), { target: { value: 'new@example.com' } });

    fireEvent.click(screen.getByText('Salvar Alterações'));

    expect(mockOnUpdate).toHaveBeenCalledWith('1', expect.objectContaining({
        issuer: 'Google Updated',
        account: 'new@example.com'
    }));
  });

  it('cancels edit mode', () => {
    render(<TokenDetail item={mockItem} onUpdate={mockOnUpdate} onRemove={mockOnRemove} />);

    fireEvent.click(screen.getByText('✎ Editar'));
    fireEvent.click(screen.getByText('Cancelar'));

    expect(screen.queryByText('Editar Conta')).not.toBeInTheDocument();
    expect(mockOnUpdate).not.toHaveBeenCalled();
  });

  it('handles delete', () => {
      const confirmSpy = jest.spyOn(window, 'confirm').mockReturnValue(true);
      render(<TokenDetail item={mockItem} onUpdate={mockOnUpdate} onRemove={mockOnRemove} />);

      fireEvent.click(screen.getByText('✕ Remover'));

      expect(confirmSpy).toHaveBeenCalled();
      expect(mockOnRemove).toHaveBeenCalledWith('1');
      confirmSpy.mockRestore();
  });

  it('cancels delete', () => {
      const confirmSpy = jest.spyOn(window, 'confirm').mockReturnValue(false);
      render(<TokenDetail item={mockItem} onUpdate={mockOnUpdate} onRemove={mockOnRemove} />);

      fireEvent.click(screen.getByText('✕ Remover'));

      expect(mockOnRemove).not.toHaveBeenCalled();
      confirmSpy.mockRestore();
  });

  it('updates state when item prop changes', () => {
      const { rerender } = render(<TokenDetail item={mockItem} onUpdate={mockOnUpdate} onRemove={mockOnRemove} />);

      const newItem = { ...mockItem, issuer: 'New Issuer' };
      rerender(<TokenDetail item={newItem} onUpdate={mockOnUpdate} onRemove={mockOnRemove} />);

      expect(screen.getByText('New Issuer')).toBeInTheDocument();

      // Also check if edit form state updated by entering edit mode
      fireEvent.click(screen.getByText('✎ Editar'));
      expect(screen.getByDisplayValue('New Issuer')).toBeInTheDocument();
  });

  it('renders low time state', () => {
      mockUseToken.mockReturnValue({
          token: '123 456',
          timeLeft: 5,
          period: 30
      });
      render(<TokenDetail item={mockItem} onUpdate={mockOnUpdate} onRemove={mockOnRemove} />);

      expect(screen.getByText('5s')).toBeInTheDocument();
  });

  it('renders default icon/color if missing', () => {
      const itemNoColor = { ...mockItem, color: undefined, issuer: '' };
      render(<TokenDetail item={itemNoColor} onUpdate={mockOnUpdate} onRemove={mockOnRemove} />);

      expect(screen.getByText('?')).toBeInTheDocument();
  });

  it('changes color in edit mode', () => {
        render(<TokenDetail item={mockItem} onUpdate={mockOnUpdate} onRemove={mockOnRemove} />);

        fireEvent.click(screen.getByText('✎ Editar'));

        const colorLabel = screen.getByText('Cor');
        const grid = colorLabel.nextElementSibling;
        const colorDivs = grid?.children;
        fireEvent.click(colorDivs![1]); // Click 2nd color

        fireEvent.click(screen.getByText('Salvar Alterações'));

        expect(mockOnUpdate).toHaveBeenCalledWith('1', expect.objectContaining({
            color: expect.any(String)
        }));
    });

    it('copies token on Ctrl+C', () => {
        render(<TokenDetail item={mockItem} onUpdate={mockOnUpdate} onRemove={mockOnRemove} />);

        fireEvent.keyDown(window, { key: 'c', ctrlKey: true });

        expect(navigator.clipboard.writeText).toHaveBeenCalledWith('123456');
        expect(screen.getByText('Copiado!')).toBeInTheDocument();
    });

    it('does not copy on Ctrl+C if editing', () => {
        render(<TokenDetail item={mockItem} onUpdate={mockOnUpdate} onRemove={mockOnRemove} />);

        // Enter edit mode
        fireEvent.click(screen.getByText('✎ Editar'));

        // Clear mocks
        (navigator.clipboard.writeText as jest.Mock).mockClear();

        fireEvent.keyDown(window, { key: 'c', ctrlKey: true });

        expect(navigator.clipboard.writeText).not.toHaveBeenCalled();
    });
});
