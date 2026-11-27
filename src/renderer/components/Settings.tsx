import React, { useEffect, useState } from 'react';
import { Button, PageHeader, Tabs } from '@juninmd/sonido';
import { AppSettings } from '../types';
import GeneralTab from './settings/GeneralTab';
import SecurityTab from './settings/SecurityTab';
import DataTab, { DataTabActions } from './settings/DataTab';
import DevicesTab from './settings/DevicesTab';
import AboutTab from './settings/AboutTab';

export type SettingsTabKey = 'general' | 'security' | 'data' | 'devices' | 'about';

export interface SettingsTabProps {
    settings: AppSettings;
    onChange: <K extends keyof AppSettings>(key: K, value: AppSettings[K]) => Promise<void>;
}

interface SettingsProps extends DataTabActions {
    onClose: () => void;
    itemsCount: number;
}

const TABS = [
    { key: 'general', label: 'Geral' },
    { key: 'security', label: 'Segurança' },
    { key: 'data', label: 'Dados' },
    { key: 'devices', label: 'Dispositivos' },
    { key: 'about', label: 'Sobre' },
] as const;

const Settings: React.FC<SettingsProps> = ({ onClose, itemsCount, ...actions }) => {
    const [settings, setSettings] = useState<AppSettings>({
        minimizeToTray: false,
        runOnStartup: false,
        autoLock: true,
        autoLockTimeout: 5,
        blurOnInactive: true,
        maskSecrets: true,
        theme: 'dark',
        accentColor: '#e23e3e'
    });

    const [activeTab, setActiveTab] = useState<SettingsTabKey>('general');

    useEffect(() => {
        loadSettings();
    }, []);

    const loadSettings = async () => {
        const loaded = await window.electron.getSettings();
        setSettings(loaded);
    };

    const handleSettingChange = async <K extends keyof AppSettings>(key: K, value: AppSettings[K]) => {
        const updated = { ...settings, [key]: value };
        setSettings(updated);
        await window.electron.setSettings(updated);
    };

    return (
        <div className="settings-container">
            <PageHeader
                title="Configurações"
                titleAs="h2"
                icon="⚙"
                actions={
                    <Button variant="ghost" size="icon" aria-label="Fechar" onClick={onClose}>
                        ✕
                    </Button>
                }
            />

            <Tabs
                items={TABS.map(tab => ({ ...tab }))}
                value={activeTab}
                onChange={setActiveTab}
                label="Seções das configurações"
                variant="pill"
                idPrefix="settings"
                hasPanels
            />

            <div
                className="settings-content"
                role="tabpanel"
                id={`settings-panel-${activeTab}`}
                aria-labelledby={`settings-${activeTab}`}
            >
                {activeTab === 'general' && <GeneralTab settings={settings} onChange={handleSettingChange} />}
                {activeTab === 'security' && <SecurityTab settings={settings} onChange={handleSettingChange} />}
                {activeTab === 'data' && <DataTab {...actions} />}
                {activeTab === 'devices' && <DevicesTab />}
                {activeTab === 'about' && <AboutTab itemsCount={itemsCount} />}
            </div>

            <div className="settings-footer">
                <Button variant="secondary" onClick={onClose}>Fechar</Button>
            </div>
        </div>
    );
};

export default Settings;
