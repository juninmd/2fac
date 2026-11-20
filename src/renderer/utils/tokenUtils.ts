/** Digits to put on the clipboard, or null when the display is not a code (ERROR, empty). */
export const copyableCode = (token: string): string | null => {
    const raw = token.replace(/\s/g, '');
    return /^\d+$/.test(raw) ? raw : null;
};
