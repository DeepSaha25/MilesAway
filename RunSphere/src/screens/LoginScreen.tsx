import React, {useState} from 'react';
import {
  ActivityIndicator,
  Alert,
  Linking,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import {LinearGradient} from 'expo-linear-gradient';
import {useAuthStore} from '../store/authStore';
import {Colors} from '../theme/colors';

const PRIVACY_POLICY_URL = 'https://sites.google.com/view/privacypolicy-milesaway/';

const LoginScreen = ({navigation}: any) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [loading, setLoading] = useState<'login' | 'guest' | null>(null);
  const login = useAuthStore(state => state.login);
  const loginAsGuest = useAuthStore(state => state.loginAsGuest);

  const handleLogin = async () => {
    if (!email.trim() || !password.trim()) {
      Alert.alert('Missing details', 'Email and password are required.');
      return;
    }

    setLoading('login');
    try {
      await login({email: email.trim(), password});
    } catch (error: any) {
      try {
        // eslint-disable-next-line no-console
        console.error('Login error', error);
      } catch {}

      const detail = error?.data?.message || error?.data || error?.originalMessage || error?.message;
      Alert.alert('Login failed', detail || 'Please check your credentials and try again.');
    } finally {
      setLoading(null);
    }
  };

  const handleGuestLogin = async () => {
    setLoading('guest');
    try {
      await loginAsGuest();
    } catch (error: any) {
      Alert.alert(
        'Guest mode unavailable',
        error?.message || 'Please try again.',
      );
    } finally {
      setLoading(null);
    }
  };

  const openPrivacyPolicy = () => {
    Linking.openURL(PRIVACY_POLICY_URL).catch(() => {
      Alert.alert('Unable to open link', 'Please try again later.');
    });
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={Colors.surface} />
      <View style={styles.glowTop} />
      <View style={styles.glowBottom} />

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={styles.brand}>MilesAway</Text>
        <Text style={styles.hero}>Welcome{'\n'}Back</Text>

        <View style={styles.form}>
          <Text style={styles.fieldLabel}>EMAIL</Text>
          <TextInput
            value={email}
            onChangeText={setEmail}
            placeholder="you@example.com"
            placeholderTextColor={Colors.outline}
            keyboardType="email-address"
            autoCapitalize="none"
            style={styles.input}
          />

          <View style={styles.passwordHeader}>
            <Text style={styles.fieldLabel}>PASSWORD</Text>
            <Text
              style={styles.linkText}
              onPress={() => navigation.navigate('ForgotPassword')}>
              FORGOT?
            </Text>
          </View>
          <TextInput
            value={password}
            onChangeText={setPassword}
            placeholder="........"
            placeholderTextColor={Colors.outline}
            secureTextEntry
            style={styles.input}
          />

          <TouchableOpacity
            style={styles.checkboxRow}
            onPress={() => setRememberMe(value => !value)}>
            <View style={[styles.checkbox, rememberMe && styles.checkboxActive]}>
              {rememberMe ? (
                <Ionicons name="checkmark" size={14} color={Colors.onPrimaryFixed} />
              ) : null}
            </View>
            <Text style={styles.rememberText}>Remember me</Text>
          </TouchableOpacity>

          {loading === 'login' ? (
            <ActivityIndicator size="large" color={Colors.primaryContainer} />
          ) : (
            <TouchableOpacity
              activeOpacity={0.92}
              onPress={handleLogin}
              disabled={loading !== null}>
              <LinearGradient colors={[Colors.primary, Colors.primaryContainer]} style={styles.primaryButton}>
                <Text style={styles.primaryButtonText}>LOG IN</Text>
              </LinearGradient>
            </TouchableOpacity>
          )}
        </View>

        <TouchableOpacity
          activeOpacity={0.9}
          style={styles.guestButton}
          onPress={handleGuestLogin}
          disabled={loading !== null}>
          {loading === 'guest' ? (
            <ActivityIndicator size="small" color={Colors.primary} />
          ) : (
            <>
              <Text style={styles.guestButtonText}>CONTINUE AS GUEST</Text>
            
            </>
          )}
        </TouchableOpacity>

        

        <Text style={styles.footerText}>
          New to the grid?{' '}
          <Text style={styles.footerLink} onPress={() => navigation.navigate('Signup')}>
            JOIN NOW
          </Text>
        </Text>

        <Text style={styles.privacyText}>
          By continuing, you agree to the{' '}
          <Text style={styles.privacyLink} onPress={openPrivacyPolicy}>
            Privacy Policy
          </Text>
          .
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
  glowBottom: {
    position: 'absolute',
    bottom: -120,
    left: -90,
    width: 260,
    height: 260,
    borderRadius: 999,
    backgroundColor: Colors.tertiaryContainer + '10',
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
    textTransform: 'uppercase',
  },
  hero: {
    marginTop: 18,
    color: Colors.onSurface,
    fontFamily: 'Lexend-Bold',
    fontSize: 58,
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
    textTransform: 'uppercase',
  },
  input: {
    backgroundColor: Colors.surfaceContainerLowest,
    borderRadius: 18,
    color: Colors.onSurface,
    paddingHorizontal: 18,
    paddingVertical: 18,
    fontSize: 17,
  },
  passwordHeader: {
    marginTop: 6,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  linkText: {
    color: Colors.tertiary,
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1.8,
    textTransform: 'uppercase',
  },
  checkboxRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginTop: 4,
    marginBottom: 10,
  },
  checkbox: {
    width: 18,
    height: 18,
    borderRadius: 4,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.surfaceContainerHigh,
    borderWidth: 1,
    borderColor: Colors.outlineVariant,
  },
  checkboxActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  rememberText: {
    color: Colors.onSurfaceVariant,
    fontSize: 14,
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
  guestButton: {
    marginTop: 18,
    minHeight: 68,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: Colors.primary + '55',
    backgroundColor: Colors.primary + '12',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 18,
    paddingVertical: 14,
  },
  guestButtonText: {
    color: Colors.primary,
    fontSize: 13,
    fontWeight: '900',
    letterSpacing: 1.6,
    textTransform: 'uppercase',
  },
  guestButtonMeta: {
    marginTop: 6,
    color: Colors.onSurfaceVariant,
    fontSize: 12,
    textAlign: 'center',
  },
  footerText: {
    marginTop: 28,
    textAlign: 'center',
    color: Colors.onSurfaceVariant,
    fontSize: 14,
  },
  footerLink: {
    color: Colors.primary,
    fontWeight: '900',
    letterSpacing: 1.2,
  },
  privacyText: {
    marginTop: 14,
    color: Colors.onSurfaceVariant,
    fontSize: 12,
    lineHeight: 18,
    textAlign: 'center',
  },
  privacyLink: {
    color: Colors.primary,
    fontWeight: '900',
  },
  systemFooter: {
    marginTop: 34,
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    opacity: 0.45,
  },
  systemLabel: {
    color: Colors.outlineVariant,
    fontSize: 8,
    fontWeight: '900',
    letterSpacing: 2.2,
    textTransform: 'uppercase',
  },
  statusRow: {
    marginTop: 4,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 999,
    backgroundColor: Colors.secondary,
  },
  statusText: {
    color: Colors.secondary,
    fontSize: 10,
    fontWeight: '900',
    textTransform: 'uppercase',
  },
  versionText: {
    color: Colors.outlineVariant,
    fontSize: 8,
    fontWeight: '900',
    letterSpacing: 1.7,
    textTransform: 'uppercase',
  },
});

export default LoginScreen;
