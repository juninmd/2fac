import React, { useEffect, useState } from 'react';
import { TwoFAItem } from '../types';
import ItemList from './ItemList';
import AddItemForm from './AddItemForm';
import LockScreen from './LockScreen';
import Settings from './Settings';
import './App.css';

const App: React.FC = () => {
    const [items, setItems] = useState<TwoFAItem[]>([]);
    const [filteredItems, setFilteredItems] = useState<TwoFAItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [isLocked, setIsLocked] = useState(true);
    const [viewMode, setViewMode] = useState<'list' | 'grid'>('grid');
    const [searchQuery, setSearchQuery] = useState('');
    const [sidebarMode, setSidebarMode] = useState<'none' | 'add' | 'settings'>('none');
    const [showSettings, setShowSettings] = useState(false);
    const [settings, setSettings] = useState<any>(null);
    const [isWindowFocused, setIsWindowFocused] = useState(true);

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
        loadSettings();
    }, [showSettings]); // Reload settings when settings view closes

    const loadSettings = async () => {
        const loaded = await window.electron.getSettings();
        setSettings(loaded);
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

    const handleExport = async () => {
        try {
            const result = await window.electron.export2FA();
            if (result.success) {
                alert(`Backup exportado com sucesso: ${result.path}`);
            } else {
                // alert('Exportação cancelada');
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
            } else {
                // alert('Importação cancelada');
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

    if (isLocked) {
        return <LockScreen onUnlock={handleUnlock} />;
    }

    return (
        <div className="app">
            <header className="app-header">
                <div className="header-left">
                    <h1>
                        <span style={{ fontSize: '24px' }}>🔐</span> 2FAC
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
                        onClick={() => setSidebarMode(sidebarMode === 'settings' ? 'none' : 'settings')}
                        title="Gerenciamento"
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

                {sidebarMode !== 'none' && (
                    <div className="sidebar">
                        {sidebarMode === 'add' && (
                            <div className="sidebar-section">
                                <h3>Adicionar Conta</h3>
                                <AddItemForm onAdd={(item) => {
                                    handleAddItem(item);
                                    setSidebarMode('none');
                                }} />
                            </div>
                        )}

                        {sidebarMode === 'settings' && (
                            <div className="sidebar-section">
                                <h3>Gerenciamento</h3>
                                <div className="sidebar-buttons">
                                    <button className="btn btn-secondary full-width" onClick={() => { setShowSettings(true); setSidebarMode('none'); }}>
                                        ⚙ Preferências
                                    </button>
                                    <button className="btn btn-secondary full-width" onClick={handleExportEncrypted}>
                                        🔒 Exportar Criptografado
                                    </button>
                                    <button className="btn btn-secondary full-width" onClick={handleImportEncrypted}>
                                        🔓 Importar Criptografado
                                    </button>
                                    <button className="btn btn-secondary full-width" style={{opacity: 0.7}} onClick={handleExport}>
                                        📥 Exportar JSON (Inseguro)
                                    </button>
                                    <button className="btn btn-secondary full-width" style={{opacity: 0.7}} onClick={handleImport}>
                                        📤 Importar JSON
                                    </button>
                                    <button className="btn btn-secondary full-width" onClick={handleImportAuthy}>
                                        📱 Importar Authy
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                )}

                <div className={`main-area ${viewMode}-view`}>
                    {showSettings ? (
                        <Settings onClose={() => setShowSettings(false)} />
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
                        <ItemList
                            items={filteredItems}
                            onRemove={handleRemoveItem}
                            viewMode={viewMode}
                            onUpdate={handleUpdateItem}
                            onMove={handleMoveItem}
                        />
                    )}
                </div>
            </div>
        </div>
    );
};

export default App;
