import { renderHook, act } from '@testing-library/react';
import { useToken } from './useToken';
import { TwoFAItem } from '../types';
import * as OTPAuth from 'otpauth';

// Mock OTPAuth
jest.mock('otpauth', () => ({
  TOTP: jest.fn().mockImplementation(() => ({
    generate: jest.fn().mockReturnValue('123456'),
  })),
  Secret: {
    fromBase32: jest.fn(),
  },
}));

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
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('should generate initial token and timeLeft', () => {
    const { result } = renderHook(() => useToken(mockItem));

    expect(result.current.token).toBe('123 456'); // Formatted
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
        // Missing algorithm, digits, period
        color: 'blue'
     } as any;

     const { result } = renderHook(() => useToken(itemWithDefaults));

     expect(result.current.period).toBe(30);
     // Verify OTPAuth was called with defaults
     expect(OTPAuth.TOTP).toHaveBeenCalledWith(expect.objectContaining({
         algorithm: 'SHA1',
         digits: 6,
         period: 30
     }));
  });

  it('should update token periodically via setInterval', () => {
    const { result } = renderHook(() => useToken(mockItem));

    // Spy on generateToken indirectly by checking if setToken is called or OTPAuth.generate is called
    // Since we can't spy on internal function easily, we check effects.

    // Clear initial calls
    (OTPAuth.TOTP as unknown as jest.Mock).mockClear();

    // Advance time by 1 second to trigger interval
    act(() => {
      jest.advanceTimersByTime(1000);
    });

    // Should have called TOTP constructor and generate again
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

  it('should clear interval on unmount', () => {
      const { unmount } = renderHook(() => useToken(mockItem));
      const clearIntervalSpy = jest.spyOn(global, 'clearInterval');

      unmount();

      expect(clearIntervalSpy).toHaveBeenCalled();
  });
});
