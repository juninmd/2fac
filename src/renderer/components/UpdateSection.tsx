import React from 'react';
import { Button } from '@juninmd/sonido';
import { UpdateStatus } from '../types';
import { useUpdateStatus } from '../hooks/useUpdateStatus';

export const describeUpdate = (status: UpdateStatus): string => {
    switch (status.state) {
        case 'checking': return 'Verificando atualizações…';
        case 'not-available': return 'Você está na versão mais recente.';
        case 'available': return `Versão ${status.version} encontrada. Iniciando download…`;
        case 'downloading': return `Baixando versão ${status.version}… ${status.percent}%`;
        case 'downloaded': return `Versão ${status.version} pronta para instalar.`;
        case 'unsupported': return status.reason;
        case 'error': return `Não foi possível verificar atualizações: ${status.message}`;
        default: return '';
    }
};

const UpdateSection: React.FC = () => {
    const { status, version, check, install } = useUpdateStatus();
    const busy = ['checking', 'available', 'downloading'].includes(status.state);

    return (
        <div className="update-section">
            <h4>Atualizações</h4>
            <p className="settings-hint">Versão atual: {version || '—'}</p>
            <p role="status" className="settings-hint">{describeUpdate(status)}</p>
            <div className="update-actions">
                {status.state === 'downloaded' ? (
                    <Button variant="primary" onClick={() => void install()}>Reiniciar e atualizar</Button>
                ) : (
                    <Button variant="secondary" onClick={() => void check()} loading={status.state === 'checking'} disabled={busy}>
                        Verificar atualizações
                    </Button>
                )}
            </div>
        </div>
    );
};

export default UpdateSection;
