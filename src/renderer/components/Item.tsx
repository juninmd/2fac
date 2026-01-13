import React, { useState, useEffect } from 'react';
import { TwoFAItem } from '../types';
import * as speakeasy from 'speakeasy';

interface TwoFAItemProps {
    item: TwoFAItem;
    onRemove: (id: string) => void;
}

const Item: React.FC<TwoFAItemProps> = ({ item, onRemove }) => {
    const [token, setToken] = useState<string>('');
    const [timeLeft, setTimeLeft] = useState<number>(30);
    const [copied, setCopied] = useState(false);

    useEffect(() => {
        generateToken();
        const interval = setInterval(() => {
            generateToken();
        }, 1000);

        return () => clearInterval(interval);
    }, [item]);

    const generateToken = () => {
        try {
            const newToken = speakeasy.totp({
                secret: item.secret,
                encoding: (item.encoding || 'base32') as 'base32' | 'base64' | 'ascii',
                algorithm: (item.algorithm || 'sha1').toLowerCase() as 'sha1' | 'sha256' | 'sha512',
                digits: item.digits || 6,
            });
            setToken(newToken);

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
        navigator.clipboard.writeText(token);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const handleRemove = () => {
        if (window.confirm(`Remover "${item.account}" de ${item.issuer}?`)) {
            onRemove(item.id);
        }
    };

    const progressPercentage = (timeLeft / (item.period || 30)) * 100;

    return (
        <div className="item">
            <div className="item-info">
                <div className="item-header">
                    <h3 className="item-account">{item.account}</h3>
                    <span className="item-issuer">{item.issuer}</span>
                </div>
                {item.description && <p className="item-description">{item.description}</p>}
            </div>

            <div className="item-token-section">
                <div className="token-display" onClick={copyToClipboard} title="Clique para copiar">
                    <span className="token">{token}</span>
                    {copied && <span className="copied-badge">✓ Copiado!</span>}
                </div>
                <div className="token-timer">
                    <div className="timer-bar" style={{ width: `${progressPercentage}%` }}></div>
                    <span className="timer-text">{timeLeft}s</span>
                </div>
            </div>

            <button className="btn btn-remove" onClick={handleRemove} title="Remover item">
                ✕
            </button>
        </div>
    );
};

export default Item;
