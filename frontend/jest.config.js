// frontend/jest.config.js

module.exports = {
  // Points Jest to our setup file. It will run this before every test.
  setupFilesAfterEnv: ['<rootDir>/src/jest.setup.ts'],
  
  // Specifies the test environment. 'jsdom' simulates a browser environment.
  testEnvironment: 'jest-environment-jsdom',

  // Other Jest configurations can go here...
  // For example, mapping for CSS files:
  moduleNameMapper: {
    '\\.(css|less|scss|sass)$': 'identity-obj-proxy',
  },
};