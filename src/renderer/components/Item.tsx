import React, { useState } from 'react';
import { TwoFAItem } from '../types';
import { useToken } from '../hooks/useToken';
import { COLORS } from '../constants';
import IssuerIcon from './IssuerIcon';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

interface TwoFAItemProps {
    item: TwoFAItem;
    onRemove: (id: string) => void;
    onUpdate: (id: string, item: Partial<TwoFAItem>) => void;
    onMove: (id: string, direction: 'up' | 'down') => void;
    viewMode: 'list' | 'grid';
    isFirst: boolean;
    isLast: boolean;
    isDragEnabled: boolean;
}

const Item: React.FC<TwoFAItemProps> = ({ item, onRemove, onUpdate, onMove, viewMode, isFirst, isLast, isDragEnabled }) => {
    const { token, timeLeft, period } = useToken(item);
    const [copied, setCopied] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [editForm, setEditForm] = useState({ account: item.account, issuer: item.issuer, color: item.color || '#e23e3e' });

    const copyToClipboard = () => {
        const rawToken = token.replace(/\s/g, '');
        navigator.clipboard.writeText(rawToken);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const handleRemove = (e: React.MouseEvent) => {
        e.stopPropagation();
        if (window.confirm(`Remover "${item.account}" de ${item.issuer}?`)) {
            onRemove(item.id);
        }
    };

    const handleEditSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onUpdate(item.id, editForm);
        setIsEditing(false);
    };

    // Circular timer calculations
    const radius = 10;
    const circumference = 2 * Math.PI * radius;
    const strokeDashoffset = circumference - (timeLeft / period) * circumference;
    const isLowTime = timeLeft <= 5;
    const timerColor = isLowTime ? '#f44336' : '#d32f2f'; // Match primary color

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
                <form onSubmit={handleEditSubmit} className="edit-form">
                    <div className="form-group">
                        <input
                            type="text"
                            value={editForm.issuer}
                            onChange={(e) => setEditForm({...editForm, issuer: e.target.value})}
                            placeholder="Emissor"
                            autoFocus
                        />
                    </div>
                    <div className="form-group">
                        <input
                            type="text"
                            value={editForm.account}
                            onChange={(e) => setEditForm({...editForm, account: e.target.value})}
                            placeholder="Conta"
                        />
                    </div>

                    <div className="form-group">
                        <label style={{fontSize: '0.8rem', color: '#aaa', marginBottom: '5px'}}>Cor</label>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(10, 1fr)', gap: '3px' }}>
                            {COLORS.map(color => (
                                <div
                                    key={color}
                                    onClick={() => setEditForm(prev => ({ ...prev, color }))}
                                    style={{
                                        backgroundColor: color,
                                        width: '100%',
                                        paddingTop: '100%',
                                        borderRadius: '2px',
                                        cursor: 'pointer',
                                        border: editForm.color === color ? '2px solid white' : '1px solid transparent',
                                    }}
                                />
                            ))}
                        </div>
                    </div>

                    <div className="edit-actions">
                        <button type="submit" className="btn btn-primary btn-sm">Salvar</button>
                        <button type="button" className="btn btn-secondary btn-sm" onClick={() => setIsEditing(false)}>Cancelar</button>
                    </div>
                </form>
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
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span className="item-issuer">{item.issuer}</span>
                </div>
                <h3 className="item-account" title={item.account}>{item.account}</h3>
            </div>

            <div className="token-display">
                <span className="token">{token}</span>
                <div className="circular-timer">
                    <svg width="24" height="24" viewBox="0 0 24 24">
                        <circle
                            stroke="rgba(255,255,255,0.1)"
                            strokeWidth="2"
                            fill="transparent"
                            r={radius}
                            cx="12"
                            cy="12"
                        />
                        <circle
                            stroke={timerColor}
                            strokeWidth="2"
                            fill="transparent"
                            r={radius}
                            cx="12"
                            cy="12"
                            style={{
                                strokeDasharray: circumference,
                                strokeDashoffset: strokeDashoffset,
                                transition: 'stroke-dashoffset 1s linear, stroke 0.3s ease'
                            }}
                            transform="rotate(-90 12 12)"
                        />
                    </svg>
                </div>
            </div>

            <div className="item-actions">
                {!isFirst && (
                    <button className="btn-icon-small" onClick={(e) => { e.stopPropagation(); onMove(item.id, 'up'); }} title="Mover para Cima">
                        ↑
                    </button>
                )}
                {!isLast && (
                    <button className="btn-icon-small" onClick={(e) => { e.stopPropagation(); onMove(item.id, 'down'); }} title="Mover para Baixo">
                        ↓
                    </button>
                )}
                <button className="btn-icon-small" onClick={(e) => { e.stopPropagation(); setIsEditing(true); }} title="Editar">
                    ✎
                </button>
                <button className="btn-icon-small delete" onClick={handleRemove} title="Remover">
                    ✕
                </button>
            </div>

            {copied && <div className="copied-overlay">Copiado!</div>}
        </div>
    );
};

export default Item;
