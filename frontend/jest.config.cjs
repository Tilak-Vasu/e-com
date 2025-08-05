// frontend/jest.config.cjs

module.exports = {
  testEnvironment: 'jest-environment-jsdom',
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  
  transform: {
    '^.+\\.tsx?$': ['ts-jest', {
      // --- THIS IS THE FINAL, CORRECT CONFIGURATION ---
      // Point ts-jest to the new, dedicated config file we just created.
      tsconfig: 'tsconfig.jest.json',
    }],
  },
  
  moduleNameMapper: {
    // This line is for your CSS files (keep it)
    '\\.(css|less|scss|sass)$': 'identity-obj-proxy',
    
    // --- ADD THIS LINE ---
    // This line tells Jest to use your mock for all image files
    '\\.(jpg|jpeg|png|gif|webp|svg)$': '<rootDir>/__mocks__/fileMock.js',
  },
};