import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
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

const TAB_CONFIG: Record<
  keyof MainTabParamList,
  { label: string; icon: keyof typeof Ionicons.glyphMap }
> = {
  Home: { label: 'Home', icon: 'home' },
  Leaderboards: { label: 'Ranks', icon: 'bar-chart' },
  History: { label: 'Run', icon: 'speedometer' },
  Community: { label: 'Social', icon: 'people' },
  Profile: { label: 'Me', icon: 'person' },
};

const VISIBLE_TABS: Array<keyof MainTabParamList> = [
  'Home',
  'Leaderboards',
  'Community',
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
      // React Navigation's custom tabBar API is intentionally render-prop based.
      // eslint-disable-next-line react/no-unstable-nested-components
      tabBar={({ state, navigation: tabNavigation }) => (
        <View style={styles.tabShell}>
          <View style={[styles.tabBar, {paddingBottom: bottomInset + 6}]}>
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
                    {visibleIndex === 1 ? (
                      <TouchableOpacity
                        style={styles.tabItem}
                        onPress={() => navigation.navigate('RunTracking')}
                        activeOpacity={0.86}
                        accessibilityLabel="Start run"
                      >
                        <Ionicons
                          name="speedometer"
                          size={21}
                          color={Colors.slateInactive}
                        />
                        <Text style={styles.tabLabel}>Run</Text>
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
                      accessibilityLabel={config.label}
                    >
                      <Ionicons
                        name={config.icon}
                        size={21}
                        color={isFocused ? Colors.primary : Colors.slateInactive}
                      />
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
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center',
  },
  tabBar: {
    width: '100%',
    minHeight: 84,
    paddingHorizontal: 20,
    paddingTop: 13,
    paddingBottom: 16,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    borderBottomLeftRadius: 0,
    borderBottomRightRadius: 0,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surfaceContainer + 'D6',
    borderWidth: 1,
    borderColor: Colors.outlineVariant + '26',
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.08,
    shadowRadius: 18,
    elevation: 18,
  },
  tabItem: {
    flex: 1,
    height: 52,
    borderRadius: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabLabel: {
    color: Colors.slateInactive,
    fontFamily: 'Lexend-Bold',
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0,
    marginTop: 5,
    textTransform: 'uppercase',
  },
  activeTabItem: {
    backgroundColor: Colors.transparent,
  },
  activeText: {
    color: Colors.primary,
    textShadowColor: 'rgba(153,247,255,0.45)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 8,
  },
});

export default BottomTabNavigator;
