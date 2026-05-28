import { renderHook, act } from '@testing-library/react';
import { useToken } from './useToken.js';
import { TwoFAItem } from '../types.js';
import * as OTPAuth from 'otpauth';

// Mock otpauth
jest.mock('otpauth', () => {
    const Secret = jest.fn();
    (Secret as any).fromBase32 = jest.fn();
    (Secret as any).fromHex = jest.fn();
    (Secret as any).fromLatin1 = jest.fn();

    return {
        Secret: Secret,
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

    it('handles base64 encoded secret correctly', () => {
        // Mock valid base64
        const base64Secret = 'SGVsbG8='; // "Hello"
        const itemBase64: TwoFAItem = { ...mockItem, encoding: 'base64', secret: base64Secret };

        // We expect OTPAuth.Secret constructor to be called
        const { result } = renderHook(() => useToken(itemBase64));

        expect(OTPAuth.Secret).toHaveBeenCalled();
        // Verify token is generated (mocked return value)
        expect(result.current.token).toBe('123 456');
    });

    it('handles invalid base64 gracefully', () => {
        // Mock invalid base64 (not divisible by 4 or invalid chars, though atob is lenient in some envs)
        // But here we rely on atob throwing or returning something.
        // Let's force atob to throw if possible, or just check that it doesn't crash app

        // Mock atob to throw error for this test
        const originalAtob = window.atob;
        window.atob = jest.fn().mockImplementation(() => { throw new Error('Invalid Base64'); });

        const itemInvalid = { ...mockItem, encoding: 'base64', secret: 'INVALID!!!' };

        console.error = jest.fn(); // Suppress error log

        const { result } = renderHook(() => useToken(itemInvalid as any));

        // Should fall back to empty Secret() call in catch block
        expect(OTPAuth.Secret).toHaveBeenCalled();
        expect(console.error).toHaveBeenCalledWith('Invalid Base64 secret', expect.any(Error));

        window.atob = originalAtob;
    });

    it('handles hex encoded secret correctly', () => {
        const itemHex: TwoFAItem = { ...mockItem, encoding: 'hex', secret: '1234abcd' };

        const { result } = renderHook(() => useToken(itemHex));

        expect(OTPAuth.Secret.fromHex).toHaveBeenCalledWith('1234abcd');
        expect(result.current.token).toBe('123 456');
    });

    it('handles ascii encoded secret correctly', () => {
        const itemAscii: TwoFAItem = { ...mockItem, encoding: 'ascii', secret: 'ascii_secret' };

        const { result } = renderHook(() => useToken(itemAscii));

        expect(OTPAuth.Secret.fromLatin1).toHaveBeenCalledWith('ascii_secret');
        expect(result.current.token).toBe('123 456');
    });

    it('handles general generation error gracefully', () => {
        (OTPAuth.TOTP as unknown as jest.Mock).mockImplementation(() => {
            throw new Error('TOTP Error');
        });
        console.error = jest.fn();

        const { result } = renderHook(() => useToken(mockItem));

        expect(console.error).toHaveBeenCalledWith('Failed to generate token:', expect.any(Error));
        expect(result.current.token).toBe('ERROR');
    });
});
