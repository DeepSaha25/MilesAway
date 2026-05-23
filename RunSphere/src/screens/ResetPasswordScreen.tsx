import React, {useState} from 'react';
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import {LinearGradient} from 'expo-linear-gradient';
import {useAuthStore} from '../store/authStore';
import {Colors} from '../theme/colors';

const ResetPasswordScreen = ({navigation, route}: any) => {
  const [token, setToken] = useState(route?.params?.resetToken || '');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const resetPassword = useAuthStore(state => state.resetPassword);

  const submitReset = async () => {
    if (!token.trim() || !password.trim()) {
      Alert.alert('Missing details', 'Reset token and new password are required.');
      return;
    }

    if (password.length < 10) {
      Alert.alert('Password too short', 'Use at least 10 characters.');
      return;
    }

    if (
      !/[a-z]/.test(password) ||
      !/[A-Z]/.test(password) ||
      !/\d/.test(password) ||
      !/[^A-Za-z0-9]/.test(password)
    ) {
      Alert.alert(
        'Password needs more strength',
        'Use uppercase, lowercase, number, and symbol characters.',
      );
      return;
    }

    setLoading(true);
    try {
      await resetPassword({
        token: token.trim(),
        password,
        confirmPassword: password,
      });
    } catch (error: any) {
      Alert.alert('Reset failed', error?.message || 'Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={Colors.surface} />
      <View style={styles.glowTop} />
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={styles.brand}>MilesAway</Text>
        <Text style={styles.hero}>New{'\n'}Password</Text>

        <View style={styles.form}>
          <Text style={styles.fieldLabel}>RESET TOKEN</Text>
          <TextInput
            value={token}
            onChangeText={setToken}
            placeholder="Paste reset token"
            placeholderTextColor={Colors.outline}
            autoCapitalize="none"
            style={styles.input}
          />

          <Text style={styles.fieldLabel}>NEW PASSWORD</Text>
          <TextInput
            value={password}
            onChangeText={setPassword}
            placeholder="............"
            placeholderTextColor={Colors.outline}
            secureTextEntry
            style={styles.input}
          />

          {loading ? (
            <ActivityIndicator size="large" color={Colors.primaryContainer} />
          ) : (
            <TouchableOpacity activeOpacity={0.92} onPress={submitReset}>
              <LinearGradient
                colors={[Colors.primary, Colors.primaryContainer]}
                style={styles.primaryButton}>
                <Text style={styles.primaryButtonText}>RESET PASSWORD</Text>
              </LinearGradient>
            </TouchableOpacity>
          )}
        </View>

        <Text style={styles.footerLink} onPress={() => navigation.navigate('Login')}>
          BACK TO LOGIN
        </Text>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.surface,
  },
  glowTop: {
    position: 'absolute',
    top: -100,
    right: -100,
    width: 320,
    height: 320,
    borderRadius: 999,
    backgroundColor: Colors.primary + '12',
  },
  content: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: 24,
    paddingVertical: 48,
  },
  brand: {
    color: Colors.primary,
    fontFamily: 'Lexend-Bold',
    fontSize: 24,
    fontWeight: '900',
    fontStyle: 'italic',
  },
  hero: {
    marginTop: 18,
    color: Colors.onSurface,
    fontFamily: 'Lexend-Bold',
    fontSize: 56,
    lineHeight: 58,
    fontWeight: '900',
    letterSpacing: -3,
  },
  form: {
    marginTop: 34,
    gap: 14,
  },
  fieldLabel: {
    color: Colors.onSurfaceVariant,
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 2,
  },
  input: {
    backgroundColor: Colors.surfaceContainerLowest,
    borderRadius: 18,
    color: Colors.onSurface,
    paddingHorizontal: 18,
    paddingVertical: 18,
    fontSize: 17,
  },
  primaryButton: {
    borderRadius: 20,
    paddingVertical: 18,
    alignItems: 'center',
  },
  primaryButtonText: {
    color: Colors.onPrimaryFixed,
    fontFamily: 'Lexend-Bold',
    fontSize: 20,
    fontWeight: '900',
    fontStyle: 'italic',
  },
  footerLink: {
    marginTop: 28,
    color: Colors.primary,
    fontWeight: '900',
    textAlign: 'center',
    letterSpacing: 1.2,
  },
});

export default ResetPasswordScreen;
