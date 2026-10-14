export default {
    preset: 'ts-jest',
    testEnvironment: 'jsdom',
    setupFilesAfterEnv: ['<rootDir>/jest.setup.ts'],
    moduleNameMapper: {
      '\\.(css|less|scss|sass)$': 'identity-obj-proxy',
       '\\.(jpg|jpeg|png|gif|webp|svg)$': '<rootDir>/__mocks__/fileMock.ts',
      'react-dom/test-utils$': '<rootDir>/jest/test-utils-mock.ts'
    },
    transform: {
      '^.+\\.tsx?$': ['ts-jest', {
        tsconfig: 'tsconfig.json',
      }],
    },
    testMatch: [
      '**/src/renderer/**/*.test.{ts,tsx}',
      '**/src/main/**/*.test.ts'
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
