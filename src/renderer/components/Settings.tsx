import React, { useState, useEffect } from 'react';
import { AppSettings } from '../types';

interface SettingsProps {
    onClose: () => void;
}

const Settings: React.FC<SettingsProps> = ({ onClose }) => {
    const [settings, setSettings] = useState<AppSettings>({
        minimizeToTray: false,
        runOnStartup: false,
        autoLock: true,
        autoLockTimeout: 5,
        blurOnInactive: true
    });

    // Password Change State
    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [passwordMessage, setPasswordMessage] = useState('');
    const [passwordError, setPasswordError] = useState('');

    useEffect(() => {
        loadSettings();
    }, []);

    const loadSettings = async () => {
        const loaded = await window.electron.getSettings();
        setSettings(loaded);
    };

    const handleSettingChange = async (key: keyof AppSettings, value: any) => {
        const newSettings = { ...settings, [key]: value };
        setSettings(newSettings);
        await window.electron.setSettings(newSettings);
    };

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
        } catch (error) {
            setPasswordError('Erro ao alterar senha.');
        }
    };

    return (
        <div className="settings-container" style={{ padding: '20px', color: 'white' }}>
            <h2>Configurações</h2>

            <div className="settings-section" style={{ marginBottom: '30px' }}>
                <h3>Geral</h3>

                <div className="setting-item" style={{ marginBottom: '15px' }}>
                    <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
                        <input
                            type="checkbox"
                            checked={settings.minimizeToTray}
                            onChange={(e) => handleSettingChange('minimizeToTray', e.target.checked)}
                            style={{ marginRight: '10px' }}
                        />
                        Minimizar para a bandeja ao fechar
                    </label>
                </div>

                <div className="setting-item" style={{ marginBottom: '15px' }}>
                    <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
                        <input
                            type="checkbox"
                            checked={settings.runOnStartup}
                            onChange={(e) => handleSettingChange('runOnStartup', e.target.checked)}
                            style={{ marginRight: '10px' }}
                        />
                        Iniciar com o sistema
                    </label>
                </div>

                <div className="setting-item" style={{ marginBottom: '15px' }}>
                    <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
                        <input
                            type="checkbox"
                            checked={settings.autoLock}
                            onChange={(e) => handleSettingChange('autoLock', e.target.checked)}
                            style={{ marginRight: '10px' }}
                        />
                        Bloqueio automático por inatividade
                    </label>
                </div>

                {settings.autoLock && (
                    <div className="setting-item" style={{ marginLeft: '25px', marginBottom: '15px' }}>
                        <label>
                            Tempo para bloqueio (minutos):
                            <input
                                type="number"
                                min="1"
                                value={settings.autoLockTimeout}
                                onChange={(e) => handleSettingChange('autoLockTimeout', parseInt(e.target.value) || 1)}
                                style={{ marginLeft: '10px', width: '60px', padding: '5px', borderRadius: '4px', border: '1px solid #444', background: '#333', color: 'white' }}
                            />
                        </label>
                    </div>
                )}

                <div className="setting-item" style={{ marginBottom: '15px' }}>
                    <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
                        <input
                            type="checkbox"
                            checked={settings.blurOnInactive}
                            onChange={(e) => handleSettingChange('blurOnInactive', e.target.checked)}
                            style={{ marginRight: '10px' }}
                        />
                        Desfocar ao perder foco da janela (Segurança)
                    </label>
                </div>
            </div>

            <div className="settings-section" style={{ borderTop: '1px solid #444', paddingTop: '20px' }}>
                <h3>Segurança</h3>
                <form onSubmit={handleChangePassword} style={{ display: 'flex', flexDirection: 'column', gap: '10px', maxWidth: '300px' }}>
                    <h4>Alterar Senha Mestre</h4>

                    <input
                        type="password"
                        placeholder="Senha Atual"
                        value={currentPassword}
                        onChange={(e) => setCurrentPassword(e.target.value)}
                        style={{ padding: '8px', borderRadius: '4px', border: '1px solid #444', background: '#333', color: 'white' }}
                    />

                    <input
                        type="password"
                        placeholder="Nova Senha"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        style={{ padding: '8px', borderRadius: '4px', border: '1px solid #444', background: '#333', color: 'white' }}
                    />

                    <input
                        type="password"
                        placeholder="Confirmar Nova Senha"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        style={{ padding: '8px', borderRadius: '4px', border: '1px solid #444', background: '#333', color: 'white' }}
                    />

                    {passwordError && <div style={{ color: '#ff6b6b', fontSize: '0.9rem' }}>{passwordError}</div>}
                    {passwordMessage && <div style={{ color: '#51cf66', fontSize: '0.9rem' }}>{passwordMessage}</div>}

                    <button type="submit" className="btn btn-primary" disabled={!currentPassword || !newPassword}>
                        Atualizar Senha
                    </button>
                </form>
            </div>

             <button className="btn btn-secondary" onClick={onClose} style={{ marginTop: '30px' }}>
                Voltar
            </button>
        </div>
    );
};

export default Settings;
