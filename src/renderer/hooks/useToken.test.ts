import { renderHook, act } from '@testing-library/react';
import { useToken } from './useToken';
import { TwoFAItem } from '../types';
import * as OTPAuth from 'otpauth';

// Mock OTPAuth
jest.mock('otpauth', () => {
  const mockSecretInstance = { buffer: new Uint8Array() };
  const mockSecretConstructor = jest.fn().mockImplementation((config) => mockSecretInstance);
  (mockSecretConstructor as any).fromBase32 = jest.fn().mockReturnValue(mockSecretInstance);
  (mockSecretConstructor as any).fromHex = jest.fn().mockReturnValue(mockSecretInstance);
  (mockSecretConstructor as any).fromLatin1 = jest.fn().mockReturnValue(mockSecretInstance);
  // fromBase64 is NOT on the object, so no mock needed, but we can't call it.

  return {
    TOTP: jest.fn().mockImplementation(() => ({
      generate: jest.fn().mockReturnValue('123456'),
    })),
    Secret: mockSecretConstructor
  };
});

describe('useToken', () => {
  const mockItem: TwoFAItem = {
    id: '1',
    account: 'test@example.com',
    issuer: 'Google',
    secret: 'JBSWY3DPEHPK3PXP',
    algorithm: 'SHA1',
    digits: 6,
    period: 30,
    color: 'red',
  };

  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
    if (!global.atob) {
        global.atob = (str: string) => Buffer.from(str, 'base64').toString('binary');
    }
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('should generate initial token and timeLeft', () => {
    const { result } = renderHook(() => useToken(mockItem));

    expect(result.current.token).toBe('123 456');
    expect(result.current.period).toBe(30);
    expect(result.current.timeLeft).toBeGreaterThan(0);
    expect(result.current.timeLeft).toBeLessThanOrEqual(30);
  });

  it('should use defaults if item properties are missing', () => {
     const itemWithDefaults: TwoFAItem = {
        id: '2',
        account: 'default@example.com',
        issuer: 'Default',
        secret: 'SECRET',
        color: 'blue'
     } as any;

     const { result } = renderHook(() => useToken(itemWithDefaults));

     expect(result.current.period).toBe(30);
     expect(OTPAuth.TOTP).toHaveBeenCalledWith(expect.objectContaining({
         algorithm: 'SHA1',
         digits: 6,
         period: 30
     }));
  });

  it('should update token periodically via setInterval', () => {
    const { result } = renderHook(() => useToken(mockItem));

    (OTPAuth.TOTP as unknown as jest.Mock).mockClear();

    act(() => {
      jest.advanceTimersByTime(1000);
    });

    expect(OTPAuth.TOTP).toHaveBeenCalled();
  });

  it('should handle non-6 digit tokens', () => {
    (OTPAuth.TOTP as unknown as jest.Mock).mockImplementationOnce(() => ({
      generate: jest.fn().mockReturnValue('12345678'),
    }));

    const item8Digits = { ...mockItem, digits: 8 };
    const { result } = renderHook(() => useToken(item8Digits));

    expect(result.current.token).toBe('12345678');
  });

  it('should handle errors in token generation', () => {
    (OTPAuth.TOTP as unknown as jest.Mock).mockImplementationOnce(() => {
      throw new Error('Invalid secret');
    });

    const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

    const { result } = renderHook(() => useToken(mockItem));

    expect(result.current.token).toBe('ERROR');
    consoleSpy.mockRestore();
  });

  it('should handle hex encoding', () => {
      const itemHex: TwoFAItem = { ...mockItem, encoding: 'hex' };
      renderHook(() => useToken(itemHex));
      expect((OTPAuth.Secret as any).fromHex).toHaveBeenCalledWith(mockItem.secret);
  });

  it('should handle ascii encoding', () => {
      const itemAscii: TwoFAItem = { ...mockItem, encoding: 'ascii' };
      renderHook(() => useToken(itemAscii));
      expect((OTPAuth.Secret as any).fromLatin1).toHaveBeenCalledWith(mockItem.secret);
  });

  it('should handle base64 encoding', () => {
      const base64Secret = 'SGVsbG8gd29ybGQ='; // "Hello world"
      const itemBase64: TwoFAItem = { ...mockItem, secret: base64Secret, encoding: 'base64' };

      renderHook(() => useToken(itemBase64));

      // Should have called constructor with buffer
      expect(OTPAuth.Secret).toHaveBeenCalledWith(expect.objectContaining({
          buffer: expect.any(ArrayBuffer)
      }));
  });

  it('should default to base32 if encoding is unknown or missing', () => {
      const itemUnknown: TwoFAItem = { ...mockItem, encoding: 'unknown' };
      renderHook(() => useToken(itemUnknown));
      expect((OTPAuth.Secret as any).fromBase32).toHaveBeenCalledWith(mockItem.secret);
  });
});
