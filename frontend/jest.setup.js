// frontend/jest.setup.js

// --- FIX FOR 'TextEncoder is not defined' ERROR ---
// Use require() to bring in the 'util' module from Node.js
const { TextEncoder, TextDecoder } = require('util');

// Assign them to the global scope for Jest's jsdom environment
global.TextEncoder = TextEncoder;
global.TextDecoder = TextDecoder;


// --- FIX FOR '.toBeInTheDocument() is not a function' ERROR ---
// Use require() to load the jest-dom matchers.
// This extends Jest's `expect` function.
require('@testing-library/jest-dom');