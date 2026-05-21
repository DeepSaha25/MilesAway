module.exports = {
  preset: 'jest-expo',
  setupFiles: ['./jest.setup.js'],
  transformIgnorePatterns: [
    'node_modules/(?!(@react-native|react-native|react-native-gesture-handler|react-native-safe-area-context|@react-navigation|expo|expo-modules-core|@expo|react-native-maps)/)',
  ],
};
