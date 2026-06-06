/* eslint-env jest */
import 'react-native-gesture-handler/jestSetup';

jest.mock('@react-native-async-storage/async-storage', () => {
  const store = new Map();
  return {
    getItem: jest.fn(async key => (store.has(key) ? store.get(key) : null)),
    setItem: jest.fn(async (key, value) => {
      store.set(key, value);
    }),
    removeItem: jest.fn(async key => {
      store.delete(key);
    }),
    clear: jest.fn(async () => {
      store.clear();
    }),
  };
});

jest.mock('expo-secure-store', () => ({
  getItemAsync: jest.fn(async () => null),
  setItemAsync: jest.fn(async () => undefined),
  deleteItemAsync: jest.fn(async () => undefined),
}));

jest.mock('expo-location', () => ({
  Accuracy: {Highest: 6, BestForNavigation: 6},
  getForegroundPermissionsAsync: jest.fn(async () => ({status: 'granted'})),
  requestForegroundPermissionsAsync: jest.fn(async () => ({
    status: 'granted',
    canAskAgain: true,
  })),
  getBackgroundPermissionsAsync: jest.fn(async () => ({status: 'granted'})),
  requestBackgroundPermissionsAsync: jest.fn(async () => ({
    status: 'granted',
    canAskAgain: true,
  })),
  getCurrentPositionAsync: jest.fn(async () => ({
    coords: {
      latitude: 0,
      longitude: 0,
      altitude: null,
      accuracy: null,
      speed: null,
      heading: null,
    },
    timestamp: Date.now(),
  })),
  watchPositionAsync: jest.fn(async () => ({remove: jest.fn()})),
  hasStartedLocationUpdatesAsync: jest.fn(async () => false),
  startLocationUpdatesAsync: jest.fn(async () => undefined),
  stopLocationUpdatesAsync: jest.fn(async () => undefined),
}));

jest.mock('expo-task-manager', () => {
  const definedTasks = new Map();

  return {
    defineTask: jest.fn((taskName, executor) => {
      definedTasks.set(taskName, executor);
    }),
    isTaskDefined: jest.fn(taskName => definedTasks.has(taskName)),
    isAvailableAsync: jest.fn(async () => true),
    isTaskRegisteredAsync: jest.fn(async taskName =>
      definedTasks.has(taskName),
    ),
    getTaskOptionsAsync: jest.fn(async () => null),
    getRegisteredTasksAsync: jest.fn(async () => []),
    unregisterTaskAsync: jest.fn(async () => undefined),
    unregisterAllTasksAsync: jest.fn(async () => undefined),
    __taskManagerMocks: {
      runTask: (taskName, body) => definedTasks.get(taskName)?.(body),
      getTask: taskName => definedTasks.get(taskName),
    },
  };
});

jest.mock('expo-sensors', () => {
  const listeners = {
    accelerometer: [],
    barometer: [],
    pedometer: [],
  };

  const createSubscription = (type, listener) => {
    listeners[type].push(listener);
    return {
      remove: jest.fn(() => {
        const index = listeners[type].indexOf(listener);
        if (index >= 0) {
          listeners[type].splice(index, 1);
        }
      }),
    };
  };

  const reset = () => {
    listeners.accelerometer.length = 0;
    listeners.barometer.length = 0;
    listeners.pedometer.length = 0;
  };

  return {
    Accelerometer: {
      isAvailableAsync: jest.fn(async () => true),
      setUpdateInterval: jest.fn(),
      addListener: jest.fn(listener =>
        createSubscription('accelerometer', listener),
      ),
    },
    Barometer: {
      isAvailableAsync: jest.fn(async () => true),
      setUpdateInterval: jest.fn(),
      addListener: jest.fn(listener => createSubscription('barometer', listener)),
    },
    Pedometer: {
      isAvailableAsync: jest.fn(async () => true),
      getPermissionsAsync: jest.fn(async () => ({status: 'granted'})),
      requestPermissionsAsync: jest.fn(async () => ({status: 'granted'})),
      watchStepCount: jest.fn(listener =>
        createSubscription('pedometer', listener),
      ),
    },
    __sensorMocks: {
      emitAccelerometer: measurement =>
        listeners.accelerometer.forEach(listener => listener(measurement)),
      emitBarometer: measurement =>
        listeners.barometer.forEach(listener => listener(measurement)),
      emitPedometer: measurement =>
        listeners.pedometer.forEach(listener => listener(measurement)),
      reset,
    },
  };
});

jest.mock('expo-font', () => ({
  useFonts: jest.fn(() => [true]),
}));

jest.mock('@expo-google-fonts/inter', () => ({
  Inter_400Regular: {},
  Inter_500Medium: {},
  Inter_700Bold: {},
}));

jest.mock('@expo-google-fonts/lexend', () => ({
  Lexend_700Bold: {},
  Lexend_900Black: {},
}));

jest.mock('react-native-maps', () => {
  const React = require('react');
  const {View} = require('react-native');
  const Component = ({children}) =>
    React.createElement(View, null, children);

  return {
    __esModule: true,
    default: React.forwardRef((props, ref) => React.createElement(View, null)),
    Marker: Component,
    Polyline: Component,
  };
});

jest.mock('expo-linear-gradient', () => {
  const React = require('react');
  const {View} = require('react-native');
  return {
    LinearGradient: ({children, ...props}) =>
      React.createElement(View, props, children),
  };
});

jest.mock('react-native-toast-message', () => {
  const React = require('react');
  const {View} = require('react-native');
  const Toast = () => React.createElement(View);
  Toast.show = jest.fn();
  return Toast;
});
