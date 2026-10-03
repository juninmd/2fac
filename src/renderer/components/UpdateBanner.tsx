import React from 'react';
import { useUpdateStatus } from '../hooks/useUpdateStatus';

/** Aviso discreto no topo do app quando há atualização baixando ou pronta. */
const UpdateBanner: React.FC = () => {
    const { status, install } = useUpdateStatus();

    if (status.state === 'downloaded') {
        return (
            <div className="update-banner" role="status">
                <span>Versão {status.version} pronta para instalar.</span>
                <button className="btn btn-primary" onClick={() => void install()}>Reiniciar e atualizar</button>
            </div>
        );
    }
    if (status.state === 'available' || status.state === 'downloading') {
        return <div className="update-banner" role="status">Baixando atualização {status.version}…</div>;
    }
    return null;
};

export default UpdateBanner;
