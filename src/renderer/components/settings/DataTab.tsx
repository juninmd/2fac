import React from 'react';
import { Button, Card } from '@juninmd/sonido';

export interface DataTabActions {
    onExport: () => void;
    onExportEncrypted: () => void;
    onImport: () => void;
    onImportEncrypted: () => void;
    onImportAuthy: () => void;
    onImportGoogleAuth: () => void;
}

const DataTab: React.FC<DataTabActions> = ({
    onExport,
    onExportEncrypted,
    onImport,
    onImportEncrypted,
    onImportAuthy,
    onImportGoogleAuth,
}) => (
    <>
        <Card surface="solid" padding="md" className="warning-box">
            <strong>⚠️ Atenção: Não há backup na nuvem</strong>
            <p>
                Você é o único responsável pelos seus dados. Se perder o acesso a este computador, perderá seus tokens.
                Recomendamos criar backups criptografados regularmente e salvá-los em um local seguro externo (ex: pendrive).
            </p>
        </Card>

        <h3>Backups e Importação</h3>
        <p className="settings-hint">Gerencie seus dados locais.</p>

        <div className="data-actions-grid">
            <Card surface="solid" padding="md" className="settings-card">
                <h4>Criptografado (Recomendado)</h4>
                <p>Backup protegido por senha. Seguro para armazenar.</p>
                <div className="settings-actions">
                    <Button variant="primary" className="full-width" onClick={onExportEncrypted}>
                        🔒 Exportar Backup
                    </Button>
                    <Button variant="secondary" className="full-width" onClick={onImportEncrypted}>
                        🔓 Restaurar Backup
                    </Button>
                </div>
            </Card>

            <Card surface="solid" padding="md" className="settings-card">
                <h4>Texto Plano (Inseguro)</h4>
                <p>Arquivo JSON legível. <strong>Não compartilhe.</strong></p>
                <div className="settings-actions">
                    <Button variant="secondary" className="full-width" onClick={onExport}>
                        📥 Exportar JSON
                    </Button>
                    <Button variant="secondary" className="full-width" onClick={onImport}>
                        📤 Importar JSON
                    </Button>
                </div>
            </Card>
        </div>

        <h3 className="settings-subtitle">Migração</h3>
        <Card surface="solid" padding="md" className="settings-card">
            <h4>Authy</h4>
            <p>Importe dados de um backup exportado do Authy ou lista de URIs otpauth://.</p>
            <Button variant="secondary" onClick={onImportAuthy}>
                📱 Importar do Authy / URIs
            </Button>
        </Card>

        <Card surface="solid" padding="md" className="settings-card">
            <h4>Google Authenticator</h4>
            <p>Importe contas usando um link de migração otpauth-migration exportado do Google Authenticator.</p>
            <Button variant="secondary" onClick={onImportGoogleAuth}>
                📱 Importar do Google Auth
            </Button>
        </Card>
    </>
);

export default DataTab;
