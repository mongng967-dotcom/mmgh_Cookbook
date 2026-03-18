/**
 * @format
 */

import 'react-native-gesture-handler';
import { AppRegistry, LogBox } from 'react-native';
import App from './App';
import { name as appName } from './app.json';

// Suppress deprecation warning from React Native / dependencies (InteractionManager → requestIdleCallback)
LogBox.ignoreLogs([
  'InteractionManager has been deprecated',
]);

AppRegistry.registerComponent(appName, () => App);
