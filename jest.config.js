module.exports = {
  transform: {
    '^.+\\.ts$': ['@swc/jest', {
      jsc: {
        parser: {
          syntax: 'typescript',
        },
      },
      module: {
        type: 'commonjs',
      },
    }],
  },
  testEnvironment: 'node',
  roots: ['<rootDir>/src'],
  testMatch: ['**/__tests__/**/*.test.ts'],
  moduleNameMapper: {
    '^expo-modules-core$': '<rootDir>/src/__mocks__/expo-modules-core.js',
  },
};
