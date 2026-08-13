import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import SidebarList from './SidebarList';
import { TwoFAItem } from '../types';

// Mock dnd-kit
const mockUseSortable = jest.fn();
jest.mock('@dnd-kit/sortable', () => ({
  useSortable: (args: { 
      id: string | number; 
      items: unknown[];
      collisionDetection: unknown;
      collisionDetectionArgs?: unknown;
      data: unknown;
      measurementStrategy?: unknown;
      sortingStrategy?: unknown;
      freezeDrag?: boolean; 
  }) => mockUseSortable(args),
  SortableContext: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  verticalListSortingStrategy: {},
}));

jest.mock('@dnd-kit/utilities', () => ({
  CSS: {
    Transform: {
      toString: jest.fn(),
    }
  }
}));

describe('SidebarList', () => {
  const mockItems: TwoFAItem[] = [
    { id: '1', account: 'Account 1', issuer: 'Issuer 1', secret: 'S1', algorithm: 'SHA1', digits: 6, period: 30, color: 'red' },
    { id: '2', account: 'Account 2', issuer: 'Issuer 2', secret: 'S2', algorithm: 'SHA1', digits: 6, period: 30, color: 'blue' },
  ];

  const mockOnSelect = jest.fn();
  const mockOnMove = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    mockUseSortable.mockReturnValue({
        attributes: {},
        listeners: {},
        setNodeRef: jest.fn(),
        transform: null,
        transition: null,
        isDragging: false,
    });
  });

  it('renders list of items', () => {
    render(<SidebarList
        items={mockItems}
        selectedItemId={null}
        onSelect={mockOnSelect}
        onMove={mockOnMove}
        isDragEnabled={true}
    />);

    expect(screen.getByText('Account 1')).toBeInTheDocument();
    expect(screen.getByText('Account 2')).toBeInTheDocument();
  });

  it('highlights selected item', () => {
    const { container } = render(<SidebarList
        items={mockItems}
        selectedItemId="1"
        onSelect={mockOnSelect}
        onMove={mockOnMove}
        isDragEnabled={true}
    />);

    const items = container.querySelectorAll('.sidebar-list-item');
    expect(items[0]).toHaveClass('selected');
    expect(items[1]).not.toHaveClass('selected');
  });

  it('handles item selection', () => {
    render(<SidebarList
        items={mockItems}
        selectedItemId={null}
        onSelect={mockOnSelect}
        onMove={mockOnMove}
        isDragEnabled={true}
    />);

    fireEvent.click(screen.getByText('Account 2'));
    expect(mockOnSelect).toHaveBeenCalledWith('2');
  });

  it('renders default icon if issuer missing', () => {
     const itemsNoIssuer = [{ ...mockItems[0], issuer: '' }];
     render(<SidebarList
        items={itemsNoIssuer}
        selectedItemId={null}
        onSelect={mockOnSelect}
        onMove={mockOnMove}
        isDragEnabled={true}
    />);

    expect(screen.getByText('?')).toBeInTheDocument();
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

      const { container } = render(<SidebarList
        items={mockItems}
        selectedItemId={null}
        onSelect={mockOnSelect}
        onMove={mockOnMove}
        isDragEnabled={true}
    />);

    const items = container.querySelectorAll('.sidebar-list-item');
    // We check opacity style since class is not added, style is used.
    expect(items[0]).toHaveStyle('opacity: 0.5');
  });

  it('uses default color if missing', () => {
      const itemsNoColor = [{ ...mockItems[0], color: undefined }];
      const { container } = render(<SidebarList
        items={itemsNoColor}
        selectedItemId={null}
        onSelect={mockOnSelect}
        onMove={mockOnMove}
        isDragEnabled={true}
    />);

      const items = container.querySelectorAll('.sidebar-list-item');
      // style '--issuer-color'
      // JSDOM might not support CSS variables in style property perfectly for querying?
      // But let's check style attribute string.
      expect(items[0].getAttribute('style')).toContain('--issuer-color: #e23e3e');
  });
});
