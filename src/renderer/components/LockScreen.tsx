import React, { useState, useEffect } from 'react';
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
        } else {
            const isValid = await window.electron.checkMasterPassword(password);
            if (isValid) {
                onUnlock();
            } else {
                setError('Senha incorreta');
            }
        }
    };

    if (loading) return <div className="lock-screen">Carregando...</div>;

    return (
        <div className="lock-screen">
            <div className="lock-container">
                <div className="lock-icon">🔐</div>
                <h2>{isSetup ? 'Configurar Senha Mestre' : 'Desbloquear 2FAC'}</h2>
                <p>{isSetup ? 'Crie uma senha para proteger seus tokens' : 'Digite sua senha para acessar'}</p>

                <form onSubmit={handleUnlock}>
                    <input
                        type="password"
                        placeholder="Senha"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="lock-input"
                        autoFocus
                    />

                    {isSetup && (
                        <input
                            type="password"
                            placeholder="Confirmar Senha"
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            className="lock-input"
                        />
                    )}

                    {error && <div className="lock-error">{error}</div>}

                    <button type="submit" className="lock-button">
                        {isSetup ? 'Criar Senha' : 'Desbloquear'}
                    </button>
                </form>
            </div>
        </div>
    );
};

export default LockScreen;
