import React, { useState, useEffect } from 'react';
import { Button, Spinner, TextField } from '@juninmd/sonido';
import './LockScreen.css';

interface LockScreenProps {
    onUnlock: () => void;
}

const LockScreen: React.FC<LockScreenProps> = ({ onUnlock }) => {
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [isSetup, setIsSetup] = useState(false);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        checkSetup();
    }, []);

    const checkSetup = async () => {
        const hasPassword = await window.electron.hasMasterPassword();
        setIsSetup(!hasPassword);
        setLoading(false);
    };

    const handleUnlock = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        if (isSetup) {
            if (password !== confirmPassword) {
                setError('As senhas não conferem');
                return;
            }
            if (password.length < 4) {
                setError('A senha deve ter pelo menos 4 caracteres');
                return;
            }
            await window.electron.setMasterPassword(password);
            onUnlock();
        } else if (await window.electron.checkMasterPassword(password)) {
            onUnlock();
        } else {
            setError('Senha incorreta');
        }
    };

    if (loading) return <div className="lock-screen"><Spinner size={28} label="Carregando..." /></div>;

    return (
        <div className="lock-screen">
            <div className="lock-container">
                <div className="lock-icon" aria-hidden>🔐</div>
                <h2>{isSetup ? 'Configurar Senha Mestre' : 'Desbloquear 2FAC'}</h2>
                <p>{isSetup ? 'Crie uma senha para proteger seus tokens' : 'Digite sua senha para acessar'}</p>

                <form onSubmit={handleUnlock} className="lock-form">
                    <TextField
                        label="Senha"
                        type="password"
                        placeholder="Senha"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        autoFocus
                    />

                    {isSetup && (
                        <TextField
                            label="Confirmar Senha"
                            type="password"
                            placeholder="Confirmar Senha"
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                        />
                    )}

                    {error && <div className="lock-error" role="alert">{error}</div>}

                    <Button type="submit" variant="primary" size="lg" className="full-width">
                        {isSetup ? 'Criar Senha' : 'Desbloquear'}
                    </Button>
                </form>
            </div>
        </div>
    );
};

export default LockScreen;
