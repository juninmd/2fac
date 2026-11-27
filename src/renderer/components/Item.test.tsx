import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { ToastProvider } from '@juninmd/sonido';
import Item from './Item';
import { TwoFAItem } from '../types';

// Mock useToken hook
const mockUseToken = jest.fn();
jest.mock('../hooks/useToken', () => ({
  useToken: (item: TwoFAItem) => mockUseToken(item),
}));

// Mock dnd-kit
const mockUseSortable = jest.fn();
jest.mock('@dnd-kit/sortable', () => ({
  useSortable: (args: unknown) => mockUseSortable(args),
}));

jest.mock('@dnd-kit/utilities', () => ({
  CSS: {
    Transform: {
      toString: jest.fn(),
    }
  }
}));

describe('Item', () => {
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

  const mockOnRemove = jest.fn();
  const mockOnUpdate = jest.fn();
  const mockOnMove = jest.fn();

  type ItemProps = React.ComponentProps<typeof Item>;
  const baseProps: ItemProps = {
    item: mockItem,
    onRemove: mockOnRemove,
    onUpdate: mockOnUpdate,
    onMove: mockOnMove,
    viewMode: 'grid',
    isFirst: false,
    isLast: false,
    isDragEnabled: false,
    maskSecrets: false,
  };

  const renderItem = (overrides: Partial<ItemProps> = {}) => render(
    <ToastProvider>
      <Item {...baseProps} {...overrides} />
    </ToastProvider>
  );

  beforeAll(() => {
    // Mock clipboard
    Object.assign(navigator, {
      clipboard: {
        writeText: jest.fn().mockResolvedValue(undefined),
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

    mockUseSortable.mockReturnValue({
        attributes: {},
        listeners: {},
        setNodeRef: jest.fn(),
        transform: null,
        transition: null,
        isDragging: false,
    });
  });

  it('renders correctly', () => {
    renderItem();

    expect(screen.getByText('Google')).toBeInTheDocument();
    expect(screen.getByText('test@example.com')).toBeInTheDocument();
    expect(screen.getByLabelText('123 456')).toBeInTheDocument();
  });

  it('handles defaults (no color, no issuer)', () => {
      renderItem({ item: { ...mockItem, color: undefined, issuer: '' } });

      // Should default to '?' for icon
      expect(screen.getByText('?')).toBeInTheDocument();
  });

  it('renders low time warning (danger ring)', () => {
      mockUseToken.mockReturnValue({
        token: '123 456',
        timeLeft: 5, // Low time
        period: 30,
      });

      const { container } = renderItem();

      expect(screen.getByLabelText('123 456')).toBeInTheDocument();
      expect(container.querySelector('.token-ring--low')).toBeInTheDocument();
  });

  it('renders dragging state', () => {
      mockUseSortable.mockReturnValue({
        attributes: {},
        listeners: {},
        setNodeRef: jest.fn(),
        transform: null,
        transition: null,
        isDragging: true,
      });

      const { container } = renderItem({ isDragEnabled: true });

      expect(container.firstChild).toHaveClass('dragging');
  });

  it('swatches de cor são botões acessíveis por teclado', () => {
    renderItem();

    fireEvent.click(screen.getByLabelText('Editar test@example.com'));
    const swatches = screen.getAllByLabelText(/^Cor #/);
    expect(swatches.length).toBeGreaterThan(1);
    fireEvent.click(swatches[1]);
    expect(swatches[1]).toHaveAttribute('aria-pressed', 'true');
  });

  it('código mascarado pode ser revelado', () => {
    renderItem({ maskSecrets: true });

    fireEvent.click(screen.getByRole('button', { name: 'Mostrar código' }));
    expect(screen.getByLabelText('123 456')).toBeInTheDocument();
  });

  it('does not copy or confirm when the token is ERROR', () => {
    mockUseToken.mockReturnValue({ token: 'ERROR', timeLeft: 15, period: 30 });
    renderItem();

    fireEvent.click(screen.getByLabelText('ERROR'));

    expect(navigator.clipboard.writeText).not.toHaveBeenCalled();
    expect(screen.queryByText('Copiado!')).not.toBeInTheDocument();
  });

  it('copies token to clipboard on click', async () => {
    renderItem();

    fireEvent.click(screen.getByLabelText('123 456'));

    expect(navigator.clipboard.writeText).toHaveBeenCalledWith('123456');
    expect(await screen.findByText('Copiado!')).toBeInTheDocument();
  });

  it('enters edit mode and updates item', () => {
    renderItem();

    fireEvent.click(screen.getByLabelText('Editar test@example.com'));

    fireEvent.change(screen.getByLabelText('Emissor'), { target: { value: 'Google Updated' } });
    fireEvent.change(screen.getByLabelText('Conta'), { target: { value: 'new@example.com' } });

    fireEvent.click(screen.getByText('Salvar'));

    expect(mockOnUpdate).toHaveBeenCalledWith('1', expect.objectContaining({
        issuer: 'Google Updated',
        account: 'new@example.com'
    }));
  });

  it('cancels edit mode', () => {
    renderItem();

    fireEvent.click(screen.getByLabelText('Editar test@example.com'));
    fireEvent.click(screen.getByText('Cancelar'));

    expect(screen.queryByLabelText('Emissor')).not.toBeInTheDocument();
    expect(mockOnUpdate).not.toHaveBeenCalled();
  });

  it('handles remove', () => {
      renderItem();

      fireEvent.click(screen.getByLabelText('Remover test@example.com'));
      fireEvent.click(screen.getByText('Remover'));

      expect(mockOnRemove).toHaveBeenCalledWith('1');
  });

  it('does not remove if canceled', () => {
      renderItem();

      fireEvent.click(screen.getByLabelText('Remover test@example.com'));
      fireEvent.click(screen.getByText('Cancelar'));

      expect(mockOnRemove).not.toHaveBeenCalled();
  });

  it('moves item up and down', () => {
      renderItem();

      fireEvent.click(screen.getByLabelText('Mover para cima'));
      expect(mockOnMove).toHaveBeenCalledWith('1', 'up');

      fireEvent.click(screen.getByLabelText('Mover para baixo'));
      expect(mockOnMove).toHaveBeenCalledWith('1', 'down');
  });

  it('hides move buttons based on position', () => {
      const { rerender } = render(
        <ToastProvider>
          <Item {...baseProps} isFirst isLast={false} />
        </ToastProvider>
      );

      expect(screen.queryByLabelText('Mover para cima')).not.toBeInTheDocument();
      expect(screen.getByLabelText('Mover para baixo')).toBeInTheDocument();

      rerender(
        <ToastProvider>
          <Item {...baseProps} isFirst={false} isLast />
        </ToastProvider>
      );

      expect(screen.getByLabelText('Mover para cima')).toBeInTheDocument();
      expect(screen.queryByLabelText('Mover para baixo')).not.toBeInTheDocument();
  });

  it('changes color in edit mode', () => {
      const { container } = renderItem();

      fireEvent.click(screen.getByLabelText('Editar test@example.com'));

      const grid = container.querySelector('.color-grid');
      fireEvent.click(grid!.children[1]); // Click 2nd color

      fireEvent.click(screen.getByText('Salvar'));

      expect(mockOnUpdate).toHaveBeenCalledWith('1', expect.objectContaining({
          color: expect.any(String)
      }));
  });

  it('renders in list view', () => {
      const { container } = renderItem({ viewMode: 'list' });

      expect(container.firstChild).toHaveClass('list-item');
  });

  it('masks and unmasks secrets based on maskSecrets prop', () => {
      const { rerender } = render(
        <ToastProvider>
          <Item {...baseProps} maskSecrets />
        </ToastProvider>
      );

      // By default should be masked (6 digits = ••• •••)
      expect(screen.getByText('••• •••')).toBeInTheDocument();

      // Click to unmask
      fireEvent.click(screen.getByText('••• •••'));
      expect(screen.getByLabelText('123 456')).toBeInTheDocument();

      // Re-render with maskSecrets false
      rerender(
        <ToastProvider>
          <Item {...baseProps} maskSecrets={false} />
        </ToastProvider>
      );
      expect(screen.getByLabelText('123 456')).toBeInTheDocument();
  });
});
