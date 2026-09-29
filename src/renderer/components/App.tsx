import React, { useEffect, useState } from 'react';
import { DndContext, closestCenter, PointerSensor, useSensor, useSensors, DragEndEvent } from '@dnd-kit/core';
import { reorder } from '../utils/arrayUtils';
import { TwoFAItem, AppSettings } from '../types';
import ItemList from './ItemList';
import AddItemForm from './AddItemForm';
import LockScreen from './LockScreen';
import Settings from './Settings';
import SidebarList from './SidebarList';
import TokenDetail from './TokenDetail';
import './App.css';

const App: React.FC = () => {
    const [items, setItems] = useState<TwoFAItem[]>([]);
    const [filteredItems, setFilteredItems] = useState<TwoFAItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [isLocked, setIsLocked] = useState(true);
    const [viewMode, setViewMode] = useState<'list' | 'grid'>('grid');
    const [selectedItemId, setSelectedItemId] = useState<string | null>(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [sidebarMode, setSidebarMode] = useState<'none' | 'add'>('none');
    const [showSettings, setShowSettings] = useState(false);
    const [settings, setSettings] = useState<AppSettings | null>(null);
    const [isWindowFocused, setIsWindowFocused] = useState(true);
    const [pendingUri, setPendingUri] = useState<string | null>(null);

    const sensors = useSensors(
        useSensor(PointerSensor, {
            activationConstraint: {
                distance: 8,
            },
        })
    );

    useEffect(() => {
        const handleFocus = () => setIsWindowFocused(true);
        const handleBlur = () => setIsWindowFocused(false);
        window.addEventListener('focus', handleFocus);
        window.addEventListener('blur', handleBlur);
        return () => {
            window.removeEventListener('focus', handleFocus);
            window.removeEventListener('blur', handleBlur);
        };
    }, []);

    useEffect(() => {
        const unsubscribe = window.electron.onProtocolUrl((url) => {
            setPendingUri(url);
            setSidebarMode('add');
        });
        return unsubscribe;
    }, []);

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            const activeElement = document.activeElement as HTMLElement;
            const isInputFocused = activeElement && (activeElement.tagName === 'INPUT' || activeElement.tagName === 'TEXTAREA');

            if (e.ctrlKey || e.metaKey) {
                if (e.key === 'f') {
                    e.preventDefault();
                    document.querySelector<HTMLInputElement>('.search-bar')?.focus();
                } else if (e.key === 'l') {
                    e.preventDefault();
                    setIsLocked(true);
                } else if (e.key === 'n') {
                    e.preventDefault();
                    setSidebarMode(prev => prev === 'add' ? 'none' : 'add');
                } else if (e.key === ',') {
                    e.preventDefault();
                    setShowSettings(true);
                }
            } else if (e.key === 'Escape') {
                if (sidebarMode !== 'none') {
                    setSidebarMode('none');
                }
                if (showSettings) {
                    setShowSettings(false);
                }
                if (searchQuery) {
                    setSearchQuery('');
                }
            } else if (viewMode === 'list' && !isInputFocused && !showSettings && sidebarMode === 'none') {
                if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
                    e.preventDefault();
                    const currentIndex = filteredItems.findIndex(item => item.id === selectedItemId);

                    if (e.key === 'ArrowDown') {
                        if (currentIndex < filteredItems.length - 1) {
                            setSelectedItemId(filteredItems[currentIndex + 1].id);
                        } else if (currentIndex === -1 && filteredItems.length > 0) {
                            setSelectedItemId(filteredItems[0].id);
                        }
                    } else if (e.key === 'ArrowUp') {
                        if (currentIndex > 0) {
                            setSelectedItemId(filteredItems[currentIndex - 1].id);
                        }
                    }
                }
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [sidebarMode, showSettings, searchQuery, viewMode, filteredItems, selectedItemId]);

    useEffect(() => {
        loadSettings();
    }, [showSettings]); // Reload settings when settings view closes

    const loadSettings = async () => {
        const loaded = await window.electron.getSettings();
        setSettings(loaded);

        // Apply Theme and Accent Color
        const rootStyle = document.documentElement.style;
        if (loaded.theme === 'light') {
            rootStyle.setProperty('--bg-dark', '#f0f2f5');
            rootStyle.setProperty('--bg-card', '#ffffff');
            rootStyle.setProperty('--bg-hover', '#e4e6eb');
            rootStyle.setProperty('--text-primary', '#1c1e21');
            rootStyle.setProperty('--text-secondary', '#65676b');
            rootStyle.setProperty('--border-color', '#ccd0d5');
        } else {
            rootStyle.setProperty('--bg-dark', '#1a1a1a');
            rootStyle.setProperty('--bg-card', '#2d2d2d');
            rootStyle.setProperty('--bg-hover', '#3d3d3d');
            rootStyle.setProperty('--text-primary', '#ffffff');
            rootStyle.setProperty('--text-secondary', '#aaaaaa');
            rootStyle.setProperty('--border-color', '#444444');
        }

        if (loaded.accentColor) {
            rootStyle.setProperty('--primary-color', loaded.accentColor);
            rootStyle.setProperty('--primary-hover', loaded.accentColor); // Simple fallback
        } else {
            rootStyle.setProperty('--primary-color', '#e23e3e');
            rootStyle.setProperty('--primary-hover', '#c53030');
        }
    };

    useEffect(() => {
        let timer: ReturnType<typeof setTimeout>;

        const resetTimer = () => {
            if (timer) clearTimeout(timer);
            if (settings?.autoLock && !isLocked) {
                const timeoutMs = (settings.autoLockTimeout || 5) * 60 * 1000;
                timer = setTimeout(() => {
                    setIsLocked(true);
                }, timeoutMs);
            }
        };

        if (!isLocked && settings?.autoLock) {
            resetTimer();
            window.addEventListener('mousemove', resetTimer);
            window.addEventListener('keydown', resetTimer);
            window.addEventListener('click', resetTimer);
        }

        return () => {
            if (timer) clearTimeout(timer);
            window.removeEventListener('mousemove', resetTimer);
            window.removeEventListener('keydown', resetTimer);
            window.removeEventListener('click', resetTimer);
        };
    }, [isLocked, settings]);

    useEffect(() => {
        if (!isLocked) {
            loadItems();
        }
    }, [isLocked]);

    // Select first item if none selected when in list mode and items change
    useEffect(() => {
        if (viewMode === 'list' && !selectedItemId && filteredItems.length > 0) {
            setSelectedItemId(filteredItems[0].id);
        }
    }, [viewMode, filteredItems, selectedItemId]);

    useEffect(() => {
        if (searchQuery.trim() === '') {
            setFilteredItems(items);
        } else {
            const lowerQuery = searchQuery.toLowerCase();
            setFilteredItems(
                items.filter(
                    item =>
                        item.account.toLowerCase().includes(lowerQuery) ||
                        item.issuer.toLowerCase().includes(lowerQuery)
                )
            );
        }
    }, [searchQuery, items]);

    useEffect(() => {
        if (isLocked) {
            if (window.electron.lockApp) {
                window.electron.lockApp().catch(console.error);
            }
        }
    }, [isLocked]);

    const handleUnlock = () => {
        setIsLocked(false);
    };

    const loadItems = async () => {
        try {
            const loadedItems = await window.electron.get2FAItems();
            setItems(loadedItems);
        } catch (error) {
            console.error('Failed to load items:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleAddItem = async (item: Omit<TwoFAItem, 'id'>) => {
        try {
            const newItem = await window.electron.add2FAItem(item);
            setItems([...items, newItem]);
        } catch (error) {
            console.error('Failed to add item:', error);
        }
    };

    const handleRemoveItem = async (id: string) => {
        try {
            await window.electron.remove2FAItem(id);
            setItems(items.filter(item => item.id !== id));
        } catch (error) {
            console.error('Failed to remove item:', error);
        }
    };

    const handleUpdateItem = async (id: string, updatedFields: Partial<TwoFAItem>) => {
        try {
            const updatedItem = await window.electron.update2FAItem(id, updatedFields);
            if (updatedItem) {
                setItems(items.map(item => (item.id === id ? updatedItem : item)));
            }
        } catch (error) {
            console.error('Failed to update item:', error);
        }
    };

    const handleMoveItem = async (id: string, direction: 'up' | 'down') => {
        const index = items.findIndex(item => item.id === id);
        if (index === -1) return;

        const newItems = [...items];
        if (direction === 'up') {
            if (index === 0) return;
            [newItems[index - 1], newItems[index]] = [newItems[index], newItems[index - 1]];
        } else {
            if (index === items.length - 1) return;
            [newItems[index + 1], newItems[index]] = [newItems[index], newItems[index + 1]];
        }

        setItems(newItems);
        try {
            await window.electron.set2FAItems(newItems);
        } catch (error) {
            console.error('Failed to update order', error);
        }
    };

    const handleDragEnd = async (event: DragEndEvent) => {
        const { active, over } = event;
        if (!over || active.id === over.id) return;

        const oldIndex = items.findIndex((item) => item.id === active.id);
        const newIndex = items.findIndex((item) => item.id === over.id);

         if (oldIndex !== -1 && newIndex !== -1) {
             const newItems = reorder(items, oldIndex, newIndex);
             setItems(newItems);
             try {
                 await window.electron.set2FAItems(newItems);
             } catch (error) {
                 console.error('Failed to update order', error);
             }
         }
    };

    const handleExport = async () => {
        try {
            const result = await window.electron.export2FA();
            if (result.success) {
                alert(`Backup exportado com sucesso: ${result.path}`);
            }
        } catch (error) {
            console.error('Failed to export:', error);
            alert('Erro ao exportar');
        }
    };

    const handleExportEncrypted = async () => {
        const password = prompt("Digite uma senha para criptografar o backup:");
        if (!password) return;

        try {
            const result = await window.electron.export2FAEncrypted(password);
            if (result.success) {
                alert(`Backup criptografado exportado com sucesso: ${result.path}`);
            } else if (result.error) {
                alert(`Erro ao exportar: ${result.error}`);
            }
        } catch (error) {
            console.error('Failed to export encrypted:', error);
            alert('Erro ao exportar');
        }
    };

    const handleImport = async () => {
        try {
            const result = await window.electron.import2FA();
            if (result.success) {
                await loadItems();
                alert(`${result.count} itens importados com sucesso!`);
            }
        } catch (error) {
            console.error('Failed to import:', error);
            alert('Erro ao importar');
        }
    };

    const handleImportEncrypted = async () => {
        const password = prompt("Digite a senha do backup:");
        if (!password) return;

        try {
            const result = await window.electron.import2FAEncrypted(password);
            if (result.success) {
                await loadItems();
                alert(`${result.count} itens importados com sucesso!`);
            } else if (result.error) {
                alert(`Erro ao importar: ${result.error}`);
            }
        } catch (error) {
            console.error('Failed to import encrypted:', error);
            alert('Erro ao importar');
        }
    };

    const handleImportAuthy = async () => {
        try {
            const result = await window.electron.importAuthy();
            if (result.success) {
                await loadItems();
                alert(`${result.count} itens Authy importados com sucesso!`);
            } else {
                alert(`Erro ao importar: ${result.error || 'Arquivo inválido'}`);
            }
        } catch (error) {
            console.error('Failed to import from Authy:', error);
            alert('Erro ao importar Authy');
        }
    };

    const handleImportGoogleAuth = async () => {
        try {
            const result = await window.electron.importGoogleAuth();
            if (result.success) {
                await loadItems();
                alert(`${result.count} contas do Google Authenticator importadas com sucesso!`);
            } else {
                alert(`Erro ao importar: ${result.error || 'Arquivo inválido'}`);
            }
        } catch (error) {
            console.error('Failed to import from Google Authenticator:', error);
            alert('Erro ao importar Google Authenticator');
        }
    };

    if (isLocked) {
        return <LockScreen onUnlock={handleUnlock} />;
    }

    return (
        <div className="app">
            <header className="app-header">
                <div className="header-left">
                    <h1>
                        <span className="app-logo-icon">🔐</span> 2FAC
                    </h1>
                </div>

                <div className="header-center">
                    <input
                        type="text"
                        className="search-bar"
                        placeholder="Buscar contas..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>

                <div className="header-right">
                    <button
                        className="btn-icon"
                        onClick={() => setSidebarMode(sidebarMode === 'add' ? 'none' : 'add')}
                        title="Adicionar Conta"
                    >
                        +
                    </button>
                    <button
                        className="btn-icon"
                        onClick={() => setViewMode(viewMode === 'grid' ? 'list' : 'grid')}
                        title={viewMode === 'grid' ? 'Ver em Lista' : 'Ver em Grade'}
                    >
                        {viewMode === 'grid' ? '☰' : '▦'}
                    </button>
                    <button
                        className="btn-icon"
                        onClick={() => setShowSettings(true)}
                        title="Configurações"
                    >
                        ⚙
                    </button>
                    <button
                        className="btn-icon"
                        onClick={() => setIsLocked(true)}
                        title="Bloquear App"
                    >
                        🔒
                    </button>
                </div>
            </header>

            <div className="app-content">
                {!isWindowFocused && settings?.blurOnInactive && !isLocked && (
                    <div className="blur-overlay">
                        <div className="blur-message">
                            <span>🛡️ App desfocado</span>
                        </div>
                    </div>
                )}

                {sidebarMode === 'add' && (
                    <div className="sidebar">
                        <div className="sidebar-section">
                            <h3>Adicionar Conta</h3>
                            <AddItemForm
                                initialUri={pendingUri || undefined}
                                onAdd={(item) => {
                                    handleAddItem(item);
                                    setSidebarMode('none');
                                    setPendingUri(null);
                                }}
                            />
                        </div>
                    </div>
                )}

                {viewMode === 'list' && !showSettings && !loading && items.length > 0 ? (
                    <div className="split-view-container">
                        <DndContext
                            sensors={sensors}
                            collisionDetection={closestCenter}
                            onDragEnd={handleDragEnd}
                        >
                            <div className="sidebar-list-container">
                                <SidebarList
                                    items={filteredItems}
                                    selectedItemId={selectedItemId}
                                    onSelect={setSelectedItemId}
                                    onMove={handleMoveItem}
                                    isDragEnabled={searchQuery.trim() === ''}
                                />
                            </div>
                        </DndContext>
                        <div className="detail-container">
                            {selectedItemId && items.find(i => i.id === selectedItemId) ? (
                                <TokenDetail
                                    item={items.find(i => i.id === selectedItemId)!}
                                    onUpdate={handleUpdateItem}
                                    onRemove={handleRemoveItem}
                                    maskSecrets={settings?.maskSecrets ?? true}
                                />
                            ) : (
                                <div className="empty-state">
                                    <p>Selecione uma conta</p>
                                </div>
                            )}
                        </div>
                    </div>
                ) : (
                    <div className={`main-area ${viewMode}-view`}>
                        {showSettings ? (
                            <Settings
                                onClose={() => setShowSettings(false)}
                                onExport={handleExport}
                                onExportEncrypted={handleExportEncrypted}
                                onImport={handleImport}
                                onImportEncrypted={handleImportEncrypted}
                                onImportAuthy={handleImportAuthy}
                                onImportGoogleAuth={handleImportGoogleAuth}
                                itemsCount={items.length}
                            />
                        ) : loading ? (
                            <div className="loading">Carregando...</div>
                        ) : items.length === 0 ? (
                            <div className="empty-state">
                                <p>Nenhum item 2FA adicionado ainda</p>
                                <button className="btn btn-primary" onClick={() => setSidebarMode('add')}>
                                    + Adicionar primeira conta
                                </button>
                            </div>
                        ) : filteredItems.length === 0 ? (
                            <div className="empty-state">
                                <p>Nenhuma conta encontrada para "{searchQuery}"</p>
                            </div>
                        ) : (
                            <DndContext
                                sensors={sensors}
                                collisionDetection={closestCenter}
                                onDragEnd={handleDragEnd}
                            >
                                <ItemList
                                    items={filteredItems}
                                    onRemove={handleRemoveItem}
                                    viewMode={viewMode}
                                    onUpdate={handleUpdateItem}
                                    onMove={handleMoveItem}
                                    isDragEnabled={searchQuery.trim() === ''}
                                    maskSecrets={settings?.maskSecrets ?? true}
                                />
                            </DndContext>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};

export default App;
