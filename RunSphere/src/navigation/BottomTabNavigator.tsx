import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import HomeScreen from '../screens/HomeScreen';
import LeaderboardScreen from '../screens/LeaderboardScreen';
import HistoryScreen from '../screens/HistoryScreen';
import CommunityFeedScreen from '../screens/CommunityFeedScreen';
import ProfileScreen from '../screens/ProfileScreen';
import { Colors } from '../theme/colors';
import { MainTabParamList } from './types';

const Tab = createBottomTabNavigator<MainTabParamList>();

const TAB_CONFIG: Record<keyof MainTabParamList, { label: string }> = {
  Home: { label: 'Home' },
  Leaderboards: { label: 'Leaderboard' },
  History: { label: 'History' },
  Community: { label: 'Community' },
  Profile: { label: 'Profile' },
};

const VISIBLE_TABS: Array<keyof MainTabParamList> = [
  'Home',
  'Leaderboards',
  'History',
  'Profile',
];

const BottomTabNavigator = ({ navigation }: any) => {
  const insets = useSafeAreaInsets();
  const bottomInset = Math.max(insets.bottom, 10);

  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarStyle: styles.hiddenTabBar,
      }}
      tabBar={({ state, navigation: tabNavigation }) => (
        <View style={[styles.tabShell, { bottom: bottomInset + 8 }]}>
          <View style={styles.tabBar}>
            {state.routes
              .filter(route =>
                VISIBLE_TABS.includes(route.name as keyof MainTabParamList),
              )
              .map((route, visibleIndex) => {
                const routeIndex = state.routes.findIndex(
                  item => item.key === route.key,
                );
                const config = TAB_CONFIG[route.name as keyof MainTabParamList];
                const isFocused = state.index === routeIndex;

                return (
                  <React.Fragment key={route.key}>
                    {visibleIndex === 2 ? (
                      <TouchableOpacity
                        style={styles.runTabItem}
                        onPress={() => navigation.navigate('RunTracking')}
                        activeOpacity={0.86}
                      >
                        <Text style={styles.runTabLabel}>Run</Text>
                      </TouchableOpacity>
                    ) : null}
                    <TouchableOpacity
                      style={[
                        styles.tabItem,
                        isFocused && styles.activeTabItem,
                      ]}
                      onPress={() =>
                        tabNavigation.navigate(route.name as never)
                      }
                      activeOpacity={0.78}
                    >
                      <Text
                        numberOfLines={1}
                        adjustsFontSizeToFit
                        style={[
                          styles.tabLabel,
                          isFocused && styles.activeText,
                        ]}
                      >
                        {config.label}
                      </Text>
                    </TouchableOpacity>
                  </React.Fragment>
                );
              })}
          </View>
        </View>
      )}
    >
      <Tab.Screen name="Home" component={HomeScreen} />
      <Tab.Screen name="Leaderboards" component={LeaderboardScreen} />
      <Tab.Screen name="History" component={HistoryScreen} />
      <Tab.Screen name="Community" component={CommunityFeedScreen} />
      <Tab.Screen name="Profile" component={ProfileScreen} />
    </Tab.Navigator>
  );
};

const styles = StyleSheet.create({
  hiddenTabBar: {
    display: 'none',
  },
  tabShell: {
    position: 'absolute',
    left: 12,
    right: 12,
    alignItems: 'center',
  },
  tabBar: {
    width: '100%',
    minHeight: 58,
    paddingHorizontal: 6,
    paddingVertical: 7,
    borderRadius: 22,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surfaceContainer + 'F2',
    borderWidth: 1,
    borderColor: Colors.outlineVariant,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.14,
    shadowRadius: 24,
    elevation: 18,
  },
  tabItem: {
    flex: 1,
    height: 42,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabLabel: {
    color: Colors.slateInactive,
    fontFamily: 'Lexend-Bold',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0,
  },
  activeTabItem: {
    backgroundColor: Colors.primary + '18',
  },
  runTabItem: {
    width: 66,
    height: 42,
    borderRadius: 21,
    marginHorizontal: 3,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.primary,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.2,
    shadowRadius: 14,
    elevation: 12,
  },
  runTabLabel: {
    color: Colors.onPrimaryFixed,
    fontFamily: 'Lexend-Bold',
    fontSize: 12,
    fontWeight: '900',
    letterSpacing: 0,
  },
  activeText: {
    color: Colors.primary,
    textShadowColor: 'rgba(153,247,255,0.8)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 8,
  },
});

export default BottomTabNavigator;
