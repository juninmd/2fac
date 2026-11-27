import React from 'react';
import { Badge, Button, Spinner } from '@juninmd/sonido';
import { useUpdateStatus } from '../hooks/useUpdateStatus';

/** Aviso discreto no topo do app quando há atualização baixando ou pronta. */
const UpdateBanner: React.FC = () => {
    const { status, install } = useUpdateStatus();

    if (status.state === 'downloaded') {
        return (
            <div className="update-banner" role="status">
                <Badge tone="success" dot>Nova versão</Badge>
                <span>Versão {status.version} pronta para instalar.</span>
                <Button variant="primary" size="sm" onClick={() => void install()}>Reiniciar e atualizar</Button>
            </div>
        );
    }
    if (status.state === 'available' || status.state === 'downloading') {
        return (
            <div className="update-banner" role="status">
                <Spinner size={14} label="Baixando atualização" />
                <span>Baixando atualização {status.version}…</span>
            </div>
        );
    }
    return null;
};

export default UpdateBanner;
