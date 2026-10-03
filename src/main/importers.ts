import * as OTPAuth from 'otpauth';
import * as protobuf from 'protobufjs';
import { readFile } from 'fs/promises';
import Store from 'electron-store';
import { TwoFAItem, ImportResult, AlgorithmMap } from './types';
import { createTwoFAItem, encodeBase32, getErrorMessage, normalizeSecret } from './importUtils';
import { getExistingSecrets, appendItems, generateItemId } from './store';

const existingNormalizedSecrets = (store: Store): Set<string> =>
    new Set([...getExistingSecrets(store)].map(secret => (typeof secret === 'string' ? normalizeSecret(secret) : '')));
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

const MIGRATION_PREFIX = 'otpauth-migration://offline?data=';

/** Google costuma exportar "Emissor:conta" no campo name; separa quando faz sentido. */
const splitGoogleName = (name: string, issuer: string): { account: string; issuer: string } => {
    const separator = name.indexOf(':');
    if (separator < 0) return { account: name, issuer };
    const prefix = name.slice(0, separator).trim();
    const account = name.slice(separator + 1).trim();
    if (!issuer) return { account, issuer: prefix };
    return { account: prefix === issuer ? account : name, issuer };
};

export const importGoogleAuth = async (filePath: string, store: Store): Promise<ImportResult> => {
    try {
        const links = (await readFile(filePath, 'utf-8'))
            .split(/\r?\n/)
            .map(line => line.trim())
            .filter(line => line.startsWith(MIGRATION_PREFIX));

        if (links.length === 0) {
            return { success: false, error: 'O arquivo não contém um link válido do otpauth-migration' };
        }

        const params = links.flatMap(link => {
            const decodedData = Buffer.from(decodeURIComponent(link.slice(MIGRATION_PREFIX.length)), 'base64');
            return (MigrationPayload.decode(decodedData) as MigrationPayloadProto).otpParameters ?? [];
        });

        if (params.length === 0) {
            return { success: false, error: 'Nenhum token encontrado' };
        }

        const newItems: TwoFAItem[] = [];
        const existingSecrets = existingNormalizedSecrets(store);

        for (const otp of params) {
            const { account, issuer } = splitGoogleName(otp.name || '', otp.issuer || '');
            const item = createTwoFAItem(
                {
                    account: account || 'Conta Google Auth',
                    issuer: issuer || 'Google Authenticator',
                    secret: encodeBase32(otp.secret),
                    algorithm: ALGORITHM_MAP[otp.algorithm ?? 0],
                    digits: otp.digits === 2 ? 8 : 6,
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

const BARE_SECRET_MIN_LENGTH = 16;

const extractEntries = (data: unknown): unknown[] => {
    if (Array.isArray(data)) return data;
    if (!data || typeof data !== 'object') return [];
    const record = data as Record<string, unknown>;
    for (const key of ['entries', 'tokens', 'items']) {
        if (Array.isArray(record[key])) return record[key] as unknown[];
    }
    return [record];
};

export const importAuthy = async (filePath: string, store: Store): Promise<ImportResult> => {
    try {
        const fileContent = await readFile(filePath, 'utf-8');
        const existingSecrets = existingNormalizedSecrets(store);
        const newItems: TwoFAItem[] = [];

        const addItem = (entry: Record<string, unknown>, minSecretLength?: number): void => {
            const item = createTwoFAItem(
                {
                    account: (entry.name || entry.account || entry.label) as string | undefined,
                    issuer: (entry.issuer || entry.provider) as string | undefined,
                    secret: (entry.secret || entry.decrypted_seed || entry.seed) as string | undefined,
                    algorithm: entry.algorithm,
                    digits: entry.digits,
                    period: entry.period,
                    type: entry.type as string | undefined,
                    minSecretLength,
                },
                existingSecrets
            );

            if (item) {
                newItems.push(item);
            }
        };

        let isJson = true;
        try {
            extractEntries(JSON.parse(fileContent)).forEach(entry => {
                if (entry && typeof entry === 'object') addItem(entry as Record<string, unknown>);
            });
        } catch {
            isJson = false;
        }

        // Só interpreta como lista de URIs/segredos se o arquivo não for JSON
        if (!isJson) {
            for (const line of fileContent.split(/\r?\n/)) {
                const trimmed = line.trim();
                if (trimmed.startsWith('otpauth://')) {
                    try {
                        const parsed = OTPAuth.URI.parse(trimmed);
                        addItem({
                            account: parsed.label,
                            issuer: parsed.issuer,
                            secret: parsed.secret.base32,
                            algorithm: parsed.algorithm,
                            digits: parsed.digits,
                            period: parsed instanceof OTPAuth.TOTP ? parsed.period : undefined,
                            type: parsed instanceof OTPAuth.HOTP ? 'hotp' : 'totp',
                        });
                    } catch {
                        console.error('Falha ao processar URI otpauth');
                    }
                } else if (trimmed && !trimmed.startsWith('#')) {
                    addItem({ secret: trimmed }, BARE_SECRET_MIN_LENGTH);
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

/** Importa itens de um backup do próprio 2FAC: valida, gera novos ids e ignora segredos já existentes. */
const importOwnBackup = (data: unknown, store: Store): ImportResult => {
    if (!Array.isArray(data)) {
        return { success: false, error: 'Formato inválido: esperado uma lista de contas' };
    }

    const seen = new Set<string>([...getExistingSecrets(store)]);
    const newItems: TwoFAItem[] = [];

    for (const entry of data as Partial<TwoFAItem>[]) {
        const secret = typeof entry?.secret === 'string' ? entry.secret.trim() : '';
        if (!secret || seen.has(secret)) continue;
        seen.add(secret);
        newItems.push({ ...entry, secret, id: generateItemId() } as TwoFAItem);
    }

    if (newItems.length > 0) {
        appendItems(store, newItems);
    }
    return { success: newItems.length > 0, count: newItems.length };
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

        let decrypted: string;
        try {
            decrypted = await decryptData(backupData, password);
        } catch {
            // AES-GCM falha na verificação da tag tanto com senha errada quanto com arquivo adulterado
            return { success: false, error: 'Senha incorreta ou arquivo corrompido' };
        }

        return importOwnBackup(JSON.parse(decrypted), store);
    } catch (error) {
        console.error('Import decryption error:', error);
        return { success: false, error: getErrorMessage(error) };
    }
};

export const importPlain = async (filePath: string, store: Store): Promise<ImportResult> => {
    try {
        return importOwnBackup(JSON.parse(await readFile(filePath, 'utf-8')), store);
    } catch (error) {
        return { success: false, error: getErrorMessage(error) };
    }
};
