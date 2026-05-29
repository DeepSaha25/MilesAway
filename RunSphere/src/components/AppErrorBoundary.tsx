import React, {ReactNode} from 'react';
import {
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import {Colors} from '../theme/colors';

type AppErrorBoundaryProps = {
  children: (resetKey: number) => ReactNode;
};

type AppErrorBoundaryState = {
  hasError: boolean;
  resetKey: number;
};

class AppErrorBoundary extends React.Component<
  AppErrorBoundaryProps,
  AppErrorBoundaryState
> {
  state: AppErrorBoundaryState = {
    hasError: false,
    resetKey: 0,
  };

  static getDerivedStateFromError(): Partial<AppErrorBoundaryState> {
    return {hasError: true};
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    if (typeof __DEV__ !== 'undefined' && __DEV__) {
      console.error('[MilesAway] Unhandled render error', {
        message: error.message,
        componentStack: errorInfo.componentStack,
      });
    }
  }

  private resetApp = () => {
    this.setState(state => ({
      hasError: false,
      resetKey: state.resetKey + 1,
    }));
  };

  render() {
    if (this.state.hasError) {
      return (
        <View style={styles.container}>
          <View style={styles.panel}>
            <Text style={styles.kicker}>RECOVERY MODE</Text>
            <Text style={styles.title}>
              Something went wrong with your run session
            </Text>
            <Text style={styles.copy}>
              Your saved account data is still safe. Reload the app shell to
              get back on track.
            </Text>
            <TouchableOpacity
              activeOpacity={0.82}
              accessibilityRole="button"
              accessibilityLabel="Reload MilesAway app"
              style={styles.button}
              onPress={this.resetApp}>
              <Text style={styles.buttonText}>Tap to Reload App</Text>
            </TouchableOpacity>
          </View>
        </View>
      );
    }

    return this.props.children(this.state.resetKey);
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
    backgroundColor: Colors.surface,
  },
  panel: {
    width: '100%',
    maxWidth: 420,
    borderRadius: 24,
    padding: 24,
    backgroundColor: Colors.surfaceContainerHigh,
    borderWidth: 1,
    borderColor: Colors.primary + '33',
  },
  kicker: {
    color: Colors.primary,
    fontFamily: 'Inter-Bold',
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 2,
  },
  title: {
    marginTop: 12,
    color: Colors.onSurface,
    fontFamily: 'Lexend-Black',
    fontSize: 30,
    lineHeight: 36,
    fontWeight: '900',
    fontStyle: 'italic',
  },
  copy: {
    marginTop: 12,
    color: Colors.onSurfaceVariant,
    fontFamily: 'Inter-Regular',
    fontSize: 14,
    lineHeight: 22,
  },
  button: {
    marginTop: 24,
    minHeight: 54,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.primary,
  },
  buttonText: {
    color: Colors.onPrimaryFixed,
    fontFamily: 'Inter-Bold',
    fontSize: 14,
    fontWeight: '900',
    letterSpacing: 0.8,
  },
});

export default AppErrorBoundary;
