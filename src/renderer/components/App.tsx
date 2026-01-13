import React, { useEffect, useState } from 'react';
import { TwoFAItem } from '../types';
import ItemList from './ItemList';
import AddItemForm from './AddItemForm';
import './App.css';

const App: React.FC = () => {
    const [items, setItems] = useState<TwoFAItem[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadItems();
    }, []);

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

    return (
        <div className="app">
            <header className="app-header">
                <h1>🔐 2FAC</h1>
                <p>Gerenciador de Autenticação de Dois Fatores</p>
            </header>

            <div className="app-controls">
                <button className="btn btn-primary" onClick={handleExport}>
                    📥 Exportar Backup
                </button>
                <button className="btn btn-secondary" onClick={handleImport}>
                    📤 Importar JSON
                </button>
                <button className="btn btn-success" onClick={handleImportAuthy}>
                    📱 Importar Authy
                </button>
            </div>

            <div className="app-content">
                <div className="sidebar">
                    <AddItemForm onAdd={handleAddItem} />
                </div>

                <div className="main-area">
                    {loading ? (
                        <div className="loading">Carregando...</div>
                    ) : items.length === 0 ? (
                        <div className="empty-state">
                            <p>Nenhum item 2FA adicionado ainda</p>
                            <p className="hint">Adicione um novo item usando o formulário ao lado</p>
                        </div>
                    ) : (
                        <ItemList items={items} onRemove={handleRemoveItem} />
                    )}
                </div>
            </div>
        </div>
    );
};

export default App;
