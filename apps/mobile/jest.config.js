/** @type {import('jest').Config} */
module.exports = {
  projects: [
    // 순수 로직 테스트 (hooks, utils) — Node 환경
    {
      displayName: 'logic',
      preset: 'ts-jest',
      testEnvironment: 'node',
      testMatch: ['<rootDir>/src/__tests__/**/*.test.ts'],
    },
    // React Native 컴포넌트 테스트 — jest-expo 환경
    {
      displayName: 'components',
      preset: 'jest-expo',
      testMatch: ['<rootDir>/src/__tests__/**/*.test.tsx'],
      transformIgnorePatterns: [
        'node_modules/(?!((jest-)?react-native|@react-native(-community)?)|expo(nent)?|@expo(nent)?/.*|react-navigation|@react-navigation/.*)',
      ],
    },
  ],
};
