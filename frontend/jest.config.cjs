// frontend/jest.config.cjs
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'jest-environment-jsdom',
  setupFilesAfterEnv: ['<rootDir>/src/jest.setup.ts'],
  transform: {
    '^.+\\.tsx?$': ['ts-jest', {
      // This tells ts-jest to use our new tsconfig.json file for compilation.
      tsconfig: 'tsconfig.json'
    }]},
  moduleNameMapper: {
    '\\.(css|less|scss|sass)$': 'identity-obj-proxy',
  },
  extensionsToTreatAsEsm: ['.ts', '.tsx'],
  globals: {
    'ts-jest': {
      useESM: true
    }
  }
};