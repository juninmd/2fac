import React, { useState } from 'react';
import { TwoFAItem } from '../types';

interface AddItemFormProps {
    onAdd: (item: Omit<TwoFAItem, 'id'>) => void;
}

const AddItemForm: React.FC<AddItemFormProps> = ({ onAdd }) => {
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
    });

    const [errors, setErrors] = useState<Record<string, string>>({});

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
        });
        setErrors({});
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
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

    return (
        <form className="add-item-form" onSubmit={handleSubmit}>
            <h2>Adicionar Nova Conta 2FA</h2>

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
                <input
                    type="text"
                    id="issuer"
                    name="issuer"
                    value={formData.issuer}
                    onChange={handleChange}
                    placeholder="ex: Google, GitHub, Microsoft"
                    className={errors.issuer ? 'error' : ''}
                />
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

            <div className="form-row">
                <div className="form-group">
                    <label htmlFor="algorithm">Algoritmo</label>
                    <select name="algorithm" value={formData.algorithm} onChange={handleChange}>
                        <option value="SHA1">SHA1</option>
                        <option value="SHA256">SHA256</option>
                        <option value="SHA512">SHA512</option>
                    </select>
                </div>

                <div className="form-group">
                    <label htmlFor="digits">Dígitos</label>
                    <select name="digits" value={formData.digits} onChange={handleChange}>
                        <option value="6">6</option>
                        <option value="7">7</option>
                        <option value="8">8</option>
                    </select>
                </div>
            </div>

            <div className="form-row">
                <div className="form-group">
                    <label htmlFor="period">Período (segundos)</label>
                    <select name="period" value={formData.period} onChange={handleChange}>
                        <option value="30">30</option>
                        <option value="60">60</option>
                    </select>
                </div>

                <div className="form-group">
                    <label htmlFor="encoding">Codificação</label>
                    <select name="encoding" value={formData.encoding} onChange={handleChange}>
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
