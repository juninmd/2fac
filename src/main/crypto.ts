import * as crypto from 'crypto';
import { EncryptedBackup } from './types';

const ENCRYPTION_ALGORITHM = 'aes-256-gcm';
const KEY_LENGTH = 32;
const IV_LENGTH = 16;
const PBKDF2_ITERATIONS = 100000;

export const hashPassword = (password: string): string => {
    return crypto.createHash('sha256').update(password).digest('hex');
};

export const encryptData = (data: string, password: string): EncryptedBackup => {
    const salt = crypto.randomBytes(32);
    const key = crypto.pbkdf2Sync(password, salt, PBKDF2_ITERATIONS, KEY_LENGTH, 'sha256');
    const iv = crypto.randomBytes(IV_LENGTH);

    const cipher = crypto.createCipheriv(ENCRYPTION_ALGORITHM, key, iv);
    let encrypted = cipher.update(data, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    const authTag = cipher.getAuthTag();

    return {
        version: 1,
        salt: salt.toString('hex'),
        iv: iv.toString('hex'),
        authTag: authTag.toString('hex'),
        data: encrypted,
    };
};

export const decryptData = (backup: EncryptedBackup, password: string): string => {
    const salt = Buffer.from(backup.salt, 'hex');
    const iv = Buffer.from(backup.iv, 'hex');
    const authTag = Buffer.from(backup.authTag, 'hex');

    const key = crypto.pbkdf2Sync(password, salt, PBKDF2_ITERATIONS, KEY_LENGTH, 'sha256');
    const decipher = crypto.createDecipheriv(ENCRYPTION_ALGORITHM, key, iv);
    decipher.setAuthTag(authTag);

    let decrypted = decipher.update(backup.data, 'hex', 'utf8');
    decrypted += decipher.final('utf8');

    return decrypted;
};

export const validateEncryptedBackup = (data: unknown): data is EncryptedBackup => {
    if (typeof data !== 'object' || data === null) return false;
    const backup = data as Record<string, unknown>;
    return (
        typeof backup.version === 'number' &&
        typeof backup.salt === 'string' &&
        typeof backup.iv === 'string' &&
        typeof backup.authTag === 'string' &&
        typeof backup.data === 'string'
    );
};
