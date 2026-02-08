/**
 * Jest Configuration
 */

module.exports = {
  // Test environment
  testEnvironment: 'jsdom',

  // Setup files (runs after test framework is installed)
  setupFilesAfterEnv: ['<rootDir>/src/setupTests.ts'],

  // Treat these files as ES modules
  extensionsToTreatAsEsm: ['.ts', '.tsx'],

  // Module paths
  roots: ['<rootDir>/src'],

  // Test match patterns
  testMatch: [
    '**/__tests__/**/*.+(ts|tsx|js)',
    '**/?(*.)+(spec|test).+(ts|tsx|js)',
  ],

  // Transform files
  transform: {
    '^.+\\.(ts|tsx)$': ['ts-jest', {
      tsconfig: {
        jsx: 'react',
        esModuleInterop: true,
        allowSyntheticDefaultImports: true,
      },
    }],
    '^.+\\.(js|mjs)$': ['babel-jest'],
  },

  // Module name mapper for CSS and assets
  moduleNameMapper: {
    '^msw/node$': '<rootDir>/../node_modules/msw/lib/node/index.js',
    '^msw$': '<rootDir>/../node_modules/msw/lib/core/index.js',
    '^@mswjs/interceptors/ClientRequest$': '<rootDir>/../node_modules/@mswjs/interceptors/lib/node/interceptors/ClientRequest/index.cjs',
    '^@mswjs/interceptors/XMLHttpRequest$': '<rootDir>/../node_modules/@mswjs/interceptors/lib/node/interceptors/XMLHttpRequest/index.cjs',
    '^@mswjs/interceptors/fetch$': '<rootDir>/../node_modules/@mswjs/interceptors/lib/node/interceptors/fetch/index.cjs',
    '^@mswjs/interceptors$': '<rootDir>/../node_modules/@mswjs/interceptors/lib/node/index.cjs',
    '\\.(css|less|scss|sass)$': 'identity-obj-proxy',
    '\\.(jpg|jpeg|png|gif|svg)$': '<rootDir>/src/tests/__mocks__/fileMock.js',
  },

  // Coverage configuration
  collectCoverageFrom: [
    'src/**/*.{ts,tsx}',
    '!src/**/*.d.ts',
    '!src/tests/**',
    '!src/**/*.stories.tsx',
    '!src/index.tsx',
  ],

  coverageThreshold: {
    global: {
      branches: 70,
      functions: 70,
      lines: 70,
      statements: 70,
    },
  },

  // Coverage reporters
  coverageReporters: ['text', 'lcov', 'html'],

  // Ignore patterns
  testPathIgnorePatterns: ['/node_modules/', '/build/'],

  // Transform ESM modules from node_modules
  transformIgnorePatterns: [
    'node_modules/(?!(msw|until-async)/)',
  ],

  // Module file extensions
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json', 'mjs'],

  // Verbose output
  verbose: true,

  // Clear mocks between tests
  clearMocks: true,
  resetMocks: true,
  restoreMocks: true,
}
