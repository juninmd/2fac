import '@testing-library/jest-dom';
import type { TwoFAItem, AppSettings } from './src/renderer/types';

// Mock window.electron — mirrors the API exposed by preload/preload.ts
Object.defineProperty(window, 'electron', {
  value: {
    get2FAItems: jest.fn<Promise<TwoFAItem[]>, []>(),
    add2FAItem: jest.fn<Promise<TwoFAItem>, [Omit<TwoFAItem, 'id'>]>(),
    remove2FAItem: jest.fn<Promise<boolean>, [string]>(),
    update2FAItem: jest.fn<Promise<TwoFAItem | null>, [string, Partial<TwoFAItem>]>(),
    set2FAItems: jest.fn<Promise<boolean>, [TwoFAItem[]]>(),
    export2FA: jest.fn<Promise<{ success: boolean; path?: string }>, []>(),
    export2FAEncrypted: jest.fn<Promise<{ success: boolean; path?: string; error?: string }>, [string]>(),
    import2FA: jest.fn<Promise<{ success: boolean; count?: number }>, []>(),
    import2FAEncrypted: jest.fn<Promise<{ success: boolean; count?: number; error?: string }>, [string]>(),
    importAuthy: jest.fn<Promise<{ success: boolean; count?: number; error?: string }>, []>(),
    importGoogleAuth: jest.fn<Promise<{ success: boolean; count?: number; error?: string }>, []>(),
    scanScreenQR: jest.fn<Promise<{ success: boolean; data?: string; error?: string }>, []>(),
    setMasterPassword: jest.fn<Promise<boolean>, [string]>(),
    checkMasterPassword: jest.fn<Promise<boolean>, [string]>(),
    hasMasterPassword: jest.fn<Promise<boolean>, []>(),
    getSettings: jest.fn<Promise<AppSettings>, []>(),
    setSettings: jest.fn<Promise<boolean>, [AppSettings]>(),
    onProtocolUrl: jest.fn<(callback: (url: string) => void) => () => void, [(url: string) => void]>(),
  },
  writable: true,
});

// Mock ResizeObserver
global.ResizeObserver = class ResizeObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
};
