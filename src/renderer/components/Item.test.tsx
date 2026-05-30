import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
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
  useSortable: (args: any) => mockUseSortable(args),
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

  beforeAll(() => {
    // Mock clipboard
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
    render(<Item
      item={mockItem}
      onRemove={mockOnRemove}
      onUpdate={mockOnUpdate}
      onMove={mockOnMove}
      viewMode="grid"
      isFirst={false}
      isLast={false}
      isDragEnabled={false}
    />);

    expect(screen.getByText('Google')).toBeInTheDocument();
    expect(screen.getByText('test@example.com')).toBeInTheDocument();
    expect(screen.getByText('123 456')).toBeInTheDocument();
  });

  it('handles defaults (no color, no issuer)', () => {
      const itemNoColor: TwoFAItem = { ...mockItem, color: undefined, issuer: '' };
      render(<Item
        item={itemNoColor}
        onRemove={mockOnRemove}
        onUpdate={mockOnUpdate}
        onMove={mockOnMove}
        viewMode="grid"
        isFirst={false}
        isLast={false}
        isDragEnabled={false}
      />);

      // Should default to '?' for icon
      expect(screen.getByText('?')).toBeInTheDocument();
  });

  it('renders low time warning (red timer)', () => {
      mockUseToken.mockReturnValue({
        token: '123 456',
        timeLeft: 5, // Low time
        period: 30,
      });

      render(<Item
        item={mockItem}
        onRemove={mockOnRemove}
        onUpdate={mockOnUpdate}
        onMove={mockOnMove}
        viewMode="grid"
        isFirst={false}
        isLast={false}
        isDragEnabled={false}
      />);

      expect(screen.getByText('123 456')).toBeInTheDocument();
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

      const { container } = render(<Item
        item={mockItem}
        onRemove={mockOnRemove}
        onUpdate={mockOnUpdate}
        onMove={mockOnMove}
        viewMode="grid"
        isFirst={false}
        isLast={false}
        isDragEnabled={true}
      />);

      expect(container.firstChild).toHaveClass('dragging');
  });

  it('copies token to clipboard on click', async () => {
    render(<Item
      item={mockItem}
      onRemove={mockOnRemove}
      onUpdate={mockOnUpdate}
      onMove={mockOnMove}
      viewMode="grid"
      isFirst={false}
      isLast={false}
      isDragEnabled={false}
    />);

    fireEvent.click(screen.getByText('123 456'));

    expect(navigator.clipboard.writeText).toHaveBeenCalledWith('123456');
    expect(screen.getByText('Copiado!')).toBeInTheDocument();

    await waitFor(() => {
        expect(screen.queryByText('Copiado!')).not.toBeInTheDocument();
    }, { timeout: 3000 });
  });

  it('enters edit mode and updates item', () => {
    render(<Item
      item={mockItem}
      onRemove={mockOnRemove}
      onUpdate={mockOnUpdate}
      onMove={mockOnMove}
      viewMode="grid"
      isFirst={false}
      isLast={false}
      isDragEnabled={false}
    />);

    fireEvent.click(screen.getByTitle('Editar'));

    expect(screen.getByPlaceholderText('Emissor')).toBeInTheDocument();

    fireEvent.change(screen.getByPlaceholderText('Emissor'), { target: { value: 'Google Updated' } });
    fireEvent.change(screen.getByPlaceholderText('Conta'), { target: { value: 'new@example.com' } });

    fireEvent.click(screen.getByText('Salvar'));

    expect(mockOnUpdate).toHaveBeenCalledWith('1', expect.objectContaining({
        issuer: 'Google Updated',
        account: 'new@example.com'
    }));
  });

  it('cancels edit mode', () => {
    render(<Item
      item={mockItem}
      onRemove={mockOnRemove}
      onUpdate={mockOnUpdate}
      onMove={mockOnMove}
      viewMode="grid"
      isFirst={false}
      isLast={false}
      isDragEnabled={false}
    />);

    fireEvent.click(screen.getByTitle('Editar'));
    fireEvent.click(screen.getByText('Cancelar'));

    expect(screen.queryByPlaceholderText('Emissor')).not.toBeInTheDocument();
    expect(mockOnUpdate).not.toHaveBeenCalled();
  });

  it('handles remove', () => {
      const confirmSpy = jest.spyOn(window, 'confirm').mockReturnValue(true);
      render(<Item
        item={mockItem}
        onRemove={mockOnRemove}
        onUpdate={mockOnUpdate}
        onMove={mockOnMove}
        viewMode="grid"
        isFirst={false}
        isLast={false}
        isDragEnabled={false}
      />);

      fireEvent.click(screen.getByTitle('Remover'));

      expect(confirmSpy).toHaveBeenCalled();
      expect(mockOnRemove).toHaveBeenCalledWith('1');
      confirmSpy.mockRestore();
  });

  it('does not remove if canceled', () => {
      const confirmSpy = jest.spyOn(window, 'confirm').mockReturnValue(false);
      render(<Item
        item={mockItem}
        onRemove={mockOnRemove}
        onUpdate={mockOnUpdate}
        onMove={mockOnMove}
        viewMode="grid"
        isFirst={false}
        isLast={false}
        isDragEnabled={false}
      />);

      fireEvent.click(screen.getByTitle('Remover'));

      expect(mockOnRemove).not.toHaveBeenCalled();
      confirmSpy.mockRestore();
  });

  it('moves item up and down', () => {
      render(<Item
        item={mockItem}
        onRemove={mockOnRemove}
        onUpdate={mockOnUpdate}
        onMove={mockOnMove}
        viewMode="grid"
        isFirst={false} // Should show UP
        isLast={false}  // Should show DOWN
        isDragEnabled={false}
      />);

      fireEvent.click(screen.getByTitle('Mover para Cima'));
      expect(mockOnMove).toHaveBeenCalledWith('1', 'up');

      fireEvent.click(screen.getByTitle('Mover para Baixo'));
      expect(mockOnMove).toHaveBeenCalledWith('1', 'down');
  });

  it('hides move buttons based on position', () => {
      const { rerender } = render(<Item
        item={mockItem}
        onRemove={mockOnRemove}
        onUpdate={mockOnUpdate}
        onMove={mockOnMove}
        viewMode="grid"
        isFirst={true}
        isLast={false}
        isDragEnabled={false}
      />);

      expect(screen.queryByTitle('Mover para Cima')).not.toBeInTheDocument();
      expect(screen.getByTitle('Mover para Baixo')).toBeInTheDocument();

      rerender(<Item
        item={mockItem}
        onRemove={mockOnRemove}
        onUpdate={mockOnUpdate}
        onMove={mockOnMove}
        viewMode="grid"
        isFirst={false}
        isLast={true}
        isDragEnabled={false}
      />);

      expect(screen.getByTitle('Mover para Cima')).toBeInTheDocument();
      expect(screen.queryByTitle('Mover para Baixo')).not.toBeInTheDocument();
  });

    it('changes color in edit mode', () => {
        const { container } = render(<Item
            item={mockItem}
            onRemove={mockOnRemove}
            onUpdate={mockOnUpdate}
            onMove={mockOnMove}
            viewMode="grid"
            isFirst={false}
            isLast={false}
            isDragEnabled={false}
        />);

        fireEvent.click(screen.getByTitle('Editar'));

        const colorLabel = screen.getByText('Cor');
        const grid = colorLabel.nextElementSibling;
        const colorDivs = grid?.children;
        fireEvent.click(colorDivs![1]); // Click 2nd color

        fireEvent.click(screen.getByText('Salvar'));

        expect(mockOnUpdate).toHaveBeenCalledWith('1', expect.objectContaining({
            color: expect.any(String)
        }));
    });

    it('renders in list view', () => {
        const { container } = render(<Item
            item={mockItem}
            onRemove={mockOnRemove}
            onUpdate={mockOnUpdate}
            onMove={mockOnMove}
            viewMode="list"
            isFirst={false}
            isLast={false}
            isDragEnabled={false}
        />);

        expect(container.firstChild).toHaveClass('list-item');
    });
});
