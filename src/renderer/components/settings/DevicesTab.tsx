import React from 'react';
import { Badge, Card } from '@juninmd/sonido';

const DevicesTab: React.FC = () => (
    <>
        <h3>Dispositivos</h3>
        <p className="settings-hint">Gerenciamento de dispositivos e sincronização.</p>

        <Card surface="solid" padding="md" className="settings-card device-card">
            <div>
                <h4>Este Dispositivo (Desktop)</h4>
                <p>Armazenamento Local • Ativo</p>
            </div>
            <div className="device-card__aside">
                <Badge tone="success" dot>Ativo</Badge>
                <span aria-hidden>💻</span>
            </div>
        </Card>

        <Card surface="solid" padding="md" className="warning-box">
            <strong>🚫 Sincronização Desativada</strong>
            <p>
                Este aplicativo opera exclusivamente offline. A sincronização em nuvem e o recurso de
                "Multi-Dispositivos" (Multi-Device) não estão disponíveis para garantir sua privacidade e segurança total.
            </p>
            <p>
                Para usar seus tokens em outro dispositivo, utilize a função de Exportar/Importar na aba <strong>Dados</strong>.
            </p>
        </Card>
    </>
);

export default DevicesTab;
