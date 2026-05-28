import * as fs from 'fs';
import * as OTPAuth from 'otpauth';
import { ImportResult, TwoFAItem } from '../types';
import { getExistingSecrets, addUniqueItems, parseJsonContent } from './base';
import { getTwoFAItems, setTwoFAItems } from '../store';

export async function importAuthy(filePath: string): Promise<ImportResult> {
    try {
        const fileContent = fs.readFileSync(filePath, 'utf-8');
        const existingSecrets = getExistingSecrets();
        const allNewItems: Partial<TwoFAItem>[] = [];

        const addItem = (entry: Partial<TwoFAItem>) => {
            const secret = (entry.secret || '').replace(/\s+/g, '').toUpperCase();
            if (!secret || existingSecrets.has(secret)) return;

            allNewItems.push({
                account: entry.account || entry.issuer || 'Conta Importada',
                issuer: entry.issuer || 'Authy/Importado',
                secret,
                algorithm: entry.algorithm || 'SHA1',
                digits: entry.digits || 6,
                period: entry.period || 30,
                type: entry.type || 'totp',
            });
            existingSecrets.add(secret);
        };

        // 1. Try JSON parsing
        try {
            const entries = parseJsonContent(fileContent);
            entries.forEach(addItem);
        } catch {
            // Not valid JSON, proceed to URI parsing
        }

        // 2. Try OTPAuth URI parsing
        if (allNewItems.length === 0) {
            const lines = fileContent.split(/\r?\n/);
            for (const line of lines) {
                const trimmed = line.trim();
                if (trimmed.startsWith('otpauth://')) {
                    try {
                        const parsed = OTPAuth.URI.parse(trimmed);
                        if (parsed) {
                            addItem({
                                account: parsed.label,
                                issuer: parsed.issuer,
                                secret: parsed.secret.base32,
                                algorithm: parsed.algorithm,
                                digits: parsed.digits,
                                period: parsed instanceof OTPAuth.TOTP ? (parsed as OTPAuth.TOTP).period : 30,
                                type: 'totp',
                            });
                        }
                    } catch {
                        // Skip invalid URIs
                    }
                } else if (trimmed.length > 10 && !trimmed.includes(' ')) {
                    addItem({ secret: trimmed });
                }
            }
        }

        if (allNewItems.length > 0) {
            const { newItems } = addUniqueItems(allNewItems, existingSecrets);
            if (newItems.length > 0) {
                const currentItems = getTwoFAItems();
                setTwoFAItems([...currentItems, ...newItems]);
                return { success: true, count: newItems.length };
            }
        }

        return { success: false, error: 'Nenhum token válido encontrado no arquivo.' };
    } catch (error: unknown) {
        const message = error instanceof Error ? error.message : String(error);
        console.error('Erro na importação Authy:', error);
        return { success: false, error: message };
    }
}
