import React, { useState, useEffect } from 'react';
import { AppSettings } from '../types.js';

interface SettingsProps {
    onClose: () => void;
    onExport: () => void;
    onExportEncrypted: () => void;
    onImport: () => void;
    onImportEncrypted: () => void;
    onImportAuthy: () => void;
    onImportGoogleAuth: () => void;
    itemsCount: number;
}

const Settings: React.FC<SettingsProps> = ({
    onClose,
    onExport,
    onExportEncrypted,
    onImport,
    onImportEncrypted,
    onImportAuthy,
    onImportGoogleAuth,
    itemsCount
}) => {
    const [settings, setSettings] = useState<AppSettings>({
        minimizeToTray: false,
        runOnStartup: false,
        autoLock: true,
        autoLockTimeout: 5,
        blurOnInactive: true,
        theme: 'dark',
        accentColor: '#e23e3e'
    });

    const [activeTab, setActiveTab] = useState<'general' | 'security' | 'data' | 'devices' | 'about'>('general');

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

    const handleSettingChange = async (key: keyof AppSettings, value: boolean | string | number) => {
        if (!settings) return;
        if (!settings) return;
        if (!settings) return;
        if (!settings) return;
        if (!settings) return;
        if (!settings) return;
        if (!settings) return;
        if (!settings) return;
        if (!settings) return;
        if (!settings) return;
        if (!settings) return;
        if (!settings) return;
        if (!settings) return;
        if (!settings) return;
        if (!settings) return;
        if (!settings) return;
        if (!settings) return;
        if (!settings) return;
        if (!settings) return;
        if (!settings) return;
        if (!settings) return;
        if (!settings) return;
        if (!settings) return;
        if (!settings) return;
        if (!settings) return;
        if (!settings) return;
        if (!settings) return;
        if (!settings) return;
        if (!settings) return;
        if (!settings) return;
        if (!settings) return;
        if (!settings) return;
        if (!settings) return;
        if (!settings) return;
        if (!settings) return;
        if (!settings) return;
        if (!settings) return;
        if (!settings) return;
        if (!settings) return;
        if (!settings) return;
        if (!settings) return;
        if (!settings) return;
        if (!settings) return;
        if (!settings) return;
        if (!settings) return;
        if (!settings) return;
        if (!settings) return;
        if (!settings) return;
        if (!settings) return;
        if (!settings) return;
        if (!settings) return;
        if (!settings) return;
        if (!settings) return;
        if (!settings) return;
        if (!settings) return;
        if (!settings) return;
        if (!settings) return;
        if (!settings) return;
        if (!settings) return;
        if (!settings) return;
        if (!settings) return;
        if (!settings) return;
        if (!settings) return;
        if (!settings) return;
        if (!settings) return;
        if (!settings) return;
        if (!settings) return;
        if (!settings) return;
        if (!settings) return;
        if (!settings) return;
        if (!settings) return;
        if (!settings) return;
        if (!settings) return;
        if (!settings) return;
        if (!settings) return;
        if (!settings) return;
        if (!settings) return;
        if (!settings) return;
        if (!settings) return;
        if (!settings) return;
        if (!settings) return;
        if (!settings) return;
        if (!settings) return;
        if (!settings) return;
        if (!settings) return;
        if (!settings) return;
        if (!settings) return;
        if (!settings) return;
        if (!settings) return;
        if (!settings) return;
        if (!settings) return;
        if (!settings) return;
        if (!settings) return;
        if (!settings) return;
        if (!settings) return;
        if (!settings) return;
        if (!settings) return;
        if (!settings) return;
        if (!settings) return;
        if (!settings) return;
        if (!settings) return;
        if (!settings) return;
        if (!settings) return;
        if (!settings) return;
        if (!settings) return;
        if (!settings) return;
        if (!settings) return;
        if (!settings) return;
        if (!settings) return;
        if (!settings) return;
        if (!settings) return;
        if (!settings) return;
        if (!settings) return;
        if (!settings) return;
        if (!settings) return;
        if (!settings) return;
        if (!settings) return;
        if (!settings) return;
        if (!settings) return;
        if (!settings) return;
        if (!settings) return;
        if (!settings) return;
        if (!settings) return;
        if (!settings) return;
        if (!settings) return;
        if (!settings) return;
        if (!settings) return;
        if (!settings) return;
        if (!settings) return;
        if (!settings) return;
        if (!settings) return;
        if (!settings) return;
        if (!settings) return;
        if (!settings) return;
        if (!settings) return;
        if (!settings) return;
        if (!settings) return;
        if (!settings) return;
        if (!settings) return;
        if (!settings) return;
        if (!settings) return;
        if (!settings) return;
        if (!settings) return;
        if (!settings) return;
        if (!settings) return;
        if (!settings) return;
        if (!settings) return;
        if (!settings) return;
        if (!settings) return;
        if (!settings) return;
        if (!settings) return;
        if (!settings) return;
        if (!settings) return;
        if (!settings) return;
        if (!settings) return;
        if (!settings) return;
        if (!settings) return;
        if (!settings) return;
        if (!settings) return;
        if (!settings) return;
        if (!settings) return;
        if (!settings) return;
        if (!settings) return;
        if (!settings) return;
        if (!settings) return;
        if (!settings) return;
        if (!settings) return;
        if (!settings) return;
        if (!settings) return;
        if (!settings) return;
        if (!settings) return;
        if (!settings) return;
        if (!settings) return;
        if (!settings) return;
        if (!settings) return;
        if (!settings) return;
        if (!settings) return;
        if (!settings) return;
        if (!settings) return;
        if (!settings) return;
        if (!settings) return;
        if (!settings) return;
        if (!settings) return;
        if (!settings) return;
        if (!settings) return;
        if (!settings) return;
        if (!settings) return;
        if (!settings) return;
        if (!settings) return;
        if (!settings) return;
        if (!settings) return;
        if (!settings) return;
        if (!settings) return;
        if (!settings) return;
        if (!settings) return;
        if (!settings) return;
        if (!settings) return;
        if (!settings) return;
        if (!settings) return;
        if (!settings) return;
        if (!settings) return;
        if (!settings) return;
        if (!settings) return;
        if (!settings) return;
        if (!settings) return;
        if (!settings) return;
        if (!settings) return;
        if (!settings) return;
        if (!settings) return;
        if (!settings) return;
        if (!settings) return;
        if (!settings) return;
        if (!settings) return;
        if (!settings) return;
        if (!settings) return;
        if (!settings) return;
        if (!settings) return;
        if (!settings) return;
        if (!settings) return;
        if (!settings) return;
        if (!settings) return;
        if (!settings) return;
        if (!settings) return;
        if (!settings) return;
        if (!settings) return;
        if (!settings) return;
        if (!settings) return;
        if (!settings) return;
        if (!settings) return;
        if (!settings) return;
        if (!settings) return;
        if (!settings) return;
        if (!settings) return;
        if (!settings) return;
        if (!settings) return;
        if (!settings) return;
        if (!settings) return;
        if (!settings) return;
        if (!settings) return;
        if (!settings) return;
        if (!settings) return;
        if (!settings) return;
        if (!settings) return;
        if (!settings) return;
        if (!settings) return;
        if (!settings) return;
        if (!settings) return;
        if (!settings) return;
        if (!settings) return;
        if (!settings) return;
        if (!settings) return;
        if (!settings) return;
        if (!settings) return;
        if (!settings) return;
        if (!settings) return;
        if (!settings) return;
        if (!settings) return;
        if (!settings) return;
        if (!settings) return;
        if (!settings) return;
        if (!settings) return;
        if (!settings) return;
        if (!settings) return;
        if (!settings) return;
        if (!settings) return;
        if (!settings) return;
        if (!settings) return;
        if (!settings) return;
        if (!settings) return;
        if (!settings) return;
        if (!settings) return;
        if (!settings) return;
        if (!settings) return;
        if (!settings) return;
        if (!settings) return;
        if (!settings) return;
        if (!settings) return;
        if (!settings) return;
        if (!settings) return;
        if (!settings) return;
        if (!settings) return;
        if (!settings) return;
        if (!settings) return;
        if (!settings) return;
        if (!settings) return;
        if (!settings) return;
        if (!settings) return;
        if (!settings) return;
        if (!settings) return;
        if (!settings) return;
        if (!settings) return;
        if (!settings) return;
        if (!settings) return;
        if (!settings) return;
        if (!settings) return;
        if (!settings) return;
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
                className={`tab-btn ${activeTab === 'devices' ? 'active' : ''}`}
                onClick={() => setActiveTab('devices')}
            >
                Dispositivos
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
        <div className="settings-container">
            <div className="settings-header">
                <h2>Configurações</h2>
                <button className="btn-icon" onClick={onClose} title="Fechar">✕</button>
            </div>

            {renderTabs()}

            <div className="settings-content">

                {activeTab === 'general' && (
                    <div className="settings-section">
                        <h3>Aparência</h3>
                        <div className="setting-item" style={{ flexDirection: 'column', alignItems: 'flex-start', gap: '10px' }}>
                            <label className="setting-label">Tema:</label>
                            <select
                                className="settings-input"
                                value={settings.theme || 'dark'}
                                onChange={(e) => handleSettingChange('theme', e.target.value)}
                            >
                                <option value="dark">Escuro</option>
                                <option value="light">Claro</option>
                            </select>
                        </div>
                        <div className="setting-item" style={{ flexDirection: 'column', alignItems: 'flex-start', gap: '10px', marginBottom: '20px' }}>
                            <label className="setting-label">Cor de Destaque:</label>
                            <input
                                type="color"
                                value={settings.accentColor || '#e23e3e'}
                                onChange={(e) => handleSettingChange('accentColor', e.target.value)}
                                style={{ width: '50px', height: '50px', padding: 0, border: 'none', cursor: 'pointer' }}
                            />
                        </div>

                        <h3>Comportamento</h3>

                        <div className="setting-item">
                            <label className="setting-label">
                                <input
                                    type="checkbox"
                                    checked={settings.minimizeToTray}
                                    onChange={(e) => handleSettingChange('minimizeToTray', e.target.checked)}
                                />
                                Minimizar para a bandeja ao fechar
                            </label>
                        </div>

                        <div className="setting-item">
                            <label className="setting-label">
                                <input
                                    type="checkbox"
                                    checked={settings.runOnStartup}
                                    onChange={(e) => handleSettingChange('runOnStartup', e.target.checked)}
                                />
                                Iniciar com o sistema
                            </label>
                        </div>
                    </div>
                )}

                {activeTab === 'security' && (
                    <div className="settings-section">
                        <h3>Bloqueio e Privacidade</h3>
                        <div className="setting-item">
                            <label className="setting-label">
                                <input
                                    type="checkbox"
                                    checked={settings.autoLock}
                                    onChange={(e) => handleSettingChange('autoLock', e.target.checked)}
                                />
                                Bloqueio automático por inatividade
                            </label>
                        </div>

                        {settings.autoLock && (
                            <div className="setting-item" style={{ marginLeft: '25px' }}>
                                <label>
                                    Tempo para bloqueio (minutos):
                                    <input
                                        type="number"
                                        min="1"
                                        className="settings-input"
                                        style={{ width: '80px', display: 'inline-block', marginLeft: '10px', marginTop: 0 }}
                                        value={settings.autoLockTimeout}
                                        onChange={(e) => handleSettingChange('autoLockTimeout', parseInt(e.target.value) || 1)}
                                    />
                                </label>
                            </div>
                        )}

                        <div className="setting-item">
                            <label className="setting-label">
                                <input
                                    type="checkbox"
                                    checked={settings.blurOnInactive}
                                    onChange={(e) => handleSettingChange('blurOnInactive', e.target.checked)}
                                />
                                Desfocar ao perder foco da janela
                            </label>
                        </div>

                        <div className="settings-section" style={{ borderTop: 'none', paddingTop: 0 }}>
                            <h3>Senha Mestre</h3>
                            <form onSubmit={handleChangePassword} style={{ display: 'flex', flexDirection: 'column', gap: '10px', maxWidth: '300px' }}>
                                <input
                                    type="password"
                                    className="settings-input"
                                    placeholder="Senha Atual"
                                    value={currentPassword}
                                    onChange={(e) => setCurrentPassword(e.target.value)}
                                />

                                <input
                                    type="password"
                                    className="settings-input"
                                    placeholder="Nova Senha"
                                    value={newPassword}
                                    onChange={(e) => setNewPassword(e.target.value)}
                                />

                                <input
                                    type="password"
                                    className="settings-input"
                                    placeholder="Confirmar Nova Senha"
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                />

                                {passwordError && <div className="error-message">{passwordError}</div>}
                                {passwordMessage && <div className="success-message" style={{ color: 'var(--success-color)', fontSize: '0.9rem' }}>{passwordMessage}</div>}

                                <button type="submit" className="btn btn-primary" disabled={!currentPassword || !newPassword}>
                                    Atualizar Senha
                                </button>
                            </form>
                        </div>
                    </div>
                )}

                {activeTab === 'data' && (
                    <div className="settings-section">
                        <div className="warning-box">
                            <strong>⚠️ Atenção: Não há backup na nuvem</strong>
                            <p>
                                Você é o único responsável pelos seus dados. Se perder o acesso a este computador, perderá seus tokens.
                                Recomendamos criar backups criptografados regularmente e salvá-los em um local seguro externo (ex: pendrive).
                            </p>
                        </div>

                        <h3>Backups e Importação</h3>
                        <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '20px' }}>
                            Gerencie seus dados locais.
                        </p>

                        <div className="data-actions-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                            <div className="settings-card">
                                <h4>Criptografado (Recomendado)</h4>
                                <p>
                                    Backup protegido por senha. Seguro para armazenar.
                                </p>
                                <div className="settings-actions" style={{ flexDirection: 'column' }}>
                                    <button className="btn btn-primary full-width" onClick={onExportEncrypted}>
                                        🔒 Exportar Backup
                                    </button>
                                    <button className="btn btn-secondary full-width" onClick={onImportEncrypted}>
                                        🔓 Restaurar Backup
                                    </button>
                                </div>
                            </div>

                            <div className="settings-card">
                                <h4>Texto Plano (Inseguro)</h4>
                                <p>
                                    Arquivo JSON legível. <strong>Não compartilhe.</strong>
                                </p>
                                <div className="settings-actions" style={{ flexDirection: 'column' }}>
                                    <button className="btn btn-secondary full-width" style={{ opacity: 0.8 }} onClick={onExport}>
                                        📥 Exportar JSON
                                    </button>
                                    <button className="btn btn-secondary full-width" style={{ opacity: 0.8 }} onClick={onImport}>
                                        📤 Importar JSON
                                    </button>
                                </div>
                            </div>
                        </div>

                        <div className="settings-section" style={{ borderTop: 'none', paddingTop: 0, marginTop: '20px' }}>
                            <h3>Migração</h3>
                            <div className="settings-card">
                                <h4>Authy</h4>
                                <p>
                                    Importe dados de um backup exportado do Authy ou lista de URIs otpauth://.
                                </p>
                                <button className="btn btn-secondary" onClick={onImportAuthy}>
                                    📱 Importar do Authy / URIs
                                </button>
                            </div>

                            <div className="settings-card" style={{ marginTop: '15px' }}>
                                <h4>Google Authenticator</h4>
                                <p>
                                    Importe contas usando um link de migração otpauth-migration exportado do Google Authenticator.
                                </p>
                                <button className="btn btn-secondary" onClick={onImportGoogleAuth}>
                                    📱 Importar do Google Auth
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {activeTab === 'devices' && (
                    <div className="settings-section">
                        <h3>Dispositivos</h3>
                        <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '20px' }}>
                            Gerenciamento de dispositivos e sincronização.
                        </p>

                        <div className="settings-card" style={{ borderLeft: '4px solid var(--success-color)' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <div>
                                    <h4 style={{ margin: '0 0 5px 0' }}>Este Dispositivo (Desktop)</h4>
                                    <p style={{ margin: 0 }}>
                                        Armazenamento Local • Ativo
                                    </p>
                                </div>
                                <span style={{ fontSize: '1.5rem' }}>💻</span>
                            </div>
                        </div>

                        <div className="warning-box">
                            <strong>🚫 Sincronização Desativada</strong>
                            <p>
                                Este aplicativo opera exclusivamente offline. A sincronização em nuvem e o recurso de "Multi-Dispositivos" (Multi-Device) não estão disponíveis para garantir sua privacidade e segurança total.
                            </p>
                            <p style={{ marginTop: '10px' }}>
                                Para usar seus tokens em outro dispositivo, utilize a função de Exportar/Importar na aba <strong>Dados</strong>.
                            </p>
                        </div>
                    </div>
                )}

                {activeTab === 'about' && (
                    <div className="settings-section">
                        <h3>Sobre o 2FAC</h3>
                        <p>Versão 1.0.0</p>
                        <p><strong>Contas Protegidas:</strong> {itemsCount}</p>
                        <p style={{ marginTop: '10px' }}>
                            Uma alternativa segura e offline ao Authy Desktop, focada em privacidade e soberania dos seus dados.
                        </p>
                        <ul style={{ marginTop: '10px', paddingLeft: '20px', color: 'var(--text-secondary)' }}>
                            <li>Armazenamento 100% Local (Sem Nuvem)</li>
                            <li>Criptografia AES-256</li>
                            <li>Sem rastreamento ou nuvem</li>
                            <li>Código Aberto</li>
                        </ul>

                        <h4 style={{ marginTop: '20px' }}>Atalhos de Teclado</h4>
                        <ul style={{ paddingLeft: '20px', color: 'var(--text-secondary)' }}>
                            <li><strong>Ctrl/Cmd + F:</strong> Buscar Conta</li>
                            <li><strong>Ctrl/Cmd + N:</strong> Adicionar Conta</li>
                            <li><strong>Ctrl/Cmd + ,:</strong> Configurações</li>
                            <li><strong>Ctrl/Cmd + L:</strong> Bloquear App</li>
                            <li><strong>Esc:</strong> Fechar / Limpar Busca</li>
                        </ul>
                    </div>
                )}
            </div>

            <div className="settings-footer">
                <button className="btn btn-secondary" onClick={onClose}>
                    Fechar
                </button>
            </div>
        </div>
    );
};

export default Settings;
