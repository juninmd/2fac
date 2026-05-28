import type { Config } from 'jest';

const config: Config = {
  preset: 'ts-jest',
  testEnvironment: 'jsdom',
  setupFilesAfterEnv: ['<rootDir>/jest.setup.ts'],
  moduleNameMapper: {
    '^(\\.{1,2}/.*)\\.js$': '$1',
    '\\.(css|less|scss|sass)$': 'identity-obj-proxy',
    '\\.(jpg|jpeg|png|gif|webp|svg)$': '<rootDir>/__mocks__/fileMock.js',
  },
  transform: {
    '^.+\\.tsx?$': ['ts-jest', {
      tsconfig: 'tsconfig.jest.json',
      diagnostics: {
        ignoreCodes: [151002],
      },
    }],
  },
  testMatch: [
    '**/src/renderer/**/*.test.{ts,tsx}',
  ],
  collectCoverage: true,
  collectCoverageFrom: [
    'src/renderer/**/*.{ts,tsx}',
    '!src/renderer/index.tsx',
    '!src/renderer/types.ts',
    '!src/renderer/**/*.d.ts',
  ],
  coverageThreshold: {
    global: {
      branches: 80,
      functions: 90,
      lines: 90,
      statements: 90,
    },
  },
};

export default config;
