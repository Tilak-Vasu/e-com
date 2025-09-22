// src/jest.setup.ts
import '@testing-library/jest-dom';

// This mocks the 'import.meta' object, which is not available in Jest's environment.
// We are defining a fake version of it for all our tests.
Object.defineProperty(global, 'import.meta', {
  value: {
    env: {
      // Provide mock values for any environment variables your code uses
      VITE_API_BASE_URL: 'http://mock-api.com/api',
      VITE_WS_BASE_URL: 'ws://mock-api.com/ws',
      // Add any other VITE_ variables your app needs here
    },
  },
  writable: true, // Make it writable so tests can override if needed
});