import React from 'react';
import { Card, Select, Switch } from '@juninmd/sonido';
import type { SettingsTabProps } from '../Settings';

const GeneralTab: React.FC<SettingsTabProps> = ({ settings, onChange }) => (
    <>
        <Card surface="solid" padding="md" className="settings-section">
            <h3>Aparência</h3>
            <div className="setting-item">
                <Select
                    label="Tema"
                    value={settings.theme || 'dark'}
                    onChange={(value) => void onChange('theme', value as 'dark' | 'light')}
                    options={[
                        { value: 'dark', label: 'Escuro' },
                        { value: 'light', label: 'Claro' },
                    ]}
                />
            </div>
            <div className="setting-item">
                <label className="setting-label" htmlFor="accent-color">Cor de Destaque:</label>
                <input
                    id="accent-color"
                    type="color"
                    value={settings.accentColor || '#e23e3e'}
                    onChange={(e) => void onChange('accentColor', e.target.value)}
                    className="accent-input"
                />
            </div>
        </Card>

        <Card surface="solid" padding="md" className="settings-section">
            <h3>Comportamento</h3>
            <Switch
                checked={settings.minimizeToTray}
                onChange={(checked) => void onChange('minimizeToTray', checked)}
                label="Minimizar para a bandeja ao fechar"
            />
            <Switch
                checked={settings.runOnStartup}
                onChange={(checked) => void onChange('runOnStartup', checked)}
                label="Iniciar com o sistema"
            />
        </Card>
    </>
);

export default GeneralTab;
