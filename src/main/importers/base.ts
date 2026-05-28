import { TwoFAItem } from '../types';
import { getTwoFAItems } from '../store';
import { createItemWithDefaults } from '../crypto';

export function getExistingSecrets(): Set<string> {
    const items = getTwoFAItems();
    return new Set(items.map((i) => i.secret));
}

export function addUniqueItems(
    items: Partial<TwoFAItem>[],
    existingSecrets: Set<string>
): { newItems: TwoFAItem[]; skippedCount: number } {
    const newItems: TwoFAItem[] = [];
    let skippedCount = 0;

    for (const item of items) {
        const secret = (item.secret || '').replace(/\s+/g, '').toUpperCase();
        if (!secret || existingSecrets.has(secret)) {
            skippedCount++;
            continue;
        }

        newItems.push(createItemWithDefaults({ ...item, secret }));
        existingSecrets.add(secret);
    }

    return { newItems, skippedCount };
}

export function parseJsonContent(fileContent: string): Partial<TwoFAItem>[] {
    const data = JSON.parse(fileContent);
    let entries: Partial<TwoFAItem>[] = [];

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

    return entries;
}
