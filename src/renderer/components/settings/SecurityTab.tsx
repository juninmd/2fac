import React, { useState } from 'react';
import { Button, Card, Switch, TextField } from '@juninmd/sonido';
import type { SettingsTabProps } from '../Settings';

const SecurityTab: React.FC<SettingsTabProps> = ({ settings, onChange }) => {
    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [passwordMessage, setPasswordMessage] = useState('');
    const [passwordError, setPasswordError] = useState('');

    const handleChangePassword = async (e: React.FormEvent) => {
        e.preventDefault();
        setPasswordMessage('');
        setPasswordError('');

        if (newPassword !== confirmPassword) {
            setPasswordError('As novas senhas não conferem.');
            return;
        }

        if (newPassword.length < 4) {
            setPasswordError('A nova senha deve ter pelo menos 4 caracteres.');
            return;
        }

        try {
            const isValid = await window.electron.checkMasterPassword(currentPassword);
            if (!isValid) {
                setPasswordError('Senha atual incorreta.');
                return;
            }

            await window.electron.setMasterPassword(newPassword);
            setPasswordMessage('Senha alterada com sucesso!');
            setCurrentPassword('');
            setNewPassword('');
            setConfirmPassword('');
        } catch {
            setPasswordError('Erro ao alterar senha.');
        }
    };

    return (
        <>
            <Card surface="solid" padding="md" className="settings-section">
                <h3>Bloqueio e Privacidade</h3>
                <Switch
                    checked={settings.autoLock}
                    onChange={(checked) => void onChange('autoLock', checked)}
                    label="Bloqueio automático por inatividade"
                />
                {settings.autoLock && (
                    <div className="setting-item setting-item--nested">
                        <TextField
                            label="Tempo para bloqueio (minutos)"
                            type="number"
                            min={1}
                            value={settings.autoLockTimeout}
                            onChange={(e) => void onChange('autoLockTimeout', parseInt(e.target.value) || 1)}
                        />
                    </div>
                )}
                <Switch
                    checked={settings.blurOnInactive}
                    onChange={(checked) => void onChange('blurOnInactive', checked)}
                    label="Desfocar ao perder foco da janela"
                />
                <Switch
                    checked={settings.maskSecrets}
                    onChange={(checked) => void onChange('maskSecrets', checked)}
                    label="Ocultar códigos 2FA na interface"
                />
            </Card>

            <Card surface="solid" padding="md" className="settings-section">
                <h3>Senha Mestre</h3>
                <form onSubmit={handleChangePassword} className="password-form">
                    <TextField
                        label="Senha Atual"
                        type="password"
                        placeholder="Senha Atual"
                        value={currentPassword}
                        onChange={(e) => setCurrentPassword(e.target.value)}
                    />
                    <TextField
                        label="Nova Senha"
                        type="password"
                        placeholder="Nova Senha"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                    />
                    <TextField
                        label="Confirmar Nova Senha"
                        type="password"
                        placeholder="Confirmar Nova Senha"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                    />

                    {passwordError && <div className="error-message" role="alert">{passwordError}</div>}
                    {passwordMessage && <div className="success-message">{passwordMessage}</div>}

                    <Button type="submit" variant="primary" disabled={!currentPassword || !newPassword}>
                        Atualizar Senha
                    </Button>
                </form>
            </Card>
        </>
    );
};

export default SecurityTab;
