import React from 'react';
import {View, Image, StyleSheet, Text, ViewStyle} from 'react-native';
import {Colors} from '../theme/colors';

interface AvatarProps {
  uri?: string;
  size?: number;
  borderColor?: string;
  name?: string | null;
  style?: ViewStyle;
}

const Avatar: React.FC<AvatarProps> = ({
  uri,
  size = 48,
  borderColor = Colors.outlineVariant + '33',
  name,
  style,
}) => {
  const initials = String(name || 'Runner')
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map(part => part.charAt(0))
    .join('')
    .toUpperCase() || 'R';

  return (
    <View
      style={[
        styles.container,
        {
          width: size,
          height: size,
          borderRadius: size / 2,
          borderColor,
        },
        style,
      ]}>
      {uri ? (
        <Image
          source={{uri}}
          style={[
            styles.image,
            {width: size - 4, height: size - 4, borderRadius: (size - 4) / 2},
          ]}
        />
      ) : (
        <View
          style={[
            styles.placeholder,
            {
              width: size - 4,
              height: size - 4,
              borderRadius: (size - 4) / 2,
            },
          ]}>
          <Text style={[styles.initials, {fontSize: Math.max(12, size * 0.34)}]}>
            {initials}
          </Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    borderWidth: 2,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
  },
  image: {
    resizeMode: 'cover',
  },
  placeholder: {
    backgroundColor: Colors.surfaceContainerHigh,
    alignItems: 'center',
    justifyContent: 'center',
  },
  initials: {
    color: Colors.primary,
    fontFamily: 'Lexend-Bold',
    fontWeight: '900',
  },
});

export default Avatar;
