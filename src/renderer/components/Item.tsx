import React, { useState } from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Badge, Button, ConfirmButton, Dialog, TextField, useToast } from '@juninmd/sonido';
import { TwoFAItem } from '../types';
import { useToken } from '../hooks/useToken';
import { copyableCode } from '../utils/tokenUtils';
import { COLORS } from '../constants';
import IssuerIcon from './IssuerIcon';
import { TokenCode, TokenRing } from './TokenCode';

interface TwoFAItemProps {
    item: TwoFAItem;
    onRemove: (id: string) => void;
    onUpdate: (id: string, item: Partial<TwoFAItem>) => void;
    onMove: (id: string, direction: 'up' | 'down') => void;
    viewMode: 'list' | 'grid';
    isFirst: boolean;
    isLast: boolean;
    isDragEnabled: boolean;
    maskSecrets: boolean;
}

const Item: React.FC<TwoFAItemProps> = ({ item, onRemove, onUpdate, onMove, viewMode, isFirst, isLast, isDragEnabled, maskSecrets }) => {
    const { token, timeLeft, period } = useToken(item);
    const toast = useToast();
    const [isEditing, setIsEditing] = useState(false);
    const [editForm, setEditForm] = useState({ account: item.account, issuer: item.issuer, color: item.color ?? '#e23e3e' });
    const [isRevealed, setIsRevealed] = useState(false);

    React.useEffect(() => {
        setIsRevealed(false);
    }, [token]);

    const copyToClipboard = () => {
        const rawToken = copyableCode(token);
        if (!rawToken) return;
        navigator.clipboard.writeText(rawToken).then(
            () => toast({ title: 'Copiado!', description: `${item.issuer} • ${item.account}`, tone: 'success', duration: 2000 }),
            () => console.error('Falha ao copiar o código para a área de transferência'),
        );
    };

    const handleEditSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onUpdate(item.id, editForm);
        setIsEditing(false);
    };

    const itemColor = item.color || '#e23e3e';

    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging,
    } = useSortable({ id: item.id, disabled: !isDragEnabled });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        '--issuer-color': itemColor,
        opacity: isDragging ? 0.5 : 1,
        zIndex: isDragging ? 999 : 'auto',
    } as React.CSSProperties;

    if (isEditing) {
        return (
            <div
                className={`item ${viewMode}-item editing`}
                style={{ '--issuer-color': itemColor } as React.CSSProperties}
            >
                <Dialog
                    open
                    onClose={() => setIsEditing(false)}
                    title="Editar conta"
                    description={item.issuer}
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
                            <Button type="submit" variant="primary" size="sm">Salvar</Button>
                            <Button type="button" variant="secondary" size="sm" onClick={() => setIsEditing(false)}>Cancelar</Button>
                        </div>
                    </form>
                </Dialog>
            </div>
        );
    }

    return (
        <div
            ref={setNodeRef}
            style={style}
            {...attributes}
            {...listeners}
            className={`item ${viewMode}-item ${isDragging ? 'dragging' : ''} ${isDragEnabled ? 'draggable' : ''}`}
            onClick={copyToClipboard}
        >
            <div className="item-icon-container">
                <IssuerIcon issuer={item.issuer} />
            </div>
            <div className="item-header">
                <span className="item-issuer">{item.issuer}</span>
                <h3 className="item-account" title={item.account}>{item.account}</h3>
                {item.category && <Badge tone="neutral">{item.category}</Badge>}
            </div>

            <div className="token-display">
                <TokenCode
                    token={token}
                    masked={maskSecrets && !isRevealed}
                    onReveal={() => setIsRevealed(true)}
                />
                <TokenRing timeLeft={timeLeft} period={period} />
            </div>

            <div className="item-actions">
                {!isFirst && (
                    <Button
                        size="xs"
                        variant="secondary"
                        appearance="outline"
                        onClick={(e) => { e.stopPropagation(); onMove(item.id, 'up'); }}
                        aria-label="Mover para cima"
                    >
                        ↑
                    </Button>
                )}
                {!isLast && (
                    <Button
                        size="xs"
                        variant="secondary"
                        appearance="outline"
                        onClick={(e) => { e.stopPropagation(); onMove(item.id, 'down'); }}
                        aria-label="Mover para baixo"
                    >
                        ↓
                    </Button>
                )}
                <Button
                    size="xs"
                    variant="ghost"
                    onClick={(e) => { e.stopPropagation(); setIsEditing(true); }}
                    aria-label={`Editar ${item.account}`}
                >
                    ✎
                </Button>
                <ConfirmButton
                    appearance="inline"
                    className="item-delete"
                    ask="Remover?"
                    confirmLabel="Remover"
                    cancelLabel="Cancelar"
                    onConfirm={() => onRemove(item.id)}
                    aria-label={`Remover ${item.account}`}
                >
                    ✕
                </ConfirmButton>
            </div>
        </div>
    );
};

export default Item;
