import * as crypto from 'crypto';
import { TwoFAItem } from './types';

export function generateId(): string {
    return Date.now().toString() + Math.random();
}

export function hashPassword(password: string): string {
    return crypto.createHash('sha256').update(password).digest('hex');
}

export function encryptData(data: string, password: string): {
    salt: string;
    iv: string;
    authTag: string;
    encrypted: string;
} {
    const salt = crypto.randomBytes(32);
    const key = crypto.pbkdf2Sync(password, salt, 100000, 32, 'sha256');
    const iv = crypto.randomBytes(16);

    const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);
    let encrypted = cipher.update(data, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    const authTag = cipher.getAuthTag();

    return {
        salt: salt.toString('hex'),
        iv: iv.toString('hex'),
        authTag: authTag.toString('hex'),
        encrypted,
    };
}

export function decryptData(encryptedData: string, password: string, saltHex: string, ivHex: string, authTagHex: string): string {
    const salt = Buffer.from(saltHex, 'hex');
    const iv = Buffer.from(ivHex, 'hex');
    const authTag = Buffer.from(authTagHex, 'hex');

    const key = crypto.pbkdf2Sync(password, salt, 100000, 32, 'sha256');
    const decipher = crypto.createDecipheriv('aes-256-gcm', key, iv);
    decipher.setAuthTag(authTag);

    let decrypted = decipher.update(encryptedData, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    return decrypted;
}

export function decodeBase32(buffer: Uint8Array): string {
    const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
    let bits = 0;
    let value = 0;
    let output = '';

    for (let i = 0; i < buffer.length; i++) {
        value = (value << 8) | buffer[i];
        bits += 8;
        while (bits >= 5) {
            output += alphabet[(value >>> (bits - 5)) & 31];
            bits -= 5;
        }
    }
    if (bits > 0) {
        output += alphabet[(value << (5 - bits)) & 31];
    }
    return output;
}

export function createItemWithDefaults(overrides: Partial<TwoFAItem>): TwoFAItem {
    return {
        id: generateId(),
        account: 'Conta Importada',
        issuer: 'Importado',
        secret: '',
        algorithm: 'SHA1',
        digits: 6,
        period: 30,
        type: 'totp',
        ...overrides,
    };
}

export function getAlgorithmName(algorithmNumber: number): string {
    const algorithmMap: Record<number, string> = { 1: 'SHA1', 2: 'SHA256', 3: 'SHA512' };
    return algorithmMap[algorithmNumber] || 'SHA1';
}
