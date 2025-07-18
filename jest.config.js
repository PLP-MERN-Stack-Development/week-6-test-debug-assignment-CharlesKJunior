// Root Jest configuration for MERN stack (Week 6 Assignment)
module.exports = {
  projects: [
    // Server-side tests (Unit + Integration)
    {
      displayName: 'server',
      testEnvironment: 'node',
      testMatch: [
        '<rootDir>/server/tests/unit/**/*.test.js',
        '<rootDir>/server/tests/integration/**/*.test.js'
      ],
      setupFilesAfterEnv: ['<rootDir>/server/tests/setup.js'],
      moduleFileExtensions: ['js', 'json'],
      coverageDirectory: '<rootDir>/coverage/server',
      collectCoverageFrom: [
        'server/src/**/*.js',
        '!server/src/config/**', // Exclude config files
        '!server/src/index.js',  // Exclude app entry point
      ],
      globalSetup: '<rootDir>/server/tests/mongo.setup.js', // Test DB
    },

    // Client-side tests (Unit + Integration)
    {
      displayName: 'client',
      testEnvironment: 'jsdom',
      testMatch: [
        '<rootDir>/client/src/tests/unit/**/*.test.{js,jsx}',
        '<rootDir>/client/src/tests/integration/**/*.test.{js,jsx}'
      ],
      moduleNameMapper: {
        '\\.(css|less|scss)$': 'identity-obj-proxy',
        '\\.(jpg|svg)': '<rootDir>/client/src/tests/__mocks__/fileMock.js',
        '^@/(.*)$': '<rootDir>/client/src/$1', // Alias support
      },
      setupFilesAfterEnv: [
        '@testing-library/jest-dom/extend-expect',
        '<rootDir>/client/src/tests/setup.js'
      ],
      transform: {
        '^.+\\.(js|jsx)$': 'babel-jest',
      },
      coverageDirectory: '<rootDir>/coverage/client',
      collectCoverageFrom: [
        'client/src/**/*.{js,jsx}',
        '!client/src/main.jsx',     // Exclude entry point
        '!client/src/**/*.stories.js', // Exclude Storybook
      ],
    },
  ],

  // Global configurations (applies to all projects)
  verbose: true,
  collectCoverage: true,
  coverageReporters: ['text', 'lcov', 'html'],
  coverageThreshold: {
    global: {
      statements: 70,  // Matches assignment requirement
      branches: 60,
      functions: 70,
      lines: 70,
    },
  },
  testTimeout: 10000,
};