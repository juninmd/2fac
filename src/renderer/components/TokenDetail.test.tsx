import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { ToastProvider } from '@juninmd/sonido';
import TokenDetail from './TokenDetail';
import { TwoFAItem } from '../types';

// Mock useToken
const mockUseToken = jest.fn();
jest.mock('../hooks/useToken', () => ({
  useToken: (item: TwoFAItem) => mockUseToken(item),
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

  type DetailProps = React.ComponentProps<typeof TokenDetail>;
  const baseProps: DetailProps = {
    item: mockItem,
    onUpdate: mockOnUpdate,
    onRemove: mockOnRemove,
    maskSecrets: false,
  };

  const renderDetail = (overrides: Partial<DetailProps> = {}) => render(
    <ToastProvider>
      <TokenDetail {...baseProps} {...overrides} />
    </ToastProvider>
  );

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
    renderDetail();

    expect(screen.getByText('Google')).toBeInTheDocument();
    expect(screen.getByText('test@example.com')).toBeInTheDocument();
    expect(screen.getByLabelText('123 456')).toBeInTheDocument();
    expect(screen.getByText('15s')).toBeInTheDocument();
  });

  it('copies token to clipboard', async () => {
    renderDetail();

    fireEvent.click(screen.getByLabelText('123 456'));

    expect(navigator.clipboard.writeText).toHaveBeenCalledWith('123456');
    expect(await screen.findByText('Copiado!')).toBeInTheDocument();
  });

  it('enters edit mode and updates issuer and account', () => {
    renderDetail();

    fireEvent.click(screen.getByText('Editar'));

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
    renderDetail();

    fireEvent.click(screen.getByText('Editar'));
    fireEvent.click(screen.getByText('Cancelar'));

    expect(screen.queryByText('Editar Conta')).not.toBeInTheDocument();
    expect(mockOnUpdate).not.toHaveBeenCalled();
  });

  it('handles delete', () => {
      renderDetail();

      fireEvent.click(screen.getByLabelText('Remover test@example.com'));
      fireEvent.click(screen.getByText('Remover'));

      expect(mockOnRemove).toHaveBeenCalledWith('1');
  });

  it('cancels delete', () => {
      renderDetail();

      fireEvent.click(screen.getByLabelText('Remover test@example.com'));
      fireEvent.click(screen.getByText('Cancelar'));

      expect(mockOnRemove).not.toHaveBeenCalled();
  });

  it('updates state when item prop changes', () => {
      const { rerender } = renderDetail();

      const newItem = { ...mockItem, issuer: 'New Issuer' };
      rerender(
        <ToastProvider>
          <TokenDetail {...baseProps} item={newItem} />
        </ToastProvider>
      );

      expect(screen.getByText('New Issuer')).toBeInTheDocument();

      // Also check if edit form state updated by entering edit mode
      fireEvent.click(screen.getByText('Editar'));
      expect(screen.getByDisplayValue('New Issuer')).toBeInTheDocument();
  });

  it('renders low time state', () => {
      mockUseToken.mockReturnValue({
          token: '123 456',
          timeLeft: 5,
          period: 30
      });
      const { container } = renderDetail();

      expect(screen.getByText('5s')).toBeInTheDocument();
      expect(container.querySelector('.token-ring--low')).toBeInTheDocument();
  });

  it('renders default icon/color if missing', () => {
      renderDetail({ item: { ...mockItem, color: undefined, issuer: '' } });

      expect(screen.getByText('?')).toBeInTheDocument();
  });

  it('changes color in edit mode', () => {
        const { container } = renderDetail();

        fireEvent.click(screen.getByText('Editar'));

        const grid = container.querySelector('.color-grid');
        fireEvent.click(grid!.children[1]); // Click 2nd color

        fireEvent.click(screen.getByText('Salvar Alterações'));

        expect(mockOnUpdate).toHaveBeenCalledWith('1', expect.objectContaining({
            color: expect.any(String)
        }));
    });

    it('copies token on Ctrl+C', () => {
        renderDetail();

        fireEvent.keyDown(window, { key: 'c', ctrlKey: true });

        expect(navigator.clipboard.writeText).toHaveBeenCalledWith('123456');
        expect(screen.getByText('Copiado!')).toBeInTheDocument();
    });

    it('does not copy on Ctrl+C if editing', () => {
        renderDetail();

        // Enter edit mode
        fireEvent.click(screen.getByText('Editar'));

        // Clear mocks
        (navigator.clipboard.writeText as jest.Mock).mockClear();

        fireEvent.keyDown(window, { key: 'c', ctrlKey: true });

        expect(navigator.clipboard.writeText).not.toHaveBeenCalled();
    });
});

describe('TokenDetail', () => {
    const mockItem = {
        id: '1',
        account: 'test@test.com',
        issuer: 'Test',
        secret: 'JBSWY3DPEHPK3PXP',
    };
    const mockOnRemove = jest.fn();
    const mockOnUpdate = jest.fn();
    it('masks and unmasks secrets based on maskSecrets prop', () => {
        const props = { item: mockItem, onUpdate: mockOnUpdate, onRemove: mockOnRemove };
        const { rerender } = render(
          <ToastProvider>
            <TokenDetail {...props} maskSecrets />
          </ToastProvider>
        );

        // By default should be masked
        expect(screen.getByText('••• •••')).toBeInTheDocument();

        // Click to unmask
        fireEvent.click(screen.getByText('••• •••'));
        expect(screen.getByLabelText('123 456')).toBeInTheDocument();

        // Re-render with maskSecrets false
        rerender(
          <ToastProvider>
            <TokenDetail {...props} maskSecrets={false} />
          </ToastProvider>
        );

        expect(screen.getByLabelText('123 456')).toBeInTheDocument();
    });
});
