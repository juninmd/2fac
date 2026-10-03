import { TwoFAItem } from './types';
import { generateItemId } from './store';

const BASE32_ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
const ALGORITHMS = ['SHA1', 'SHA256', 'SHA512'];
const MIN_SECRET_LENGTH = 8;

export const encodeBase32 = (buffer: Uint8Array): string => {
    let bits = 0;
    let value = 0;
    let output = '';

    for (const byte of buffer) {
        value = (value << 8) | byte;
        bits += 8;
        while (bits >= 5) {
            output += BASE32_ALPHABET[(value >>> (bits - 5)) & 31];
            bits -= 5;
        }
    }
    if (bits > 0) {
        output += BASE32_ALPHABET[(value << (5 - bits)) & 31];
    }
    return output;
};

/** Remove espaços, hífens e padding e converte para maiúsculas. */
export const normalizeSecret = (secret: string): string => secret.replace(/[\s=-]/g, '').toUpperCase();

export const isValidBase32Secret = (secret: string, minLength = MIN_SECRET_LENGTH): boolean =>
    secret.length >= minLength && [...secret].every(ch => BASE32_ALPHABET.includes(ch));

const normalizeAlgorithm = (value: unknown): string => {
    const algorithm = typeof value === 'string' ? value.toUpperCase().replace(/[^A-Z0-9]/g, '') : '';
    return ALGORITHMS.includes(algorithm) ? algorithm : 'SHA1';
};

const normalizeDigits = (value: unknown): number => {
    const digits = Number(value);
    return Number.isInteger(digits) && digits >= 6 && digits <= 8 ? digits : 6;
};

const normalizePeriod = (value: unknown): number => {
    const period = Number(value);
    return Number.isInteger(period) && period > 0 ? period : 30;
};

interface ImportedFields extends Omit<Partial<TwoFAItem>, 'algorithm' | 'digits' | 'period'> {
    algorithm?: unknown;
    digits?: unknown;
    period?: unknown;
    /** Tamanho mínimo do segredo; use um valor maior para linhas "soltas" sem estrutura. */
    minSecretLength?: number;
}

/**
 * Cria um item a partir de dados importados de formatos de terceiros (segredo em base32).
 * Retorna null se o segredo for inválido ou já existir (`existingSecrets` deve conter segredos normalizados).
 */
export const createTwoFAItem = (data: ImportedFields, existingSecrets: Set<string>): TwoFAItem | null => {
    const secret = typeof data.secret === 'string' ? normalizeSecret(data.secret) : '';
    if (!isValidBase32Secret(secret, data.minSecretLength) || existingSecrets.has(secret)) return null;

    existingSecrets.add(secret);
    return {
        id: generateItemId(),
        account: data.account || 'Conta Importada',
        issuer: data.issuer || 'Importado',
        secret,
        algorithm: normalizeAlgorithm(data.algorithm),
        digits: normalizeDigits(data.digits),
        period: normalizePeriod(data.period),
        type: data.type === 'hotp' ? 'hotp' : 'totp',
    };
};

export const getErrorMessage = (error: unknown): string =>
    error instanceof Error ? error.message : String(error);
