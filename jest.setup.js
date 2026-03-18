/**
 * Jest setup: mock native modules that are not available in the test environment.
 * @format
 */

// Mock react-native-gesture-handler (no native binary in Jest)
jest.mock('react-native-gesture-handler', () => {
  const View = require('react-native').View;
  return {
    GestureHandlerRootView: View,
    gestureHandlerRootHOC: (Component) => Component,
    PanGestureHandler: View,
    State: {},
    GestureState: {},
    Directions: {},
  };
});
