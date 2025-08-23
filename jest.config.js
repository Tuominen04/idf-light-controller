module.exports = {
  preset: "react-native",
  transform: {
    "^.+\\.(js|jsx|ts|tsx)$": "babel-jest",
  },
  testRegex: "(/__tests__/.*|(\\.|/)(test|spec))\\.(ts|tsx|js)$",
  moduleFileExtensions: ["ts", "tsx", "js", "jsx", "json", "node"],
  setupFiles: ['<rootDir>/jest.setup.js'],
  transformIgnorePatterns: [
    "node_modules/(?!(react-native"
      + "|@react-native"
      + "|@react-navigation"
      + "|@react-native-community"
      + "|@react-native-picker"
      + "|@react-native-safe-area"
      + "|@react-native-async-storage"
      + "|@react-native-masked-view"
      + "|@react-native-firebase"
      + "|@react-native-vector-icons"
      + "|@react-native-material"
      + "|@react-native-segmented-control"
      + "|@react-native-google-signin"
      + "|@react-native-device-info"
      + "|@react-native-clipboard"
      + "|@react-native-reanimated"
      + "|@react-native-gesture-handler"
      + "|@react-native-screens"
      + "|@react-native-svg"
      + "|@react-native-camera"
      + "|@react-native-share"
      + "|@react-native-image-picker"
      + "|@react-native-modal"
      + "|@react-native-keyboard-aware-scroll-view"
      + "|@react-native-bottom-sheet"
      + "|@react-native-community/async-storage"
      + "|@react-native-community/netinfo"
      + ")/)"
  ],
};