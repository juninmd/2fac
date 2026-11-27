export default {
   preset: 'ts-jest',
   testEnvironment: 'jsdom',
   setupFilesAfterEnv: ['<rootDir>/jest.setup.ts'],
   moduleNameMapper: {
     '\\.(css|less|scss|sass)$': 'identity-obj-proxy',
      '\\.(jpg|jpeg|png|gif|webp|svg)$': '<rootDir>/__mocks__/fileMock.ts'
   },
   transform: {
     '^.+\\.tsx?$': ['ts-jest', {
       tsconfig: 'tsconfig.json',
     }],
     // O Sonido é publicado só como ESM; o ts-jest converte o bundle para CJS
     // para o Jest (CommonJS) conseguir carregar os componentes de verdade.
     '^.+\\.js$': ['ts-jest', {
       tsconfig: {
         allowJs: true,
         module: 'CommonJS',
         moduleResolution: 'node',
         target: 'ES2020',
         esModuleInterop: true,
         jsx: 'react-jsx',
         skipLibCheck: true,
       },
       diagnostics: false,
     }],
   },
   transformIgnorePatterns: ['/node_modules/(?!.*@juninmd/sonido)'],
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
