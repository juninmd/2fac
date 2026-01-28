import { renderHook, act } from '@testing-library/react';
import { useToken } from './useToken';
import { TwoFAItem } from '../types';
import * as OTPAuth from 'otpauth';

// Mock otpauth
jest.mock('otpauth', () => {
    return {
        Secret: {
            fromBase32: jest.fn(),
            fromHex: jest.fn(),
            fromLatin1: jest.fn(),
        },
        TOTP: jest.fn().mockImplementation(() => ({
            generate: jest.fn()
        }))
    };
});

describe('useToken', () => {
    const mockItem: TwoFAItem = {
        id: '1',
        account: 'Test',
        issuer: 'Test',
        secret: 'SECRET',
        algorithm: 'SHA1',
        digits: 6,
        period: 30,
        encoding: 'base32'
    };

    beforeEach(() => {
        jest.clearAllMocks();
        // Setup default mock return
        (OTPAuth.TOTP as unknown as jest.Mock).mockImplementation(() => ({
            generate: jest.fn().mockReturnValue('123456')
        }));
    });

    it('formats 6 digit token', () => {
        (OTPAuth.TOTP as unknown as jest.Mock).mockImplementation(() => ({
            generate: jest.fn().mockReturnValue('123456')
        }));

        const { result } = renderHook(() => useToken(mockItem));

        expect(result.current.token).toBe('123 456');
    });

    it('formats 7 digit token', () => {
        (OTPAuth.TOTP as unknown as jest.Mock).mockImplementation(() => ({
            generate: jest.fn().mockReturnValue('1234567')
        }));

        const item7 = { ...mockItem, digits: 7 };
        const { result } = renderHook(() => useToken(item7));

        expect(result.current.token).toBe('123 4567');
    });

    it('formats 8 digit token', () => {
        (OTPAuth.TOTP as unknown as jest.Mock).mockImplementation(() => ({
            generate: jest.fn().mockReturnValue('12345678')
        }));

        const item8 = { ...mockItem, digits: 8 };
        const { result } = renderHook(() => useToken(item8));

        expect(result.current.token).toBe('1234 5678');
    });

    it('returns raw token for other lengths', () => {
        (OTPAuth.TOTP as unknown as jest.Mock).mockImplementation(() => ({
            generate: jest.fn().mockReturnValue('12345')
        }));

        const item5 = { ...mockItem, digits: 5 };
        const { result } = renderHook(() => useToken(item5));

        expect(result.current.token).toBe('12345');
    });
});
