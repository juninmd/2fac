import { copyableCode } from './tokenUtils';

describe('copyableCode', () => {
    it('strips the display spacing of a code', () => {
        expect(copyableCode('123 456')).toBe('123456');
        expect(copyableCode('1234 5678')).toBe('12345678');
    });

    it('refuses things that are not a code', () => {
        expect(copyableCode('ERROR')).toBeNull();
        expect(copyableCode('')).toBeNull();
    });
});
