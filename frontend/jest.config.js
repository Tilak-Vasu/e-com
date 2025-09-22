// frontend/jest.config.js

module.exports = {
  // Specifies the test environment. 'jsdom' simulates a browser environment.
  testEnvironment: 'jest-environment-jsdom',

  // Points Jest to our setup file. It will run this before every test.
  setupFilesAfterEnv: ['<rootDir>/src/jest.setup.ts'],

  // Tells Jest how to handle TypeScript files (.ts, .tsx)
  transform: {
    '^.+\\.tsx?$': 'ts-jest',
  },

  // Mocks CSS imports so they don't crash the tests
  moduleNameMapper: {
    '\\.(css|less|scss|sass)$': 'identity-obj-proxy',
  },
};