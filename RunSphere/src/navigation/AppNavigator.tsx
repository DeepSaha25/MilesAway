import React, {useEffect} from 'react';
import {ActivityIndicator, StyleSheet, View} from 'react-native';
import {
  DefaultTheme,
  NavigationContainer,
} from '@react-navigation/native';
import {createNativeStackNavigator} from '@react-navigation/native-stack';
import RunTrackingScreen from '../screens/RunTrackingScreen';
import RunSummaryScreen from '../screens/RunSummaryScreen';
import ApiClient from '../services/apiClient';
import {useAuthStore} from '../store/authStore';
import {Colors} from '../theme/colors';
import BottomTabNavigator from './BottomTabNavigator';
import {RootStackParamList} from './types';

const Stack = createNativeStackNavigator<RootStackParamList>();

const navigationTheme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    background: Colors.surface,
    card: Colors.surface,
    text: Colors.onSurface,
    border: Colors.outlineVariant,
    primary: Colors.primaryContainer,
  },
};

const AppNavigator = () => {
  const hydrated = useAuthStore(state => state.hydrated);
  const bootstrap = useAuthStore(state => state.bootstrap);

  useEffect(() => {
    ApiClient.setUnauthorizedHandler(async () => {
      await useAuthStore.getState().loginAsGuest();
    });
    bootstrap();

    return () => {
      ApiClient.setUnauthorizedHandler(null);
    };
  }, [bootstrap]);

  if (!hydrated) {
    return (
      <View style={styles.loadingState}>
        <ActivityIndicator size="large" color={Colors.primaryContainer} />
      </View>
    );
  }

  return (
    <NavigationContainer theme={navigationTheme}>
      <Stack.Navigator
        screenOptions={{
          headerShown: false,
          contentStyle: {backgroundColor: Colors.surface},
          animation: 'slide_from_right',
        }}>
        <Stack.Screen name="Main" component={BottomTabNavigator} />
        <Stack.Screen
          name="RunTracking"
          component={RunTrackingScreen}
          options={{animation: 'slide_from_bottom'}}
        />
        <Stack.Screen name="RunSummary" component={RunSummaryScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
};

const styles = StyleSheet.create({
  loadingState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.surface,
  },
});

export default AppNavigator;
