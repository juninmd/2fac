import * as crypto from 'crypto';
import { promisify } from 'util';
import * as argon2 from 'argon2';
import { EncryptedBackup } from './types';

const ENCRYPTION_ALGORITHM = 'aes-256-gcm';
const KEY_LENGTH = 32;
const IV_LENGTH = 16;

export const getArgonKey = async (password: string, salt: Buffer): Promise<Buffer> => {
    const hash = await argon2.hash(password, {
        type: argon2.argon2id,
        salt,
        hashLength: KEY_LENGTH,
        raw: true
    });
    return hash;
};

export const hashPassword = async (password: string, salt: string): Promise<string> => {
    const saltBuffer = Buffer.from(salt, 'hex');
    const key = await getArgonKey(password, saltBuffer);
    return crypto.createHash('sha256').update(key).digest('hex');
};

export const encryptData = async (data: string, password: string): Promise<EncryptedBackup> => {
    const salt = crypto.randomBytes(32);
    const key = await getArgonKey(password, salt);
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

export const decryptData = async (backup: EncryptedBackup, password: string): Promise<string> => {
    const salt = Buffer.from(backup.salt, 'hex');
    const iv = Buffer.from(backup.iv, 'hex');
    const authTag = Buffer.from(backup.authTag, 'hex');

    const key = await getArgonKey(password, salt);
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
