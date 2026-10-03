import React from 'react';
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
            <h4 style={{ marginTop: '20px' }}>Atualizações</h4>
            <p style={{ color: 'var(--text-secondary)' }}>Versão atual: {version || '—'}</p>
            <p role="status" style={{ color: 'var(--text-secondary)' }}>{describeUpdate(status)}</p>
            <div style={{ marginTop: '10px' }}>
                {status.state === 'downloaded' ? (
                    <button className="btn btn-primary" onClick={() => void install()}>Reiniciar e atualizar</button>
                ) : (
                    <button className="btn btn-secondary" onClick={() => void check()} disabled={busy}>
                        Verificar atualizações
                    </button>
                )}
            </div>
        </div>
    );
};

export default UpdateSection;
