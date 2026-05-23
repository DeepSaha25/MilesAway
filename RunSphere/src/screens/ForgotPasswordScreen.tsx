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
import AuthService from '../services/authService';
import {Colors} from '../theme/colors';

const ForgotPasswordScreen = ({navigation}: any) => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);

  const requestReset = async () => {
    if (!email.trim()) {
      Alert.alert('Missing email', 'Enter your account email.');
      return;
    }

    setLoading(true);
    try {
      const response = await AuthService.forgotPassword(email.trim());
      Alert.alert(
        'Reset requested',
        response.resetToken
          ? 'A reset token was created. Continue to set a new password.'
          : response.message,
        [
          {
            text: 'Continue',
            onPress: () =>
              navigation.navigate('ResetPassword', {
                resetToken: response.resetToken,
              }),
          },
        ],
      );
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
        <Text style={styles.hero}>Reset{'\n'}Password</Text>
        <Text style={styles.copy}>
          Enter your account email to create a password reset token.
        </Text>

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

          {loading ? (
            <ActivityIndicator size="large" color={Colors.primaryContainer} />
          ) : (
            <TouchableOpacity activeOpacity={0.92} onPress={requestReset}>
              <LinearGradient
                colors={[Colors.primary, Colors.primaryContainer]}
                style={styles.primaryButton}>
                <Text style={styles.primaryButtonText}>SEND RESET</Text>
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
  copy: {
    marginTop: 16,
    color: Colors.onSurfaceVariant,
    fontSize: 14,
    lineHeight: 22,
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

export default ForgotPasswordScreen;
