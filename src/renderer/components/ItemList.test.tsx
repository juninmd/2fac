import React from 'react';
import { render, screen } from '@testing-library/react';
import ItemList from './ItemList';
import { TwoFAItem } from '../types';

// Mock dependencies
jest.mock('./Item', () => {
  import React from 'react';
  return {
    __esModule: true,
    default: (props: any) => React.createElement('div', {
        'data-testid': `item-${props.item.id}`,
    }, props.item.account)
  };
});

jest.mock('@dnd-kit/sortable', () => {
    import React from 'react';
    return {
        SortableContext: ({ children }: any) => React.createElement('div', { 'data-testid': 'sortable-context' }, children),
        rectSortingStrategy: {},
        verticalListSortingStrategy: {},
    };
});

describe('ItemList', () => {
  const mockItems: TwoFAItem[] = [
    { id: '1', account: 'Account 1', issuer: 'Issuer 1', secret: 'S1', algorithm: 'SHA1', digits: 6, period: 30, color: 'red' },
    { id: '2', account: 'Account 2', issuer: 'Issuer 2', secret: 'S2', algorithm: 'SHA1', digits: 6, period: 30, color: 'blue' },
  ];

  const mockOnRemove = jest.fn();
  const mockOnUpdate = jest.fn();
  const mockOnMove = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders list of items', () => {
    render(<ItemList
        items={mockItems}
        viewMode="grid"
        onRemove={mockOnRemove}
        onUpdate={mockOnUpdate}
        onMove={mockOnMove}
        isDragEnabled={true}
    />);

    expect(screen.getByTestId('sortable-context')).toBeInTheDocument();
    expect(screen.getByTestId('item-1')).toBeInTheDocument();
    expect(screen.getByTestId('item-2')).toBeInTheDocument();
  });

  it('renders correctly in list mode', () => {
    const { container } = render(<ItemList
        items={mockItems}
        viewMode="list"
        onRemove={mockOnRemove}
        onUpdate={mockOnUpdate}
        onMove={mockOnMove}
        isDragEnabled={true}
    />);

    expect(container.firstChild).toHaveClass('item-list list-mode');
  });

  it('renders correctly in grid mode', () => {
    const { container } = render(<ItemList
        items={mockItems}
        viewMode="grid"
        onRemove={mockOnRemove}
        onUpdate={mockOnUpdate}
        onMove={mockOnMove}
        isDragEnabled={true}
    />);

    expect(container.firstChild).toHaveClass('item-list grid-mode');
  });
});
