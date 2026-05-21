import React from 'react';
import {Image, StyleSheet, Text, TouchableOpacity, View} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Ionicons from '@expo/vector-icons/Ionicons';
import { Colors } from '../theme/colors';

const HEADER_AVATAR = {
  uri: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDN3VfEa7BLl4_KkLsg3BZAoRyRAsa_wQ-qQ5FK-kQio7zfMkleavIgrC5keZxDw3PkDkH1z1fFIO0jQqmEv6-y2tIHxNlmgLngsNZAgM5DVE1KcrvOcdjKCtsx-7aesqMBZDIJxQlwx5-hs_OvwlfbvwjvvrUtxmpLDRY6lAYD0HGv-1yktXInbbn6t__Jazr2a6iUb73pDhwW9Q0P1LdMJaqUch48anjybfZ-8RwRW74HngHoVSHG2BYv6imweJLGacAlUoenzJ9R',
};

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
          RUNSPHERE
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
            <Image source={HEADER_AVATAR} style={styles.avatarImage} />
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
    backgroundColor: Colors.surfaceContainerHigh,
    borderWidth: 2,
    borderColor: Colors.primary + '33',
    overflow: 'hidden',
  },
  avatarImage: {
    width: '100%',
    height: '100%',
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
