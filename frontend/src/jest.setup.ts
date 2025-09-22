// frontend/src/jest.setup.ts
import '@testing-library/jest-dom';
import { TextEncoder, TextDecoder } from 'util';

// --- THIS IS THE FIX ---
// Use 'as any' to tell TypeScript to ignore the type mismatch.
// This is safe because the Node.js implementation is compatible enough for our tests.
global.TextEncoder = TextEncoder as any;
global.TextDecoder = TextDecoder as any;

// This mocks the 'import.meta' object, which is not available in Jest's environment.
Object.defineProperty(global, 'import.meta', {
  value: {
    env: {
      // Provide mock values for any environment variables your code uses
      VITE_API_BASE_URL: 'http://mock-api.com/api',
      VITE_WS_BASE_URL: 'ws://mock-api.com/ws',
    },
  },
  writable: true,
});