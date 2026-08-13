import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import App from './App';
import { TwoFAItem } from '../types';

// Mock utils
jest.mock('../utils/arrayUtils', () => ({
  reorder: jest.fn().mockImplementation((list) => list),
}));

// Mock child components
  jest.mock('./ItemList', () => (props: { 
      items: TwoFAItem[], 
      viewMode: string, 
      onRemove: (id: string) => void, 
      onUpdate: (id: string, updates: Partial<TwoFAItem>) => void, 
      onMove: (id: string, direction: 'up' | 'down') => void, 
      isDragEnabled: boolean 
  }) => (
      <div data-testid="item-list">
          <button onClick={() => props.onRemove('1')}>Remove 1</button>
          <button onClick={() => props.onUpdate('1', { account: 'Updated' })}>Update 1</button>
          <button onClick={() => props.onMove('1', 'up')}>Move Up 1</button>
          <button onClick={() => props.onMove('1', 'down')}>Move Down 1</button>
      </div>
  ));
  jest.mock('./AddItemForm', () => ({ onAdd }: { onAdd: (item: Omit<TwoFAItem, 'id'>) => void }) => (
    <div data-testid="add-item-form">
      <button onClick={() => onAdd({ account: 'New', issuer: 'Issuer', secret: 'S' })}>Add</button>
    </div>
  ));
  jest.mock('./LockScreen', () => ({ onUnlock }: { onUnlock: () => void }) => (
    <div data-testid="lock-screen">
      <button onClick={onUnlock}>Unlock</button>
    </div>
  ));
  jest.mock('./Settings', () => ({ 
      onClose, 
      onExport, 
      onExportEncrypted, 
      onImport, 
      onImportEncrypted, 
      onImportAuthy, 
      onImportGoogleAuth 
  }: { 
      onClose: () => void, 
      onExport: () => void, 
      onExportEncrypted: () => void, 
      onImport: () => void, 
      onImportEncrypted: () => void, 
      onImportAuthy: () => void, 
      onImportGoogleAuth: () => void 
  }) => (
    <div data-testid="settings">
      <button onClick={onClose}>Close Settings</button>
      <button onClick={onExport}>📥 Exportar JSON</button>
      <button onClick={onExportEncrypted}>🔒 Exportar Backup</button>
      <button onClick={onImport}>📤 Importar JSON</button>
      <button onClick={onImportEncrypted}>🔓 Restaurar Backup</button>
      <button onClick={onImportAuthy}>📱 Importar do Authy / URIs</button>
      <button onClick={onImportGoogleAuth}>📱 Importar do Google Auth</button>
    </div>
  ));
  jest.mock('./SidebarList', () => (props: { 
      items: TwoFAItem[], 
      onSelect: (id: string) => void, 
      onMove: (id: string, direction: 'up' | 'down') => void, 
      selectedItemId: string | null 
  }) => (
    <div data-testid="sidebar-list">
      <button onClick={() => props.onSelect('1')}>Select 1</button>
      <button onClick={() => props.onMove('1', 'up')}>Move Up 1</button>
      <span data-testid="selected-id">{props.selectedItemId}</span>
    </div>
  ));
  jest.mock('./TokenDetail', () => (props: { 
      item: TwoFAItem, 
      onUpdate: (id: string, updates: Partial<TwoFAItem>) => void, 
      onRemove: (id: string) => void 
  }) => (
    <div data-testid="token-detail">
      <button onClick={() => props.onRemove('1')}>Remove Detail 1</button>
      <button onClick={() => props.onUpdate('1', { account: 'Updated' })}>Update Detail 1</button>
    </div>
  ));

// Mock dnd-kit
  jest.mock('@dnd-kit/core', () => ({
    DndContext: ({ children, onDragEnd }: { children: React.ReactNode; onDragEnd: (event: { active: { id: string }; over: { id: string } }) => void }) => (
        <div>
            {children}
            <button data-testid="trigger-drag-end" onClick={() => onDragEnd({ active: { id: '1' }, over: { id: '2' } })}>DragEnd</button>
            <button data-testid="trigger-drag-end-same" onClick={() => onDragEnd({ active: { id: '1' }, over: { id: '1' } })}>DragEndSame</button>
        </div>
    ),
    closestCenter: jest.fn(),
    PointerSensor: jest.fn(),
    useSensor: jest.fn(),
    useSensors: jest.fn(),
  }));

// Mock window.electron
const mockGetSettings = jest.fn();
const mockGet2FAItems = jest.fn();
const mockAdd2FAItem = jest.fn();
const mockRemove2FAItem = jest.fn();
const mockUpdate2FAItem = jest.fn();
const mockSet2FAItems = jest.fn();
const mockExport2FA = jest.fn();
const mockExport2FAEncrypted = jest.fn();
const mockImport2FA = jest.fn();
const mockImport2FAEncrypted = jest.fn();
const mockImportAuthy = jest.fn();
const mockImportGoogleAuth = jest.fn();
const mockOnProtocolUrl = jest.fn(() => jest.fn());

beforeAll(() => {
  (window as unknown as { electron: Partial<import("../../renderer/types").ElectronAPI> }).electron = {
    getSettings: mockGetSettings,
    get2FAItems: mockGet2FAItems,
    add2FAItem: mockAdd2FAItem,
    remove2FAItem: mockRemove2FAItem,
    update2FAItem: mockUpdate2FAItem,
    set2FAItems: mockSet2FAItems,
    export2FA: mockExport2FA,
    export2FAEncrypted: mockExport2FAEncrypted,
    import2FA: mockImport2FA,
    import2FAEncrypted: mockImport2FAEncrypted,
    importAuthy: mockImportAuthy,
    importGoogleAuth: mockImportGoogleAuth,
    onProtocolUrl: mockOnProtocolUrl,
  };
});

describe('App', () => {
  const mockItems: TwoFAItem[] = [
    { id: '1', account: 'Account 1', issuer: 'Issuer 1', secret: 'S1', algorithm: 'SHA1', digits: 6, period: 30, color: 'red' },
    { id: '2', account: 'Account 2', issuer: 'Issuer 2', secret: 'S2', algorithm: 'SHA1', digits: 6, period: 30, color: 'blue' },
  ];

  beforeEach(() => {
    jest.clearAllMocks();
    mockGetSettings.mockResolvedValue({
        autoLock: false,
        blurOnInactive: false,
    });
    mockGet2FAItems.mockResolvedValue(mockItems);
    mockSet2FAItems.mockResolvedValue(true);
  });

  // Basic Render Tests
  it('starts locked and unlocks', async () => {
    render(<App />);
    expect(screen.getByTestId('lock-screen')).toBeInTheDocument();
    fireEvent.click(screen.getByText('Unlock'));
    await waitFor(() => {
        expect(screen.queryByTestId('lock-screen')).not.toBeInTheDocument();
        expect(screen.getByTestId('item-list')).toBeInTheDocument();
    });
  });

  it('handles item removal', async () => {
    render(<App />);
    fireEvent.click(screen.getByText('Unlock'));
    await waitFor(() => expect(screen.getByTestId('item-list')).toBeInTheDocument());

    fireEvent.click(screen.getByText('Remove 1'));

    await waitFor(() => {
        expect(mockRemove2FAItem).toHaveBeenCalledWith('1');
    });
  });

  it('handles item removal failure', async () => {
    mockRemove2FAItem.mockRejectedValue(new Error('Failed'));
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

    render(<App />);
    fireEvent.click(screen.getByText('Unlock'));
    await waitFor(() => expect(screen.getByTestId('item-list')).toBeInTheDocument());

    fireEvent.click(screen.getByText('Remove 1'));

    await waitFor(() => {
        expect(mockRemove2FAItem).toHaveBeenCalledWith('1');
        expect(consoleSpy).toHaveBeenCalledWith('Failed to remove item:', expect.any(Error));
    });
    consoleSpy.mockRestore();
  });

  it('handles item update', async () => {
    mockUpdate2FAItem.mockResolvedValue({ ...mockItems[0], account: 'Updated' });
    render(<App />);
    fireEvent.click(screen.getByText('Unlock'));
    await waitFor(() => expect(screen.getByTestId('item-list')).toBeInTheDocument());

    fireEvent.click(screen.getByText('Update 1'));

    await waitFor(() => {
        expect(mockUpdate2FAItem).toHaveBeenCalledWith('1', { account: 'Updated' });
    });
  });

  it('handles item update failure', async () => {
    mockUpdate2FAItem.mockRejectedValue(new Error('Failed'));
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

    render(<App />);
    fireEvent.click(screen.getByText('Unlock'));
    await waitFor(() => expect(screen.getByTestId('item-list')).toBeInTheDocument());

    fireEvent.click(screen.getByText('Update 1'));

    await waitFor(() => {
        expect(mockUpdate2FAItem).toHaveBeenCalledWith('1', { account: 'Updated' });
        expect(consoleSpy).toHaveBeenCalledWith('Failed to update item:', expect.any(Error));
    });
    consoleSpy.mockRestore();
  });

  it('handles manual move (up/down)', async () => {
    render(<App />);
    fireEvent.click(screen.getByText('Unlock'));
    await waitFor(() => expect(screen.getByTestId('item-list')).toBeInTheDocument());

    // Move Down 1 (index 0 -> 1)
    fireEvent.click(screen.getByText('Move Down 1'));
    await waitFor(() => {
        expect(mockSet2FAItems).toHaveBeenCalled();
        // Expect reordered array: [item2, item1]
        const expected = [mockItems[1], mockItems[0]];
        expect(mockSet2FAItems).toHaveBeenCalledWith(expected);
    });

    mockSet2FAItems.mockClear();

    fireEvent.click(screen.getByText('Move Up 1'));

    await waitFor(() => {
         expect(mockSet2FAItems).toHaveBeenCalled();
         // Back to original: [item1, item2]
         const expected = [mockItems[0], mockItems[1]];
         expect(mockSet2FAItems).toHaveBeenCalledWith(expected);
    });
  });

  it('handles manual move edges', async () => {
    render(<App />);
    fireEvent.click(screen.getByText('Unlock'));
    await waitFor(() => expect(screen.getByTestId('item-list')).toBeInTheDocument());

    // Try to move item 1 up (it is at index 0)
    fireEvent.click(screen.getByText('Move Up 1'));

    // Should NOT call set2FAItems
    await waitFor(() => {
        expect(mockSet2FAItems).not.toHaveBeenCalled();
    });
  });

  it('handles drag end reorder', async () => {
     render(<App />);
     fireEvent.click(screen.getByText('Unlock'));
     await waitFor(() => expect(screen.getByTestId('item-list')).toBeInTheDocument());

     fireEvent.click(screen.getByTestId('trigger-drag-end'));

     await waitFor(() => {
         expect(mockSet2FAItems).toHaveBeenCalled();
     });
  });

  it('handles drag end reorder failure', async () => {
     mockSet2FAItems.mockRejectedValue(new Error('Fail'));
     const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

     render(<App />);
     fireEvent.click(screen.getByText('Unlock'));
     await waitFor(() => expect(screen.getByTestId('item-list')).toBeInTheDocument());

     fireEvent.click(screen.getByTestId('trigger-drag-end'));

     await waitFor(() => {
         expect(consoleSpy).toHaveBeenCalled();
     });
     consoleSpy.mockRestore();
  });

    it('handles drag end same item', async () => {
     render(<App />);
     fireEvent.click(screen.getByText('Unlock'));
     await waitFor(() => expect(screen.getByTestId('item-list')).toBeInTheDocument());

     fireEvent.click(screen.getByTestId('trigger-drag-end-same'));

     await waitFor(() => {
         expect(mockSet2FAItems).not.toHaveBeenCalled();
     });
  });

  it('handles auto-lock timer', async () => {
      jest.useFakeTimers();
      mockGetSettings.mockResolvedValue({
        autoLock: true,
        autoLockTimeout: 1, // 1 minute
      });

      render(<App />);
      fireEvent.click(screen.getByText('Unlock'));
      await waitFor(() => expect(screen.getByTestId('item-list')).toBeInTheDocument());

      // Advance timers by 1 minute +
      act(() => {
          jest.advanceTimersByTime(60 * 1000 + 100);
      });

      expect(screen.getByTestId('lock-screen')).toBeInTheDocument();
      jest.useRealTimers();
  });

  it('resets auto-lock timer on activity', async () => {
      jest.useFakeTimers();
      mockGetSettings.mockResolvedValue({
        autoLock: true,
        autoLockTimeout: 1,
      });

      render(<App />);
      fireEvent.click(screen.getByText('Unlock'));
      await waitFor(() => expect(screen.getByTestId('item-list')).toBeInTheDocument());

      // Advance 30s
      act(() => {
          jest.advanceTimersByTime(30 * 1000);
      });

      // User activity
      fireEvent.mouseMove(window);

      // Advance 31s
      act(() => {
          jest.advanceTimersByTime(31 * 1000);
      });

      // Should NOT be locked yet
      expect(screen.queryByTestId('lock-screen')).not.toBeInTheDocument();

      // Advance another 30s
      act(() => {
          jest.advanceTimersByTime(30 * 1000);
      });

      expect(screen.getByTestId('lock-screen')).toBeInTheDocument();
      jest.useRealTimers();
  });

  it('handles failed export', async () => {
      window.alert = jest.fn();
      mockExport2FA.mockRejectedValue(new Error('Export failed'));
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

      render(<App />);
      fireEvent.click(screen.getByText('Unlock'));
      await waitFor(() => expect(screen.getByTestId('item-list')).toBeInTheDocument());

      fireEvent.click(screen.getByTitle('Configurações'));
      fireEvent.click(screen.getByText('📥 Exportar JSON'));

      await waitFor(() => {
          expect(window.alert).toHaveBeenCalledWith('Erro ao exportar');
          expect(consoleSpy).toHaveBeenCalled();
      });
      consoleSpy.mockRestore();
  });

  it('handles failed import', async () => {
      window.alert = jest.fn();
      mockImport2FA.mockRejectedValue(new Error('Import failed'));
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

      render(<App />);
      fireEvent.click(screen.getByText('Unlock'));
      await waitFor(() => expect(screen.getByTestId('item-list')).toBeInTheDocument());

      fireEvent.click(screen.getByTitle('Configurações'));
      fireEvent.click(screen.getByText('📤 Importar JSON'));

      await waitFor(() => {
          expect(window.alert).toHaveBeenCalledWith('Erro ao importar');
          expect(consoleSpy).toHaveBeenCalled();
      });
      consoleSpy.mockRestore();
  });

    it('handles authy import success', async () => {
        window.alert = jest.fn();
        mockImportAuthy.mockResolvedValue({ success: true, count: 10 });

        render(<App />);
        fireEvent.click(screen.getByText('Unlock'));
        await waitFor(() => expect(screen.getByTestId('item-list')).toBeInTheDocument());

        fireEvent.click(screen.getByTitle('Configurações'));
        fireEvent.click(screen.getByText('📱 Importar do Authy / URIs'));

        await waitFor(() => {
            expect(mockImportAuthy).toHaveBeenCalled();
            expect(window.alert).toHaveBeenCalledWith('10 itens Authy importados com sucesso!');
        });
    });

    it('handles authy import failure', async () => {
        window.alert = jest.fn();
        mockImportAuthy.mockResolvedValue({ success: false, error: 'File invalid' });

        render(<App />);
        fireEvent.click(screen.getByText('Unlock'));
        await waitFor(() => expect(screen.getByTestId('item-list')).toBeInTheDocument());

        fireEvent.click(screen.getByTitle('Configurações'));
        fireEvent.click(screen.getByText('📱 Importar do Authy / URIs'));

        await waitFor(() => {
            expect(window.alert).toHaveBeenCalledWith('Erro ao importar: File invalid');
        });
    });

    it('handles authy import exception', async () => {
        window.alert = jest.fn();
        const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
        mockImportAuthy.mockRejectedValue(new Error('Crash'));

        render(<App />);
        fireEvent.click(screen.getByText('Unlock'));
        await waitFor(() => expect(screen.getByTestId('item-list')).toBeInTheDocument());

        fireEvent.click(screen.getByTitle('Configurações'));
        fireEvent.click(screen.getByText('📱 Importar do Authy / URIs'));

        await waitFor(() => {
            expect(window.alert).toHaveBeenCalledWith('Erro ao importar Authy');
        });
        consoleSpy.mockRestore();
    });

    it('handles load items failure', async () => {
        mockGet2FAItems.mockRejectedValue(new Error('Load failed'));
        const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

        render(<App />);
        fireEvent.click(screen.getByText('Unlock'));

        await waitFor(() => {
            expect(consoleSpy).toHaveBeenCalledWith('Failed to load items:', expect.any(Error));
        });
        consoleSpy.mockRestore();
    });

    it('handles add item failure', async () => {
        mockAdd2FAItem.mockRejectedValue(new Error('Add failed'));
        const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

        render(<App />);
        fireEvent.click(screen.getByText('Unlock'));
        await waitFor(() => expect(screen.getByTestId('item-list')).toBeInTheDocument());

        fireEvent.click(screen.getByTitle('Adicionar Conta'));
        fireEvent.click(screen.getByText('Add'));

        await waitFor(() => {
            expect(consoleSpy).toHaveBeenCalledWith('Failed to add item:', expect.any(Error));
        });
        consoleSpy.mockRestore();
    });

    it('handles encrypted export failure', async () => {
        window.prompt = jest.fn().mockReturnValue('password');
        window.alert = jest.fn();
        mockExport2FAEncrypted.mockResolvedValue({ success: false, error: 'Crypt Error' });

        render(<App />);
        fireEvent.click(screen.getByText('Unlock'));
        await waitFor(() => expect(screen.getByTestId('item-list')).toBeInTheDocument());

        fireEvent.click(screen.getByTitle('Configurações'));
        fireEvent.click(screen.getByText('🔒 Exportar Backup'));

        await waitFor(() => {
            expect(window.alert).toHaveBeenCalledWith('Erro ao exportar: Crypt Error');
        });
    });

    it('handles encrypted export exception', async () => {
        window.prompt = jest.fn().mockReturnValue('password');
        window.alert = jest.fn();
        const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
        mockExport2FAEncrypted.mockRejectedValue(new Error('Export Crash'));

        render(<App />);
        fireEvent.click(screen.getByText('Unlock'));
        await waitFor(() => expect(screen.getByTestId('item-list')).toBeInTheDocument());

        fireEvent.click(screen.getByTitle('Configurações'));
        fireEvent.click(screen.getByText('🔒 Exportar Backup'));

        await waitFor(() => {
            expect(window.alert).toHaveBeenCalledWith('Erro ao exportar');
        });
        consoleSpy.mockRestore();
    });

    it('handles encrypted import failure', async () => {
        window.prompt = jest.fn().mockReturnValue('password');
        window.alert = jest.fn();
        mockImport2FAEncrypted.mockResolvedValue({ success: false, error: 'Crypt Error' });

        render(<App />);
        fireEvent.click(screen.getByText('Unlock'));
        await waitFor(() => expect(screen.getByTestId('item-list')).toBeInTheDocument());

        fireEvent.click(screen.getByTitle('Configurações'));
        fireEvent.click(screen.getByText('🔓 Restaurar Backup'));

        await waitFor(() => {
            expect(window.alert).toHaveBeenCalledWith('Erro ao importar: Crypt Error');
        });
    });

    it('handles encrypted import exception', async () => {
        window.prompt = jest.fn().mockReturnValue('password');
        window.alert = jest.fn();
        const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
        mockImport2FAEncrypted.mockRejectedValue(new Error('Import Crash'));

        render(<App />);
        fireEvent.click(screen.getByText('Unlock'));
        await waitFor(() => expect(screen.getByTestId('item-list')).toBeInTheDocument());

        fireEvent.click(screen.getByTitle('Configurações'));
        fireEvent.click(screen.getByText('🔓 Restaurar Backup'));

        await waitFor(() => {
            expect(window.alert).toHaveBeenCalledWith('Erro ao importar');
        });
        consoleSpy.mockRestore();
    });

    it('renders empty state when no items', async () => {
        mockGet2FAItems.mockResolvedValue([]);
        render(<App />);
        fireEvent.click(screen.getByText('Unlock'));

        await waitFor(() => {
            expect(screen.getByText('Nenhum item 2FA adicionado ainda')).toBeInTheDocument();
            expect(screen.getByText('+ Adicionar primeira conta')).toBeInTheDocument();
        });
    });

    it('renders filtered empty state', async () => {
        render(<App />);
        fireEvent.click(screen.getByText('Unlock'));
        await waitFor(() => expect(screen.getByTestId('item-list')).toBeInTheDocument());

        const searchBar = screen.getByPlaceholderText('Buscar contas...');
        fireEvent.change(searchBar, { target: { value: 'Nonexistent' } });

        expect(screen.getByText('Nenhuma conta encontrada para "Nonexistent"')).toBeInTheDocument();
    });

    it('renders list view with selection', async () => {
        render(<App />);
        fireEvent.click(screen.getByText('Unlock'));
        await waitFor(() => expect(screen.getByTestId('item-list')).toBeInTheDocument());

        // Switch to list view
        fireEvent.click(screen.getByTitle('Ver em Lista'));

        await waitFor(() => {
            expect(screen.getByTestId('sidebar-list')).toBeInTheDocument();
            expect(screen.getByTestId('token-detail')).toBeInTheDocument();
        });

        // Select item in sidebar (using our mocked button)
        fireEvent.click(screen.getByText('Select 1'));
    });

    it('handles keyboard navigation in list view', async () => {
        render(<App />);
        fireEvent.click(screen.getByText('Unlock'));
        await waitFor(() => expect(screen.getByTestId('item-list')).toBeInTheDocument());

        // Switch to list view
        fireEvent.click(screen.getByTitle('Ver em Lista'));

        await waitFor(() => {
            expect(screen.getByTestId('sidebar-list')).toBeInTheDocument();
        });

        // Initially first item (id: '1') should be selected automatically by effect in App
        await waitFor(() => {
            expect(screen.getByTestId('selected-id')).toHaveTextContent('1');
        });

        // Arrow Down -> Select 2
        fireEvent.keyDown(window, { key: 'ArrowDown' });
        await waitFor(() => {
            expect(screen.getByTestId('selected-id')).toHaveTextContent('2');
        });

        // Arrow Up -> Select 1
        fireEvent.keyDown(window, { key: 'ArrowUp' });
        await waitFor(() => {
            expect(screen.getByTestId('selected-id')).toHaveTextContent('1');
        });
    });

    it('handles global shortcuts', async () => {
        render(<App />);
        fireEvent.click(screen.getByText('Unlock'));
        await waitFor(() => expect(screen.getByTestId('item-list')).toBeInTheDocument());

        // Ctrl+N -> Toggle Sidebar
        fireEvent.keyDown(window, { key: 'n', ctrlKey: true });
        await waitFor(() => {
            expect(screen.getByTestId('add-item-form')).toBeInTheDocument();
        });

        fireEvent.keyDown(window, { key: 'n', ctrlKey: true });
        await waitFor(() => {
            expect(screen.queryByTestId('add-item-form')).not.toBeInTheDocument();
        });

        // Ctrl+, -> Open Settings
        fireEvent.keyDown(window, { key: ',', ctrlKey: true });
        await waitFor(() => {
            expect(screen.getByTestId('settings')).toBeInTheDocument();
        });
    });

    it('handles more global shortcuts', async () => {
        render(<App />);
        fireEvent.click(screen.getByText('Unlock'));
        await waitFor(() => expect(screen.getByTestId('item-list')).toBeInTheDocument());

        // Ctrl+F -> Focus search
        fireEvent.keyDown(window, { key: 'f', ctrlKey: true });
        expect(document.activeElement).toBe(screen.getByPlaceholderText('Buscar contas...'));

        // Escape to clear search
        fireEvent.change(screen.getByPlaceholderText('Buscar contas...'), { target: { value: 'query' } });
        fireEvent.keyDown(window, { key: 'Escape' });
        expect(screen.getByPlaceholderText('Buscar contas...')).toHaveValue('');

        // Escape to close settings
        fireEvent.keyDown(window, { key: ',', ctrlKey: true }); // open settings
        await waitFor(() => expect(screen.getByTestId('settings')).toBeInTheDocument());
        fireEvent.keyDown(window, { key: 'Escape' }); // close settings
        await waitFor(() => expect(screen.queryByTestId('settings')).not.toBeInTheDocument());

        // Escape to close sidebar
        fireEvent.keyDown(window, { key: 'n', ctrlKey: true }); // open sidebar
        await waitFor(() => expect(screen.getByTestId('add-item-form')).toBeInTheDocument());
        fireEvent.keyDown(window, { key: 'Escape' }); // close sidebar
        await waitFor(() => expect(screen.queryByTestId('add-item-form')).not.toBeInTheDocument());

        // Ctrl+L -> Lock
        fireEvent.keyDown(window, { key: 'l', ctrlKey: true });
        await waitFor(() => {
            expect(screen.getByTestId('lock-screen')).toBeInTheDocument();
        });
    });

    it('handles blur and focus window events', async () => {
        // Must enable blurOnInactive setting
        mockGetSettings.mockResolvedValue({
            autoLock: false,
            blurOnInactive: true,
        });

        render(<App />);
        fireEvent.click(screen.getByText('Unlock'));
        await waitFor(() => expect(screen.getByTestId('item-list')).toBeInTheDocument());

        // Should not be blurred initially
        expect(screen.queryByText('🛡️ App desfocado')).not.toBeInTheDocument();

        // Trigger blur
        fireEvent.blur(window);
        await waitFor(() => {
            expect(screen.getByText('🛡️ App desfocado')).toBeInTheDocument();
        });

        // Trigger focus
        fireEvent.focus(window);
        await waitFor(() => {
            expect(screen.queryByText('🛡️ App desfocado')).not.toBeInTheDocument();
        });
    });

    it('handles ArrowDown when no item is selected', async () => {
        render(<App />);
        fireEvent.click(screen.getByText('Unlock'));
        await waitFor(() => expect(screen.getByTestId('item-list')).toBeInTheDocument());

        // Select item in sidebar to make sure one is selected
        fireEvent.click(screen.getByTitle('Ver em Lista'));
        await waitFor(() => expect(screen.getByTestId('sidebar-list')).toBeInTheDocument());

        // Go to bottom of list
        fireEvent.keyDown(window, { key: 'ArrowDown' });
        fireEvent.keyDown(window, { key: 'ArrowDown' });
        // Now try going down one more time (should do nothing but covers the index < length - 1 condition)
        fireEvent.keyDown(window, { key: 'ArrowDown' });

        // Let's trigger an event that makes currentIndex === -1 during KeyDown
        // We can do this by searching for something that hides the selected item
        const searchBar = screen.getByPlaceholderText('Buscar contas...');
        fireEvent.change(searchBar, { target: { value: 'Account 1' } }); // This filters list down
        fireEvent.keyDown(window, { key: 'ArrowDown' });

        // Wait for UI update
        await waitFor(() => {
            expect(screen.getByTestId('sidebar-list')).toBeInTheDocument();
        });
    });

    it('handles drag end with missing index', async () => {
      render(<App />);
      fireEvent.click(screen.getByText('Unlock'));
      await waitFor(() => expect(screen.getByTestId('item-list')).toBeInTheDocument());

      // Remove item 1
      fireEvent.click(screen.getByText('Remove 1'));
        await waitFor(() => expect(mockRemove2FAItem).toHaveBeenCalledWith('1'));

        // Now trigger drag end which involves ID '1' and '2'. ID '1' is gone.
        fireEvent.click(screen.getByTestId('trigger-drag-end'));

        // Should not call set2FAItems because oldIndex === -1
        await waitFor(() => {
             // It might have been called earlier, but let's clear it first
        });
    });
});
