import React, { useState } from 'react';
import { Badge, Button, ConfirmButton, Dialog, TextField, useToast } from '@juninmd/sonido';
import { TwoFAItem } from '../types';
import { useToken } from '../hooks/useToken';
import { copyableCode } from '../utils/tokenUtils';
import { COLORS } from '../constants';
import IssuerIcon from './IssuerIcon';
import { TokenCode, TokenRing } from './TokenCode';

interface TokenDetailProps {
    item: TwoFAItem;
    onUpdate: (id: string, item: Partial<TwoFAItem>) => void;
    onRemove: (id: string) => void;
    maskSecrets: boolean;
}

const TokenDetail: React.FC<TokenDetailProps> = ({ item, onUpdate, onRemove, maskSecrets }) => {
    const { token, timeLeft, period } = useToken(item);
    const toast = useToast();
    const [isEditing, setIsEditing] = useState(false);
    const [editForm, setEditForm] = useState({ account: item.account, issuer: item.issuer, color: item.color ?? '#e23e3e', category: item.category ?? '' });
    const [isRevealed, setIsRevealed] = useState(false);

    React.useEffect(() => {
        setIsRevealed(false);
    }, [token]);

    // Sync form with item changes
    React.useEffect(() => {
        setEditForm({ account: item.account, issuer: item.issuer, color: item.color ?? '#e23e3e', category: item.category ?? '' });
    }, [item]);

    const copyToClipboard = () => {
        // "ERROR" is not a code: copying it and showing "Copiado!" would mislead.
        const rawToken = copyableCode(token);
        if (!rawToken) return;
        navigator.clipboard.writeText(rawToken);
        toast({ title: 'Copiado!', description: `${item.issuer} • ${item.account}`, tone: 'success', duration: 2000 });
    };

    React.useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (isEditing) return;

            if ((e.ctrlKey || e.metaKey) && (e.key === 'c' || e.key === 'C')) {
                const selection = window.getSelection();
                // Only copy token if no text is selected
                if (!selection || selection.toString().length === 0) {
                    e.preventDefault();
                    copyToClipboard();
                }
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [isEditing, token]);

    const handleEditSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onUpdate(item.id, editForm);
        setIsEditing(false);
    };

    if (isEditing) {
        return (
            <div className="token-detail editing">
                <Dialog
                    open
                    onClose={() => setIsEditing(false)}
                    title="Editar Conta"
                    description={item.account}
                >
                    <form onSubmit={handleEditSubmit} className="edit-form">
                        <TextField
                            label="Emissor"
                            value={editForm.issuer}
                            onChange={(e) => setEditForm({ ...editForm, issuer: e.target.value })}
                            autoFocus
                        />
                        <TextField
                            label="Conta"
                            value={editForm.account}
                            onChange={(e) => setEditForm({ ...editForm, account: e.target.value })}
                        />
                        <TextField
                            label="Categoria"
                            hint="ex: Trabalho, Pessoal"
                            value={editForm.category}
                            onChange={(e) => setEditForm({ ...editForm, category: e.target.value })}
                        />
                        <fieldset className="color-field">
                            <legend>Cor</legend>
                            <div className="color-grid">
                                {COLORS.map(color => (
                                    <button
                                        key={color}
                                        type="button"
                                        aria-label={`Cor ${color}`}
                                        aria-pressed={editForm.color === color}
                                        onClick={() => setEditForm(prev => ({ ...prev, color }))}
                                        className="color-swatch"
                                        style={{ backgroundColor: color }}
                                    />
                                ))}
                            </div>
                        </fieldset>
                        <div className="edit-actions">
                            <Button type="submit" variant="primary">Salvar Alterações</Button>
                            <Button type="button" variant="secondary" onClick={() => setIsEditing(false)}>Cancelar</Button>
                        </div>
                    </form>
                </Dialog>
            </div>
        );
    }

    return (
        <div className="token-detail">
            <div className="detail-header">
                <div className="detail-icon" style={{ backgroundColor: item.color || '#d32f2f' }}>
                    <IssuerIcon issuer={item.issuer} />
                </div>
                <div className="detail-info">
                    <h1 className="detail-issuer">
                        {item.issuer}
                        {item.category && <Badge tone="neutral">{item.category}</Badge>}
                    </h1>
                    <h2 className="detail-account">{item.account}</h2>
                </div>
            </div>

            <div className="detail-main">
                <div className="big-token-container" onClick={copyToClipboard}>
                    <TokenCode
                        token={token}
                        masked={maskSecrets && !isRevealed}
                        onReveal={() => setIsRevealed(true)}
                        size="lg"
                    />
                    <Button
                        size="icon"
                        variant="ghost"
                        aria-label="Copiar código"
                        iconStart="❐"
                        onClick={(e) => {
                            e.stopPropagation();
                            copyToClipboard();
                        }}
                    />
                </div>

                <TokenRing timeLeft={timeLeft} period={period} size={140} thickness={8} showSeconds />
            </div>

            <div className="detail-actions">
                <Button variant="secondary" iconStart="✎" onClick={() => setIsEditing(true)}>
                    Editar
                </Button>
                <ConfirmButton
                    appearance="inline"
                    className="detail-remove"
                    ask="Remover conta?"
                    confirmLabel="Remover"
                    cancelLabel="Cancelar"
                    onConfirm={() => onRemove(item.id)}
                    aria-label={`Remover ${item.account}`}
                >
                    ✕ Remover
                </ConfirmButton>
            </div>
        </div>
    );
};

export default TokenDetail;
