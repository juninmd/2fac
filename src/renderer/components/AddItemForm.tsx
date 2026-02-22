import React, { useState } from 'react';
import * as OTPAuth from 'otpauth';
import { TwoFAItem } from '../types';
import { COLORS } from '../constants';
import { getBrandColor } from '../utils/brandUtils';
import IssuerIcon from './IssuerIcon';

interface AddItemFormProps {
    onAdd: (item: Omit<TwoFAItem, 'id'>) => void;
    initialUri?: string;
}

const AddItemForm: React.FC<AddItemFormProps> = ({ onAdd, initialUri }) => {
    const [isScanning, setIsScanning] = useState(false);
    const [formData, setFormData] = useState({
        account: '',
        issuer: '',
        secret: '',
        description: '',
        algorithm: 'SHA1',
        digits: '6',
        period: '30',
        encoding: 'base32',
        type: 'totp',
        color: '#e23e3e',
    });

    const [errors, setErrors] = useState<Record<string, string>>({});

    // Auto-select color when issuer changes
    React.useEffect(() => {
        const brandColor = getBrandColor(formData.issuer);
        if (brandColor) {
            setFormData(prev => ({ ...prev, color: brandColor }));
        }
    }, [formData.issuer]);

    React.useEffect(() => {
        if (initialUri && initialUri.startsWith('otpauth://')) {
            try {
                const parsed = OTPAuth.URI.parse(initialUri);
                let secret = '';
                if (parsed.secret) {
                    secret = parsed.secret.base32;
                }

                if (parsed && secret) {
                    setFormData(prev => ({
                        ...prev,
                        account: parsed.label || prev.account,
                        issuer: parsed.issuer || prev.issuer,
                        secret: secret,
                        algorithm: (parsed.algorithm || 'SHA1') as any,
                        digits: (parsed.digits || 6).toString(),
                        period: (parsed instanceof OTPAuth.TOTP ? parsed.period : 30).toString(),
                        encoding: 'base32',
                        type: 'totp'
                    }));
                    setErrors({});
                }
            } catch (err) {
                console.error('Failed to parse initial URI', err);
            }
        }
    }, [initialUri]);

    const validateForm = () => {
        const newErrors: Record<string, string> = {};

        if (!formData.account.trim()) {
            newErrors.account = 'Nome da conta é obrigatório';
        }
        if (!formData.issuer.trim()) {
            newErrors.issuer = 'Emissor é obrigatório';
        }
        if (!formData.secret.trim()) {
            newErrors.secret = 'Chave secreta é obrigatória';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        if (!validateForm()) {
            return;
        }

        onAdd({
            account: formData.account.trim(),
            issuer: formData.issuer.trim(),
            secret: formData.secret.trim().replace(/\s/g, ''),
            description: formData.description.trim(),
            algorithm: formData.algorithm as any,
            digits: parseInt(formData.digits),
            period: parseInt(formData.period),
            encoding: formData.encoding as any,
            type: formData.type as any,
            color: formData.color,
        });

        // Reset form
        setFormData({
            account: '',
            issuer: '',
            secret: '',
            description: '',
            algorithm: 'SHA1',
            digits: '6',
            period: '30',
            encoding: 'base32',
            type: 'totp',
            color: '#e23e3e',
        });
        setErrors({});
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value } = e.target;

        if (name === 'secret' && value.startsWith('otpauth://')) {
            try {
                const parsed = OTPAuth.URI.parse(value);
                let secret = '';
                if (parsed.secret) {
                    secret = parsed.secret.base32;
                }

                if (parsed && secret) {
                    setFormData(prev => ({
                        ...prev,
                        account: parsed.label || prev.account,
                        issuer: parsed.issuer || prev.issuer,
                        secret: secret,
                        algorithm: (parsed.algorithm || 'SHA1') as any,
                        digits: (parsed.digits || 6).toString(),
                        period: (parsed instanceof OTPAuth.TOTP ? parsed.period : 30).toString(),
                        encoding: 'base32',
                        type: 'totp'
                    }));
                    setErrors({});
                    return;
                }
            } catch (err) {
                console.error('Failed to parse pasted URI', err);
            }
        }

        setFormData(prev => ({
            ...prev,
            [name]: value,
        }));
        // Clear error when user starts typing
        if (errors[name]) {
            setErrors(prev => ({
                ...prev,
                [name]: '',
            }));
        }
    };

    const handleScanQR = async () => {
        setIsScanning(true);
        try {
            const result = await window.electron.scanScreenQR();
            if (result.success && result.data) {
                try {
                    const parsed = OTPAuth.URI.parse(result.data);

                    let secret = '';
                    if (parsed.secret) {
                        secret = parsed.secret.base32;
                    }

                    if (parsed && secret) {
                         setFormData(prev => ({
                             ...prev,
                             account: parsed.label || prev.account,
                             issuer: parsed.issuer || prev.issuer,
                             secret: secret,
                             algorithm: (parsed.algorithm || 'SHA1') as any,
                             digits: (parsed.digits || 6).toString(),
                             period: (parsed instanceof OTPAuth.TOTP ? parsed.period : 30).toString(),
                             encoding: 'base32',
                             type: 'totp'
                         }));
                         setErrors({});
                    } else {
                        alert('QR Code não contém dados válidos de 2FA.');
                    }
                } catch (e) {
                    alert('QR Code inválido ou não suportado.');
                }
            } else {
                alert(result.error || 'QR Code não encontrado na tela. Certifique-se que o código está visível.');
            }
        } catch (error) {
            console.error(error);
            alert('Erro ao escanear.');
        } finally {
            setIsScanning(false);
        }
    };

    return (
        <form className="add-item-form" onSubmit={handleSubmit}>
            <button
                type="button"
                className="btn btn-primary full-width"
                onClick={handleScanQR}
                disabled={isScanning}
                style={{ marginBottom: '24px', height: '48px', fontSize: '15px' }}
            >
                {isScanning ? 'Procurando QR Code...' : '📷 Escanear QR da Tela'}
            </button>

            <div className="form-separator" style={{
                textAlign: 'center',
                borderBottom: '1px solid var(--border-color)',
                lineHeight: '0.1em',
                margin: '10px 0 20px',
                color: 'var(--text-secondary)'
            }}>
                <span style={{ background: 'var(--bg-surface)', padding: '0 10px' }}>OU MANUALMENTE</span>
            </div>

            <div className="form-group">
                <label htmlFor="account">Nome da Conta *</label>
                <input
                    type="text"
                    id="account"
                    name="account"
                    value={formData.account}
                    onChange={handleChange}
                    placeholder="ex: seu_email@gmail.com"
                    className={errors.account ? 'error' : ''}
                />
                {errors.account && <span className="error-message">{errors.account}</span>}
            </div>

            <div className="form-group">
                <label htmlFor="issuer">Emissor (Serviço) *</label>
                <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                    <div style={{
                        width: '40px',
                        height: '40px',
                        borderRadius: '8px',
                        backgroundColor: formData.color,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: 'white',
                        flexShrink: 0,
                        fontSize: '1.2rem',
                        fontWeight: 'bold',
                        transition: 'background-color 0.2s',
                        border: '1px solid var(--border-color)'
                    }}>
                        <IssuerIcon issuer={formData.issuer} />
                    </div>
                    <input
                        type="text"
                        id="issuer"
                        name="issuer"
                        value={formData.issuer}
                        onChange={handleChange}
                        placeholder="ex: Google, GitHub"
                        className={errors.issuer ? 'error' : ''}
                        style={{ flex: 1 }}
                    />
                </div>
                {errors.issuer && <span className="error-message">{errors.issuer}</span>}
            </div>

            <div className="form-group">
                <label htmlFor="secret">Chave Secreta (Secret Key) *</label>
                <input
                    type="text"
                    id="secret"
                    name="secret"
                    value={formData.secret}
                    onChange={handleChange}
                    placeholder="Cole aqui sua chave secreta"
                    className={errors.secret ? 'error' : ''}
                />
                {errors.secret && <span className="error-message">{errors.secret}</span>}
            </div>

            <div className="form-group">
                <label htmlFor="description">Descrição (opcional)</label>
                <textarea
                    id="description"
                    name="description"
                    value={formData.description}
                    onChange={handleChange}
                    placeholder="Notas sobre esta conta"
                    rows={2}
                />
            </div>

            <div className="form-group">
                <label>Cor do Ícone</label>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(10, 1fr)', gap: '5px' }}>
                    {COLORS.map(color => (
                        <div
                            key={color}
                            onClick={() => setFormData(prev => ({ ...prev, color }))}
                            style={{
                                backgroundColor: color,
                                width: '100%',
                                paddingTop: '100%', // Aspect ratio 1:1
                                borderRadius: '4px',
                                cursor: 'pointer',
                                border: formData.color === color ? '2px solid white' : '2px solid transparent',
                                position: 'relative'
                            }}
                        />
                    ))}
                </div>
            </div>

            <div className="form-row">
                <div className="form-group">
                    <label htmlFor="algorithm">Algoritmo</label>
                    <select id="algorithm" name="algorithm" value={formData.algorithm} onChange={handleChange}>
                        <option value="SHA1">SHA1</option>
                        <option value="SHA256">SHA256</option>
                        <option value="SHA512">SHA512</option>
                    </select>
                </div>

                <div className="form-group">
                    <label htmlFor="digits">Dígitos</label>
                    <select id="digits" name="digits" value={formData.digits} onChange={handleChange}>
                        <option value="6">6</option>
                        <option value="7">7</option>
                        <option value="8">8</option>
                    </select>
                </div>
            </div>

            <div className="form-row">
                <div className="form-group">
                    <label htmlFor="period">Período (segundos)</label>
                    <select id="period" name="period" value={formData.period} onChange={handleChange}>
                        <option value="30">30</option>
                        <option value="60">60</option>
                    </select>
                </div>

                <div className="form-group">
                    <label htmlFor="encoding">Codificação</label>
                    <select id="encoding" name="encoding" value={formData.encoding} onChange={handleChange}>
                        <option value="base32">Base32</option>
                        <option value="base64">Base64</option>
                        <option value="ascii">ASCII</option>
                    </select>
                </div>
            </div>

            <button type="submit" className="btn btn-primary btn-block">
                + Adicionar Conta
            </button>
        </form>
    );
};

export default AddItemForm;
