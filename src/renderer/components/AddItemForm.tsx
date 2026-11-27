import React, { useState } from 'react';
import * as OTPAuth from 'otpauth';
import { Button, Select, TextField, useToast } from '@juninmd/sonido';
import { TwoFAItem } from '../types';
import { COLORS } from '../constants';
import { getBrandColor } from '../utils/brandUtils';
import IssuerIcon from './IssuerIcon';

interface AddItemFormProps {
    onAdd: (item: Omit<TwoFAItem, 'id'>) => void;
    initialUri?: string;
}

const AddItemForm: React.FC<AddItemFormProps> = ({ onAdd, initialUri }) => {
    const toast = useToast();
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
        category: '',
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
        if (initialUri?.startsWith('otpauth://')) {
            try {
                const parsed = OTPAuth.URI.parse(initialUri);
                const secret = parsed.secret?.base32 ?? '';

                if (parsed && secret) {
                    setFormData(prev => ({
                        ...prev,
                        account: parsed.label || prev.account,
                        issuer: parsed.issuer || prev.issuer,
                        secret,
                        algorithm: (parsed.algorithm || 'SHA1').toUpperCase(),
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
            algorithm: formData.algorithm,
            digits: parseInt(formData.digits),
            period: parseInt(formData.period),
            encoding: formData.encoding,
            type: formData.type,
            color: formData.color,
            category: formData.category.trim(),
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
            category: '',
        });
        setErrors({});
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;

        if (name === 'secret' && value.startsWith('otpauth://')) {
            try {
                const parsed = OTPAuth.URI.parse(value);
                const secret = parsed.secret?.base32 ?? '';

                if (parsed && secret) {
                    setFormData(prev => ({
                        ...prev,
                        account: parsed.label || prev.account,
                        issuer: parsed.issuer || prev.issuer,
                        secret,
                        algorithm: (parsed.algorithm || 'SHA1').toUpperCase(),
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

    const updateField = (field: 'algorithm' | 'digits' | 'period' | 'encoding', value: string) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    const handleScanQR = async () => {
        setIsScanning(true);
        try {
            const result = await window.electron.scanScreenQR();
            if (result.success && result.data) {
                try {
                    const parsed = OTPAuth.URI.parse(result.data);
                    const secret = parsed.secret?.base32 ?? '';

                    if (parsed && secret) {
                        setFormData(prev => ({
                            ...prev,
                            account: parsed.label || prev.account,
                            issuer: parsed.issuer || prev.issuer,
                            secret,
                            algorithm: (parsed.algorithm || 'SHA1'),
                            digits: (parsed.digits || 6).toString(),
                            period: (parsed instanceof OTPAuth.TOTP ? parsed.period : 30).toString(),
                            encoding: 'base32',
                            type: 'totp'
                        }));
                        setErrors({});
                    } else {
                        toast({ title: 'QR Code não contém dados válidos de 2FA.', tone: 'danger' });
                    }
                } catch {
                    toast({ title: 'QR Code inválido ou não suportado.', tone: 'danger' });
                }
            } else {
                toast({
                    title: 'QR Code não encontrado',
                    description: result.error || 'Certifique-se que o código está visível na tela.',
                    tone: 'danger',
                });
            }
        } catch (error) {
            console.error(error);
            toast({ title: 'Erro ao escanear.', tone: 'danger' });
        } finally {
            setIsScanning(false);
        }
    };

    return (
        <form className="add-item-form" onSubmit={handleSubmit}>
            <Button
                type="button"
                variant="primary"
                size="lg"
                className="full-width"
                onClick={handleScanQR}
                loading={isScanning}
                iconStart="📷"
            >
                {isScanning ? 'Procurando QR Code...' : 'Escanear QR da Tela'}
            </Button>

            <div className="form-separator">
                <span>OU MANUALMENTE</span>
            </div>

            <TextField
                label="Nome da Conta *"
                name="account"
                value={formData.account}
                onChange={handleChange}
                placeholder="ex: seu_email@gmail.com"
                error={errors.account || undefined}
            />

            <TextField
                label="Emissor (Serviço) *"
                name="issuer"
                value={formData.issuer}
                onChange={handleChange}
                placeholder="ex: Google, GitHub"
                error={errors.issuer || undefined}
                icon={
                    <span className="issuer-preview" style={{ backgroundColor: formData.color }}>
                        <IssuerIcon issuer={formData.issuer} />
                    </span>
                }
            />

            <TextField
                label="Chave Secreta (Secret Key) *"
                name="secret"
                value={formData.secret}
                onChange={handleChange}
                placeholder="Cole aqui sua chave secreta"
                error={errors.secret || undefined}
            />

            <TextField
                label="Categoria (opcional)"
                name="category"
                value={formData.category}
                onChange={handleChange}
                placeholder="ex: Trabalho, Pessoal"
                list="category-suggestions"
            />
            <datalist id="category-suggestions">
                <option value="Trabalho" />
                <option value="Pessoal" />
                <option value="Social" />
                <option value="Finanças" />
                <option value="Jogos" />
            </datalist>

            <TextField
                label="Descrição (opcional)"
                name="description"
                value={formData.description}
                onChange={handleChange}
                placeholder="Notas sobre esta conta"
                multiline
                rows={2}
            />

            <fieldset className="color-field">
                <legend>Cor do Ícone</legend>
                <div className="color-grid">
                    {COLORS.map(color => (
                        <button
                            key={color}
                            type="button"
                            aria-label={`Cor ${color}`}
                            aria-pressed={formData.color === color}
                            className="color-swatch"
                            onClick={() => setFormData(prev => ({ ...prev, color }))}
                            style={{ backgroundColor: color }}
                        />
                    ))}
                </div>
            </fieldset>

            <div className="form-row">
                <Select
                    label="Algoritmo"
                    value={formData.algorithm}
                    onChange={(value) => updateField('algorithm', value)}
                    options={[
                        { value: 'SHA1', label: 'SHA1' },
                        { value: 'SHA256', label: 'SHA256' },
                        { value: 'SHA512', label: 'SHA512' },
                    ]}
                />

                <Select
                    label="Dígitos"
                    value={formData.digits}
                    onChange={(value) => updateField('digits', value)}
                    options={[
                        { value: '6', label: '6' },
                        { value: '7', label: '7' },
                        { value: '8', label: '8' },
                    ]}
                />
            </div>

            <div className="form-row">
                <Select
                    label="Período (segundos)"
                    value={formData.period}
                    onChange={(value) => updateField('period', value)}
                    options={[
                        { value: '30', label: '30' },
                        { value: '60', label: '60' },
                    ]}
                />

                <Select
                    label="Codificação"
                    value={formData.encoding}
                    onChange={(value) => updateField('encoding', value)}
                    options={[
                        { value: 'base32', label: 'Base32' },
                        { value: 'base64', label: 'Base64' },
                        { value: 'ascii', label: 'ASCII' },
                    ]}
                />
            </div>

            <Button type="submit" variant="primary" className="full-width">
                + Adicionar Conta
            </Button>
        </form>
    );
};

export default AddItemForm;
