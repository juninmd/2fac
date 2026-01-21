import React, { useState, useEffect } from 'react';
import { AppSettings } from '../types';

interface SettingsProps {
    onClose: () => void;
    onExport: () => void;
    onExportEncrypted: () => void;
    onImport: () => void;
    onImportEncrypted: () => void;
    onImportAuthy: () => void;
}

const Settings: React.FC<SettingsProps> = ({
    onClose,
    onExport,
    onExportEncrypted,
    onImport,
    onImportEncrypted,
    onImportAuthy
}) => {
    const [settings, setSettings] = useState<AppSettings>({
        minimizeToTray: false,
        runOnStartup: false,
        autoLock: true,
        autoLockTimeout: 5,
        blurOnInactive: true
    });

    const [activeTab, setActiveTab] = useState<'general' | 'security' | 'data' | 'about'>('general');

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

    const renderTabs = () => (
        <div className="settings-tabs">
            <button
                className={`tab-btn ${activeTab === 'general' ? 'active' : ''}`}
                onClick={() => setActiveTab('general')}
            >
                Geral
            </button>
            <button
                className={`tab-btn ${activeTab === 'security' ? 'active' : ''}`}
                onClick={() => setActiveTab('security')}
            >
                Segurança
            </button>
            <button
                className={`tab-btn ${activeTab === 'data' ? 'active' : ''}`}
                onClick={() => setActiveTab('data')}
            >
                Dados
            </button>
            <button
                className={`tab-btn ${activeTab === 'about' ? 'active' : ''}`}
                onClick={() => setActiveTab('about')}
            >
                Sobre
            </button>
        </div>
    );

    return (
        <div className="settings-container" style={{ padding: '20px', color: 'white', display: 'flex', flexDirection: 'column', height: '100%' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <h2 style={{ margin: 0 }}>Configurações</h2>
                <button className="btn-icon" onClick={onClose} title="Fechar">✕</button>
            </div>

            {renderTabs()}

            <div className="settings-content" style={{ flex: 1, overflowY: 'auto', padding: '10px 0' }}>

                {activeTab === 'general' && (
                    <div className="settings-section">
                        <h3>Comportamento</h3>

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
                    </div>
                )}

                {activeTab === 'security' && (
                    <div className="settings-section">
                         <h3>Bloqueio e Privacidade</h3>
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
                                Desfocar ao perder foco da janela
                            </label>
                        </div>

                        <div style={{ borderTop: '1px solid #444', paddingTop: '20px', marginTop: '20px' }}>
                            <h3>Senha Mestre</h3>
                            <form onSubmit={handleChangePassword} style={{ display: 'flex', flexDirection: 'column', gap: '10px', maxWidth: '300px' }}>
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
                    </div>
                )}

                {activeTab === 'data' && (
                    <div className="settings-section">
                        <h3>Backups e Importação</h3>
                        <p style={{ color: '#aaa', fontSize: '0.9rem', marginBottom: '20px' }}>
                            Como este aplicativo não utiliza nuvem, é sua responsabilidade manter backups dos seus dados.
                        </p>

                        <div className="data-actions-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                            <div className="card" style={{ background: '#333', padding: '15px', borderRadius: '4px' }}>
                                <h4>Criptografado (Recomendado)</h4>
                                <p style={{ fontSize: '0.8rem', color: '#ccc', marginBottom: '10px' }}>
                                    Backup protegido por senha. Seguro para armazenar.
                                </p>
                                <div style={{ display: 'flex', gap: '10px', flexDirection: 'column' }}>
                                    <button className="btn btn-primary" onClick={onExportEncrypted}>
                                        🔒 Exportar Backup
                                    </button>
                                    <button className="btn btn-secondary" onClick={onImportEncrypted}>
                                        🔓 Restaurar Backup
                                    </button>
                                </div>
                            </div>

                            <div className="card" style={{ background: '#333', padding: '15px', borderRadius: '4px' }}>
                                <h4>Texto Plano (Inseguro)</h4>
                                <p style={{ fontSize: '0.8rem', color: '#ccc', marginBottom: '10px' }}>
                                    Arquivo JSON legível. <strong>Não compartilhe.</strong>
                                </p>
                                <div style={{ display: 'flex', gap: '10px', flexDirection: 'column' }}>
                                    <button className="btn btn-secondary" style={{ opacity: 0.8 }} onClick={onExport}>
                                        📥 Exportar JSON
                                    </button>
                                    <button className="btn btn-secondary" style={{ opacity: 0.8 }} onClick={onImport}>
                                        📤 Importar JSON
                                    </button>
                                </div>
                            </div>
                        </div>

                        <div style={{ marginTop: '20px', paddingTop: '20px', borderTop: '1px solid #444' }}>
                            <h3>Migração</h3>
                            <div className="card" style={{ background: '#333', padding: '15px', borderRadius: '4px' }}>
                                <h4>Authy</h4>
                                <p style={{ fontSize: '0.8rem', color: '#ccc', marginBottom: '10px' }}>
                                    Importe dados de um backup exportado do Authy.
                                </p>
                                <button className="btn btn-secondary" onClick={onImportAuthy}>
                                    📱 Importar do Authy
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {activeTab === 'about' && (
                    <div className="settings-section">
                        <h3>Sobre o 2FAC</h3>
                        <p>Versão 1.0.0</p>
                        <p style={{ marginTop: '10px' }}>
                            Um autenticador de desktop focado em privacidade e segurança local.
                        </p>
                        <ul style={{ marginTop: '10px', paddingLeft: '20px', color: '#ccc' }}>
                            <li>Armazenamento 100% Local</li>
                            <li>Criptografia AES-256</li>
                            <li>Sem rastreamento ou nuvem</li>
                            <li>Código Aberto</li>
                        </ul>
                    </div>
                )}
            </div>

            <div style={{ paddingTop: '10px', borderTop: '1px solid #444', display: 'flex', justifyContent: 'flex-end' }}>
                <button className="btn btn-secondary" onClick={onClose}>
                    Fechar
                </button>
            </div>
        </div>
    );
};

export default Settings;
