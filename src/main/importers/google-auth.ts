import * as fs from 'fs';
import * as protobuf from 'protobufjs';
import { ImportResult, TwoFAItem } from '../types';
import { getExistingSecrets } from './base';
import { encodeBase32, getAlgorithmName, generateId } from '../crypto';
import { getTwoFAItems, setTwoFAItems } from '../store';

const googleAuthProto = `
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

const root = protobuf.parse(googleAuthProto).root;
const MigrationPayload = root.lookupType('MigrationPayload');

function parseMigrationUri(fileContent: string): string | null {
    const trimmed = fileContent.trim();
    if (!trimmed.startsWith('otpauth-migration://offline?data=')) {
        return null;
    }
    return trimmed.replace('otpauth-migration://offline?data=', '');
}

function extractOtpParameters(decodedData: Buffer): TwoFAItem[] {
    const message = MigrationPayload.decode(decodedData) as { otpParameters?: Array<{
        secret: Uint8Array;
        name?: string;
        issuer?: string;
        algorithm?: number;
        digits?: number;
        type?: number;
    }> };

    if (!message.otpParameters || message.otpParameters.length === 0) {
        return [];
    }

    return message.otpParameters.map((otp) => ({
        id: '',
        account: otp.name || 'Conta Google Auth',
        issuer: otp.issuer || 'Google Authenticator',
        secret: encodeBase32(otp.secret),
        algorithm: getAlgorithmName(otp.algorithm || 1),
        digits: otp.digits === 2 ? 8 : 6,
        period: 30,
        type: otp.type === 1 ? 'hotp' : 'totp',
    }));
}

export async function importGoogleAuth(filePath: string): Promise<ImportResult> {
    try {
        const fileContent = fs.readFileSync(filePath, 'utf-8');
        const dataPart = parseMigrationUri(fileContent);

        if (!dataPart) {
            return { success: false, error: 'O arquivo não contém um link válido do otpauth-migration' };
        }

        const decodedData = Buffer.from(decodeURIComponent(dataPart), 'base64');
        const otpItems = extractOtpParameters(decodedData);

        if (otpItems.length === 0) {
            return { success: false, error: 'Nenhum token encontrado' };
        }

        const existingSecrets = getExistingSecrets();
        const newItems: TwoFAItem[] = [];

        for (const item of otpItems) {
            if (!item.secret || existingSecrets.has(item.secret)) continue;
            newItems.push({ ...item, id: generateId() });
            existingSecrets.add(item.secret);
        }

        if (newItems.length > 0) {
            const currentItems = getTwoFAItems();
            setTwoFAItems([...currentItems, ...newItems]);
            return { success: true, count: newItems.length };
        }

        return { success: false, error: 'Nenhum token novo encontrado (já existem ou inválidos)' };
    } catch (error: unknown) {
        console.error('Erro na importação Google Authenticator:', error);
        return { success: false, error: 'Ocorreu um erro inesperado durante a importação.' };
    }
}
