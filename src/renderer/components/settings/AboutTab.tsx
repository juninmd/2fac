import React from 'react';
import { Badge, Kbd } from '@juninmd/sonido';
import UpdateSection from '../UpdateSection';

interface AboutTabProps {
    itemsCount: number;
}

const AboutTab: React.FC<AboutTabProps> = ({ itemsCount }) => (
    <>
        <h3>Sobre o 2FAC</h3>
        <p>Versão 1.0.0</p>
        <p className="about-count">
            <strong>Contas Protegidas:</strong>
            <Badge appearance="count" tone="accent">{itemsCount}</Badge>
        </p>
        <p>
            Uma alternativa segura e offline ao Authy Desktop, focada em privacidade e soberania dos seus dados.
        </p>
        <ul className="about-list">
            <li>Armazenamento 100% Local (Sem Nuvem)</li>
            <li>Criptografia AES-256</li>
            <li>Sem rastreamento ou nuvem</li>
            <li>Código Aberto</li>
        </ul>

        <UpdateSection />

        <h4 className="settings-subtitle">Atalhos de Teclado</h4>
        <ul className="about-list">
            <li><Kbd>Ctrl</Kbd> + <Kbd>F</Kbd>: Buscar Conta</li>
            <li><Kbd>Ctrl</Kbd> + <Kbd>N</Kbd>: Adicionar Conta</li>
            <li><Kbd>Ctrl</Kbd> + <Kbd>,</Kbd>: Configurações</li>
            <li><Kbd>Ctrl</Kbd> + <Kbd>L</Kbd>: Bloquear App</li>
            <li><Kbd>Esc</Kbd>: Fechar / Limpar Busca</li>
        </ul>
    </>
);

export default AboutTab;
