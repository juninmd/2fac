import React, { useState, useEffect } from 'react';
import { TwoFAItem } from '../types';
import * as OTPAuth from 'otpauth';

interface TwoFAItemProps {
    item: TwoFAItem;
    onRemove: (id: string) => void;
    onUpdate: (id: string, item: Partial<TwoFAItem>) => void;
    viewMode: 'list' | 'grid';
}

const Item: React.FC<TwoFAItemProps> = ({ item, onRemove, onUpdate, viewMode }) => {
    const [token, setToken] = useState<string>('');
    const [timeLeft, setTimeLeft] = useState<number>(30);
    const [copied, setCopied] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [editForm, setEditForm] = useState({ account: item.account, issuer: item.issuer });

    useEffect(() => {
        generateToken();
        const interval = setInterval(() => {
            generateToken();
        }, 1000);

        return () => clearInterval(interval);
    }, [item]);

    const generateToken = () => {
        try {
            const totp = new OTPAuth.TOTP({
                issuer: item.issuer,
                label: item.account,
                algorithm: (item.algorithm || 'SHA1').toUpperCase(),
                digits: item.digits || 6,
                period: item.period || 30,
                secret: OTPAuth.Secret.fromBase32(item.secret),
            });

            const newToken = totp.generate();

            // Format token with space in middle if 6 digits
            if (newToken.length === 6) {
                setToken(newToken.slice(0, 3) + ' ' + newToken.slice(3));
            } else {
                setToken(newToken);
            }

            // Calculate seconds remaining
            const now = Math.floor(Date.now() / 1000);
            const timeStep = item.period || 30;
            const secondsIntoStep = now % timeStep;
            setTimeLeft(timeStep - secondsIntoStep);
        } catch (error) {
            console.error('Failed to generate token:', error);
            setToken('ERROR');
        }
    };

    const copyToClipboard = () => {
        const rawToken = token.replace(' ', '');
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

    const period = item.period || 30;
    const progressPercentage = (timeLeft / period) * 100;

    // Circular timer calculations
    const radius = 10;
    const circumference = 2 * Math.PI * radius;
    const strokeDashoffset = circumference - (timeLeft / period) * circumference;
    const isLowTime = timeLeft <= 5;
    const timerColor = isLowTime ? '#f44336' : '#d32f2f'; // Match primary color

    if (isEditing) {
        return (
            <div className={`item ${viewMode}-item editing`}>
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
                    <div className="edit-actions">
                        <button type="submit" className="btn btn-primary btn-sm">Salvar</button>
                        <button type="button" className="btn btn-secondary btn-sm" onClick={() => setIsEditing(false)}>Cancelar</button>
                    </div>
                </form>
            </div>
        );
    }

    return (
        <div className={`item ${viewMode}-item`} onClick={copyToClipboard}>
            {viewMode === 'list' && (
                 <div className="item-header">
                    <span className="item-issuer">{item.issuer}</span>
                    <h3 className="item-account" title={item.account}>{item.account}</h3>
                </div>
            )}

            {viewMode !== 'list' && (
                <div className="item-header">
                    <div style={{display:'flex', justifyContent:'space-between', alignItems:'center'}}>
                        <span className="item-issuer">{item.issuer}</span>
                    </div>
                    <h3 className="item-account" title={item.account}>{item.account}</h3>
                </div>
            )}

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
