import React, { useEffect, useState } from 'react';
import { TwoFAItem } from '../types';
import ItemList from './ItemList';
import AddItemForm from './AddItemForm';
import LockScreen from './LockScreen';
import './App.css';

const App: React.FC = () => {
    const [items, setItems] = useState<TwoFAItem[]>([]);
    const [filteredItems, setFilteredItems] = useState<TwoFAItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [isLocked, setIsLocked] = useState(true);
    const [viewMode, setViewMode] = useState<'list' | 'grid'>('grid');
    const [searchQuery, setSearchQuery] = useState('');
    const [showSidebar, setShowSidebar] = useState(false);

    useEffect(() => {
        // We'll wait for the lock screen to unlock before loading items
    }, []);

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

    const handleExport = async () => {
        try {
            const result = await window.electron.export2FA();
            if (result.success) {
                alert(`Backup exportado com sucesso: ${result.path}`);
            } else {
                alert('Exportação cancelada');
            }
        } catch (error) {
            console.error('Failed to export:', error);
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
                alert('Importação cancelada');
            }
        } catch (error) {
            console.error('Failed to import:', error);
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
                        onClick={() => setViewMode(viewMode === 'grid' ? 'list' : 'grid')}
                        title={viewMode === 'grid' ? 'Ver em Lista' : 'Ver em Grade'}
                    >
                        {viewMode === 'grid' ? '☰' : '▦'}
                    </button>
                    <button
                        className="btn-icon"
                        onClick={() => setShowSidebar(!showSidebar)}
                        title="Adicionar Conta / Configurações"
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
                {showSidebar && (
                    <div className="sidebar">
                        <div className="sidebar-section">
                            <h3>Adicionar Conta</h3>
                            <AddItemForm onAdd={(item) => {
                                handleAddItem(item);
                                setShowSidebar(false);
                            }} />
                        </div>

                        <div className="sidebar-section">
                            <h3>Gerenciamento</h3>
                            <div className="sidebar-buttons">
                                <button className="btn btn-secondary full-width" onClick={handleExport}>
                                    📥 Exportar Backup
                                </button>
                                <button className="btn btn-secondary full-width" onClick={handleImport}>
                                    📤 Importar JSON
                                </button>
                                <button className="btn btn-secondary full-width" onClick={handleImportAuthy}>
                                    📱 Importar Authy
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                <div className={`main-area ${viewMode}-view`}>
                    {loading ? (
                        <div className="loading">Carregando...</div>
                    ) : items.length === 0 ? (
                        <div className="empty-state">
                            <p>Nenhum item 2FA adicionado ainda</p>
                            <button className="btn btn-primary" onClick={() => setShowSidebar(true)}>
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
                        />
                    )}
                </div>
            </div>
        </div>
    );
};

export default App;
