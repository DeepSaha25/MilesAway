import React from 'react';
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  ViewStyle,
  TextStyle,
} from 'react-native';
import {LinearGradient} from 'expo-linear-gradient';
import {Colors} from '../theme/colors';

interface GradientButtonProps {
  title: string;
  onPress?: () => void;
  style?: ViewStyle;
  textStyle?: TextStyle;
  icon?: React.ReactNode;
  fullWidth?: boolean;
}

const GradientButton: React.FC<GradientButtonProps> = ({
  title,
  onPress,
  style,
  textStyle,
  icon,
  fullWidth = true,
}) => {
  return (
    <TouchableOpacity
      activeOpacity={0.85}
      onPress={onPress}
      style={[fullWidth && styles.fullWidth, style]}>
      <LinearGradient
        colors={[Colors.neonYellowLight, Colors.neonYellow]}
        start={{x: 0, y: 0}}
        end={{x: 1, y: 1}}
        style={styles.gradient}>
        {icon}
        <Text style={[styles.text, textStyle]}>{title}</Text>
      </LinearGradient>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  fullWidth: {
    width: '100%',
  },
  gradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 18,
    paddingHorizontal: 32,
    borderRadius: 16,
    gap: 8,
  },
  text: {
    fontFamily: 'Lexend-Bold',
    fontSize: 16,
    fontWeight: '900',
    color: Colors.brandOnNeon,
    textTransform: 'uppercase',
    letterSpacing: 2,
  },
});

export default GradientButton;
