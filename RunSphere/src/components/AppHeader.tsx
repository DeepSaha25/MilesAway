import React from 'react';
import {StyleSheet, Text, TouchableOpacity, View} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Ionicons from '@expo/vector-icons/Ionicons';
import Avatar from './Avatar';
import { Colors } from '../theme/colors';
import {useAuthStore} from '../store/authStore';

interface AppHeaderProps {
  showStreak?: boolean;
  streakCount?: number;
  rightElement?: React.ReactNode;
}

const AppHeader: React.FC<AppHeaderProps> = ({
  showStreak = false,
  streakCount = 0,
  rightElement,
}) => {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<any>();
  const user = useAuthStore(state => state.user);

  const openProfile = () => {
    navigation.navigate('Profile');
  };

  return (
    <View style={[styles.header, { paddingTop: Math.max(insets.top + 8, 16) }]}>
      <View style={styles.leftCluster}>
        <TouchableOpacity activeOpacity={0.76} style={styles.iconButton}>
          <Ionicons name="menu" size={26} color={Colors.primary} />
        </TouchableOpacity>
        <Text numberOfLines={1} adjustsFontSizeToFit style={styles.logoText}>
          MilesAway
        </Text>
      </View>

      {rightElement || (
        <View style={styles.rightCluster}>
          {showStreak ? (
            <View style={styles.streakBadge}>
              <View style={styles.streakDot} />
              <Text style={styles.streakText}>{streakCount}</Text>
            </View>
          ) : null}
          <TouchableOpacity
            activeOpacity={0.76}
            onPress={openProfile}
            style={styles.avatar}
            accessibilityLabel="Open profile"
          >
            <Avatar
              uri={user?.avatar}
              name={user?.name}
              size={42}
              borderColor={Colors.primary + '33'}
            />
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  header: {
    minHeight: 74,
    paddingBottom: 14,
    paddingHorizontal: 24,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.surface + 'F0',
  },
  leftCluster: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    marginRight: 12,
  },
  logoText: {
    fontFamily: 'Lexend-Black',
    fontSize: 23,
    fontWeight: '900',
    fontStyle: 'italic',
    color: Colors.primary,
    letterSpacing: 0,
    flexShrink: 1,
    textShadowColor: 'rgba(153,247,255,0.8)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 8,
  },
  iconButton: {
    width: 28,
    height: 38,
    borderRadius: 0,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.transparent,
  },
  avatar: {
    width: 42,
    height: 42,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.transparent,
  },
  rightCluster: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  streakBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    paddingHorizontal: 11,
    paddingVertical: 7,
    borderRadius: 999,
    backgroundColor: Colors.surfaceContainerHigh,
  },
  streakDot: {
    width: 7,
    height: 7,
    borderRadius: 999,
    backgroundColor: Colors.secondary,
  },
  streakText: {
    color: Colors.secondary,
    fontSize: 10,
    fontWeight: '900',
  },
});

export default AppHeader;
