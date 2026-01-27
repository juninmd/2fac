import React, { useState } from 'react';
import { TwoFAItem } from '../types';
import { useToken } from '../hooks/useToken';
import { COLORS } from '../constants';
import IssuerIcon from './IssuerIcon';

interface TokenDetailProps {
    item: TwoFAItem;
    onUpdate: (id: string, item: Partial<TwoFAItem>) => void;
    onRemove: (id: string) => void;
}

const TokenDetail: React.FC<TokenDetailProps> = ({ item, onUpdate, onRemove }) => {
    const { token, timeLeft, period } = useToken(item);
    const [copied, setCopied] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [editForm, setEditForm] = useState({ account: item.account, issuer: item.issuer, color: item.color || '#e23e3e' });

    // Sync form with item changes
    React.useEffect(() => {
        setEditForm({ account: item.account, issuer: item.issuer, color: item.color || '#e23e3e' });
    }, [item]);

    const copyToClipboard = () => {
        const rawToken = token.replace(' ', '');
        navigator.clipboard.writeText(rawToken);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const handleEditSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onUpdate(item.id, editForm);
        setIsEditing(false);
    };

    const handleDelete = () => {
        if (window.confirm(`Remover "${item.account}" de ${item.issuer}?`)) {
            onRemove(item.id);
        }
    };

    // Circular timer calculations
    const radius = 60;
    const circumference = 2 * Math.PI * radius;
    const strokeDashoffset = circumference - (timeLeft / period) * circumference;
    const isLowTime = timeLeft <= 5;
    const timerColor = isLowTime ? '#f44336' : (item.color || '#d32f2f');

    if (isEditing) {
        return (
            <div className="token-detail editing">
                <h2>Editar Conta</h2>
                <form onSubmit={handleEditSubmit} className="edit-form">
                    <div className="form-group">
                        <label>Emissor</label>
                        <input
                            type="text"
                            value={editForm.issuer}
                            onChange={(e) => setEditForm({...editForm, issuer: e.target.value})}
                            autoFocus
                        />
                    </div>
                    <div className="form-group">
                        <label>Conta</label>
                        <input
                            type="text"
                            value={editForm.account}
                            onChange={(e) => setEditForm({...editForm, account: e.target.value})}
                        />
                    </div>

                    <div className="form-group">
                        <label>Cor</label>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(10, 1fr)', gap: '8px' }}>
                            {COLORS.map(color => (
                                <div
                                    key={color}
                                    onClick={() => setEditForm(prev => ({ ...prev, color }))}
                                    style={{
                                        backgroundColor: color,
                                        width: '100%',
                                        paddingTop: '100%',
                                        borderRadius: '4px',
                                        cursor: 'pointer',
                                        border: editForm.color === color ? '2px solid white' : '1px solid transparent',
                                        boxShadow: editForm.color === color ? '0 0 5px rgba(255,255,255,0.5)' : 'none'
                                    }}
                                />
                            ))}
                        </div>
                    </div>

                    <div className="edit-actions">
                        <button type="submit" className="btn btn-primary">Salvar Alterações</button>
                        <button type="button" className="btn btn-secondary" onClick={() => setIsEditing(false)}>Cancelar</button>
                    </div>
                </form>
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
                    <h1 className="detail-issuer">{item.issuer}</h1>
                    <h2 className="detail-account">{item.account}</h2>
                </div>
            </div>

            <div className="detail-main">
                <div className="big-token-container" onClick={copyToClipboard}>
                    <span className="big-token">{token}</span>
                    <button className="copy-btn" title="Copiar">
                        {copied ? '✓' : '❐'}
                    </button>
                    {copied && <div className="detail-copied-toast">Copiado!</div>}
                </div>

                <div className="big-timer">
                    <svg width="140" height="140" viewBox="0 0 140 140">
                        <circle
                            stroke="rgba(255,255,255,0.05)"
                            strokeWidth="8"
                            fill="transparent"
                            r={radius}
                            cx="70"
                            cy="70"
                        />
                        <circle
                            stroke={timerColor}
                            strokeWidth="8"
                            fill="transparent"
                            r={radius}
                            cx="70"
                            cy="70"
                            style={{
                                strokeDasharray: circumference,
                                strokeDashoffset: strokeDashoffset,
                                transition: 'stroke-dashoffset 1s linear, stroke 0.3s ease'
                            }}
                            transform="rotate(-90 70 70)"
                        />
                        <text x="50%" y="50%" textAnchor="middle" dy=".3em" fill="#fff" fontSize="24px" fontWeight="bold">
                            {timeLeft}s
                        </text>
                    </svg>
                </div>
            </div>

            <div className="detail-actions">
                <button className="btn btn-secondary" onClick={() => setIsEditing(true)}>
                    ✎ Editar
                </button>
                <button className="btn btn-secondary delete-btn" onClick={handleDelete}>
                    ✕ Remover
                </button>
            </div>
        </div>
    );
};

export default TokenDetail;
