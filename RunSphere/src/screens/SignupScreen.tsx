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
import Ionicons from '@expo/vector-icons/Ionicons';
import {LinearGradient} from 'expo-linear-gradient';
import {useAuthStore} from '../store/authStore';
import {Colors} from '../theme/colors';

const SignupScreen = ({navigation}: any) => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [agreedTerms, setAgreedTerms] = useState(false);
  const [loading, setLoading] = useState<'signup' | 'guest' | null>(null);
  const signup = useAuthStore(state => state.signup);
  const loginAsGuest = useAuthStore(state => state.loginAsGuest);

  const handleSignup = async () => {
    if (!name.trim() || !email.trim() || !password.trim()) {
      Alert.alert('Missing details', 'All fields are required.');
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

    if (!agreedTerms) {
      Alert.alert('Terms required', 'Please accept the terms to continue.');
      return;
    }

    setLoading('signup');
    try {
      await signup({
        name: name.trim(),
        email: email.trim(),
        password,
        confirmPassword: password,
      });
    } catch (error: any) {
      Alert.alert(
        'Signup failed',
        error?.message || 'Please try a different email address.',
      );
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

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={Colors.surface} />
      <View style={styles.glowTop} />
      <View style={styles.glowBottom} />

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.brandBlock}>
          <Text style={styles.brand}>MilesAway</Text>
          <Text style={styles.hero}>
            Create{'\n'}Account
          </Text>
        </View>

        <View style={styles.form}>
          <View style={styles.fieldGroup}>
            <Text style={styles.fieldLabel}>Runner name</Text>
            <View style={styles.inputWrap}>
              <Ionicons name="person-outline" size={20} color={Colors.onSurfaceVariant} />
              <TextInput
                value={name}
                onChangeText={setName}
                placeholder="Your name"
                placeholderTextColor={Colors.outline}
                style={styles.input}
              />
            </View>
          </View>

          <View style={styles.fieldGroup}>
            <Text style={styles.fieldLabel}>Credentials</Text>
            <View style={styles.inputWrap}>
              <Ionicons name="at-outline" size={20} color={Colors.onSurfaceVariant} />
              <TextInput
                value={email}
                onChangeText={setEmail}
                placeholder="you@example.com"
                placeholderTextColor={Colors.outline}
                keyboardType="email-address"
                autoCapitalize="none"
                style={styles.input}
              />
            </View>
          </View>

          <View style={styles.fieldGroup}>
            <Text style={styles.fieldLabel}>Access key</Text>
            <View style={styles.inputWrap}>
              <Ionicons name="lock-closed-outline" size={20} color={Colors.onSurfaceVariant} />
              <TextInput
                value={password}
                onChangeText={setPassword}
                placeholder="............"
                placeholderTextColor={Colors.outline}
                secureTextEntry
                style={styles.input}
              />
            </View>
          </View>

          <TouchableOpacity
            style={styles.checkboxRow}
            onPress={() => setAgreedTerms(value => !value)}>
            <View style={[styles.checkbox, agreedTerms && styles.checkboxActive]} />
            <Text style={styles.termsText}>
              I agree to the terms and privacy policy.
            </Text>
          </TouchableOpacity>

          {loading === 'signup' ? (
            <ActivityIndicator size="large" color={Colors.primaryContainer} />
          ) : (
            <TouchableOpacity
              activeOpacity={0.92}
              onPress={handleSignup}
              disabled={loading !== null}>
              <LinearGradient colors={[Colors.primary, Colors.primaryContainer]} style={styles.primaryButton}>
                <Text style={styles.primaryButtonText}>CREATE ACCOUNT</Text>
                <Ionicons name="arrow-forward" size={24} color={Colors.onPrimaryFixed} />
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
            <Text style={styles.guestButtonText}>CONTINUE AS GUEST</Text>
          )}
        </TouchableOpacity>

        <Text style={styles.footerText}>
          Already a member?{' '}
          <Text style={styles.footerLink} onPress={() => navigation.navigate('Login')}>
            LOG IN
          </Text>
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
    top: -120,
    right: -120,
    width: 340,
    height: 340,
    borderRadius: 999,
    backgroundColor: Colors.primary + '12',
  },
  glowBottom: {
    position: 'absolute',
    bottom: -120,
    left: -100,
    width: 300,
    height: 300,
    borderRadius: 999,
    backgroundColor: Colors.secondary + '10',
  },
  content: {
    flexGrow: 1,
    paddingHorizontal: 24,
    justifyContent: 'center',
    paddingVertical: 48,
  },
  brandBlock: {
    marginBottom: 34,
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
    gap: 18,
  },
  fieldGroup: {
    gap: 8,
  },
  fieldLabel: {
    color: Colors.onSurfaceVariant,
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 2,
    textTransform: 'uppercase',
    marginLeft: 14,
  },
  inputWrap: {
    minHeight: 64,
    borderRadius: 16,
    paddingHorizontal: 18,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: Colors.surfaceContainerLowest,
    borderBottomWidth: 2,
    borderBottomColor: Colors.primary + '22',
  },
  input: {
    flex: 1,
    color: Colors.onSurface,
    fontSize: 16,
    paddingVertical: 16,
  },
  checkboxRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    marginTop: 6,
    marginBottom: 10,
  },
  checkbox: {
    width: 18,
    height: 18,
    borderRadius: 4,
    backgroundColor: Colors.surfaceContainerHigh,
    borderWidth: 1,
    borderColor: Colors.outlineVariant,
    marginTop: 2,
  },
  checkboxActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  termsText: {
    flex: 1,
    color: Colors.onSurfaceVariant,
    fontSize: 13,
    lineHeight: 20,
  },
  primaryButton: {
    borderRadius: 20,
    paddingVertical: 18,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 12,
    marginTop: 6,
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
    minHeight: 54,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: Colors.primary + '55',
    backgroundColor: Colors.primary + '12',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 18,
  },
  guestButtonText: {
    color: Colors.primary,
    fontSize: 13,
    fontWeight: '900',
    letterSpacing: 1.6,
    textTransform: 'uppercase',
  },
  footerText: {
    marginTop: 28,
    color: Colors.onSurfaceVariant,
    fontSize: 14,
    textAlign: 'center',
  },
  footerLink: {
    color: Colors.primary,
    fontWeight: '900',
    letterSpacing: 1.2,
  },
});

export default SignupScreen;
