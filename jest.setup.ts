import '@testing-library/jest-dom';

// Mock window.electron
Object.defineProperty(window, 'electron', {
  value: {
    hasMasterPassword: jest.fn(),
    checkMasterPassword: jest.fn(),
    setMasterPassword: jest.fn(),
    get2FAItems: jest.fn(),
    add2FAItem: jest.fn(),
    remove2FAItem: jest.fn(),
    update2FAItem: jest.fn(),
    set2FAItems: jest.fn(),
    scanScreen: jest.fn(),
    scanScreenQR: jest.fn(),
    openExternal: jest.fn(),
    getSettings: jest.fn(),
    setSettings: jest.fn(),
    on: jest.fn(),
    off: jest.fn(),
    setLockTimer: jest.fn(),
    export2FA: jest.fn(),
    export2FAEncrypted: jest.fn(),
    import2FA: jest.fn(),
    import2FAEncrypted: jest.fn(),
    importAuthy: jest.fn(),
    toggleBlur: jest.fn(),
    verifyMasterPassword: jest.fn(),
    onProtocolUrl: jest.fn(() => jest.fn()),
  },
  writable: true,
});

// Mock ResizeObserver
global.ResizeObserver = class ResizeObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
};
