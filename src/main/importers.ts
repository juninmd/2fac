import * as crypto from 'crypto';
import * as OTPAuth from 'otpauth';
import * as protobuf from 'protobufjs';
import { readFile } from 'fs/promises';
import Store from 'electron-store';
import { TwoFAItem, ImportResult, AlgorithmMap } from './types';
import { getExistingSecrets, appendItems, generateItemId } from './store';
import { decryptData, validateEncryptedBackup } from './crypto';

const ALGORITHM_MAP: AlgorithmMap = { 1: 'SHA1', 2: 'SHA256', 3: 'SHA512' };

const GOOGLE_AUTH_PROTO = `
syntax = "proto3";
message MigrationPayload {
  repeated OtpParameters otp_parameters = 1;
  int32 version = 2;
  int32 batch_size = 3;
  int32 batch_index = 4;
  int32 batch_id = 5;
}
message OtpParameters {
  bytes secret = 1;
  string name = 2;
  string issuer = 3;
  Algorithm algorithm = 4;
  int32 digits = 5;
  OtpType type = 6;
  int64 counter = 7;
}
enum Algorithm {
  ALGORITHM_UNSPECIFIED = 0;
  ALGORITHM_SHA1 = 1;
  ALGORITHM_SHA256 = 2;
  ALGORITHM_SHA512 = 3;
  ALGORITHM_MD5 = 4;
}
enum OtpType {
  OTP_TYPE_UNSPECIFIED = 0;
  OTP_TYPE_HOTP = 1;
  OTP_TYPE_TOTP = 2;
}
`;

interface OtpParametersProto {
    secret: Uint8Array;
    name?: string;
    issuer?: string;
    algorithm?: number;
    digits?: number;
    type?: number;
}

interface MigrationPayloadProto {
    otpParameters?: OtpParametersProto[];
    version?: number;
    batchSize?: number;
    batchIndex?: number;
    batchId?: number;
}

const root = protobuf.parse(GOOGLE_AUTH_PROTO).root;
const MigrationPayload = root.lookupType('MigrationPayload');

const encodeBase32 = (buffer: Uint8Array): string => {
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
};

const createTwoFAItem = (
    data: Partial<TwoFAItem>,
    existingSecrets: Set<string>
): TwoFAItem | null => {
    const secret = data.secret?.replace(/\s+/g, '').toUpperCase();
    if (!secret || existingSecrets.has(secret)) return null;

    const item: TwoFAItem = {
        id: generateItemId(),
        account: data.account || 'Conta Importada',
        issuer: data.issuer || 'Importado',
        secret,
        algorithm: data.algorithm || 'SHA1',
        digits: data.digits || 6,
        period: data.period || 30,
        type: data.type || 'totp',
    };

    existingSecrets.add(secret);
    return item;
};

const getErrorMessage = (error: unknown): string =>
    error instanceof Error ? error.message : String(error);

export const importGoogleAuth = async (filePath: string, store: Store): Promise<ImportResult> => {
    try {
        const fileContent = (await readFile(filePath, 'utf-8')).trim();

        if (!fileContent.startsWith('otpauth-migration://offline?data=')) {
            return { success: false, error: 'O arquivo não contém um link válido do otpauth-migration' };
        }

        const dataPart = fileContent.replace('otpauth-migration://offline?data=', '');
        const decodedData = Buffer.from(decodeURIComponent(dataPart), 'base64');
        const message = MigrationPayload.decode(decodedData) as MigrationPayloadProto;

        if (!message.otpParameters?.length) {
            return { success: false, error: 'Nenhum token encontrado' };
        }

        const newItems: TwoFAItem[] = [];
        const existingSecrets = getExistingSecrets(store);

        for (const otp of message.otpParameters) {
            const secretBase32 = encodeBase32(otp.secret);
            const item = createTwoFAItem(
                {
                    account: otp.name || 'Conta Google Auth',
                    issuer: otp.issuer || 'Google Authenticator',
                    secret: secretBase32,
                    algorithm: ALGORITHM_MAP[otp.algorithm ?? 0] || 'SHA1',
                    digits: otp.digits === 2 ? 8 : 6,
                    period: 30,
                    type: otp.type === 1 ? 'hotp' : 'totp',
                },
                existingSecrets
            );

            if (item) {
                newItems.push(item);
            }
        }

        if (newItems.length > 0) {
            appendItems(store, newItems);
        }

        return { success: newItems.length > 0, count: newItems.length };
    } catch (error) {
        console.error('Erro na importação Google Authenticator:', error);
        return { success: false, error: 'Ocorreu um erro inesperado durante a importação.' };
    }
};

export const importAuthy = async (filePath: string, store: Store): Promise<ImportResult> => {
    try {
        const fileContent = await readFile(filePath, 'utf-8');
        const existingSecrets = getExistingSecrets(store);
        const newItems: TwoFAItem[] = [];

        const addItem = (entry: Record<string, unknown>): void => {
            if (!entry || typeof entry !== 'object') return;
            const item = createTwoFAItem(
                {
                    account: (entry.name || entry.account || entry.label) as string | undefined,
                    issuer: (entry.issuer || entry.provider) as string | undefined,
                    secret: (entry.secret || entry.decrypted_seed || entry.seed) as string | undefined,
                    algorithm: entry.algorithm as string | undefined,
                    digits: entry.digits as number | undefined,
                    period: entry.period as number | undefined,
                    type: entry.type as string | undefined,
                },
                existingSecrets
            );

            if (item) {
                newItems.push(item);
            }
        };

        try {
            const data = JSON.parse(fileContent);
            let entries: Record<string, unknown>[] = [];

            if (Array.isArray(data)) {
                entries = data;
            } else if (data.entries && Array.isArray(data.entries)) {
                entries = data.entries;
            } else if (data.tokens && Array.isArray(data.tokens)) {
                entries = data.tokens;
            } else if (data.items && Array.isArray(data.items)) {
                entries = data.items;
            } else {
                entries = [data];
            }

            entries.forEach(addItem);
        } catch {
            // Not valid JSON, proceed to URI parsing
        }

        if (newItems.length === 0) {
            const lines = fileContent.split(/\r?\n/);
            for (const line of lines) {
                const trimmed = line.trim();
                if (trimmed.startsWith('otpauth://')) {
                    try {
                        const parsed = OTPAuth.URI.parse(trimmed);
                        if (parsed) {
                            addItem({
                                account: parsed.label as unknown as string,
                                issuer: parsed.issuer,
                                secret: parsed.secret?.base32,
                                algorithm: parsed.algorithm,
                                digits: parsed.digits,
                                period: parsed instanceof OTPAuth.TOTP ? parsed.period : 30,
                                type: 'totp',
                            });
                        }
                    } catch {
                        console.error('Falha ao processar URI:', trimmed);
                    }
                } else if (trimmed.length > 10 && !trimmed.includes(' ')) {
                    addItem({ secret: trimmed });
                }
            }
        }

        if (newItems.length > 0) {
            appendItems(store, newItems);
        }

        return { success: newItems.length > 0, count: newItems.length };
    } catch (error) {
        console.error('Erro na importação Authy:', error);
        return { success: false, error: getErrorMessage(error) };
    }
};

export const importEncrypted = async (
    filePath: string,
    password: string,
    store: Store
): Promise<ImportResult> => {
    try {
        const fileContent = await readFile(filePath, 'utf-8');
        let backupData: unknown;

        try {
            backupData = JSON.parse(fileContent);
        } catch {
            return { success: false, error: 'Invalid backup file format' };
        }

        if (!validateEncryptedBackup(backupData)) {
            return { success: false, error: 'Invalid backup file structure' };
        }

        const decrypted = await decryptData(backupData, password);
        const importedItems: TwoFAItem[] = JSON.parse(decrypted);

        const itemsWithNewIds = importedItems.map(item => ({
            ...item,
            id: generateItemId(),
        }));

        appendItems(store, itemsWithNewIds);
        return { success: true, count: itemsWithNewIds.length };
    } catch (error) {
        console.error('Import decryption error:', error);
        const message = getErrorMessage(error);
        if (message.includes('auth tag')) {
            return { success: false, error: 'Senha incorreta ou arquivo corrompido' };
        }
        return { success: false, error: message };
    }
};

export const importPlain = async (
    filePath: string,
    store: Store
): Promise<ImportResult> => {
    try {
        const fileContent = await readFile(filePath, 'utf-8');
        const importedItems: TwoFAItem[] = JSON.parse(fileContent);

        const itemsWithNewIds = importedItems.map(item => ({
            ...item,
            id: generateItemId(),
        }));

        appendItems(store, itemsWithNewIds);
        return { success: true, count: itemsWithNewIds.length };
    } catch (error) {
        return { success: false, error: getErrorMessage(error) };
    }
};
