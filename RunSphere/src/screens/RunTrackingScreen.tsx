import React, {useCallback, useEffect, useRef, useState} from 'react';
import {
  Alert,
} from 'react-native';
import Toast from 'react-native-toast-message';
import LiveRunMap from '../components/LiveRunMap';
import {
  RunStatus,
  RunTrackPoint,
  selectCanSaveRun,
  selectRunMetrics,
  selectSaveBlockReason,
  selectTelemetryDiagnostics,
  shouldRestoreTelemetrySession,
  useRunStore,
} from '../store/runStore';
import {recoverActiveTelemetrySession} from '../services/telemetrySessionStorage';
import {
  startBackgroundLocationTracking,
  stopBackgroundLocationTracking,
} from '../services/backgroundLocationTracking';
import {
  getLatestSensorSnapshot,
  startSensorTelemetry,
  stopSensorTelemetry,
} from '../services/sensorTelemetry';
import {useUserStore} from '../store/userStore';
import {
  getCurrentLocation,
  requestLocationPermission,
  startLocationWatch,
  stopLocationWatch,
} from '../utils/location';

const toLiveRunStatus = (
  status: RunStatus,
): 'idle' | 'running' | 'paused' | 'summary' => {
  switch (status) {
    case 'TRACKING':
      return 'running';
    case 'PAUSED':
      return 'paused';
    case 'COMPLETED':
      return 'summary';
    case 'IDLE':
    default:
      return 'idle';
  }
};

const RunTrackingScreen = ({navigation}: any) => {
  const updateBackendLocation = useUserStore(state => state.updateBackendLocation);
  const runState = useRunStore();
  const profile = useUserStore(state => state.profile);
  const pauseRun = useRunStore(state => state.pauseRun);
  const resumeRun = useRunStore(state => state.resumeRun);
  const completeRun = useRunStore(state => state.completeRun);
  const resetRun = useRunStore(state => state.resetRun);
  const watchRef = useRef<ReturnType<typeof startLocationWatch> | null>(null);
  const backgroundTrackingStartedRef = useRef(false);
  const backgroundTrackingStartAttemptRef = useRef(false);
  const telemetryLogRef = useRef<{
    lastLoggedAt: number;
    confidenceState: string | null;
  }>({lastLoggedAt: 0, confidenceState: null});
  const [initializing, setInitializing] = useState(true);
  const [now, setNow] = useState(Date.now());
  const [locationStatus, setLocationStatus] = useState('Acquiring GPS lock...');
  const sensorSnapshot = getLatestSensorSnapshot();
  const metrics = selectRunMetrics(runState, profile?.weightKg, now, sensorSnapshot);
  const canSaveRun = selectCanSaveRun(runState, now);

  const clearForegroundTrackingArtifacts = useCallback(() => {
    stopLocationWatch(watchRef.current);
    watchRef.current = null;
    stopSensorTelemetry();
  }, []);

  const stopBackgroundTracking = useCallback(() => {
    backgroundTrackingStartedRef.current = false;
    backgroundTrackingStartAttemptRef.current = false;
    stopBackgroundLocationTracking().catch(() => undefined);
  }, []);

  const clearTrackingArtifacts = useCallback(
    ({includeBackground = true}: {includeBackground?: boolean} = {}) => {
      clearForegroundTrackingArtifacts();
      if (includeBackground) {
        stopBackgroundTracking();
      }
    },
    [clearForegroundTrackingArtifacts, stopBackgroundTracking],
  );

  const ensureBackgroundTracking = useCallback(() => {
    if (
      backgroundTrackingStartedRef.current ||
      backgroundTrackingStartAttemptRef.current
    ) {
      return;
    }

    backgroundTrackingStartAttemptRef.current = true;
    startBackgroundLocationTracking()
      .then(result => {
        backgroundTrackingStartedRef.current = result.started;
        backgroundTrackingStartAttemptRef.current = false;

        if (!result.started && __DEV__) {
          console.debug('[MilesAway][background-location]', {
            event: 'start-skipped',
            reason: result.reason,
            message: result.message,
          });
        }
      })
      .catch(error => {
        backgroundTrackingStartedRef.current = false;
        backgroundTrackingStartAttemptRef.current = false;

        if (__DEV__) {
          console.debug('[MilesAway][background-location]', {
            event: 'start-failed',
            message: error?.message || 'Unable to start background tracking',
          });
        }
      });
  }, []);

  const syncLocationToBackend = useCallback(
    async (coordinate: RunTrackPoint) => {
      if (
        typeof coordinate.accuracy === 'number' &&
        coordinate.accuracy > 100
      ) {
        setLocationStatus('Waiting for stronger GPS signal');
        return;
      }

      try {
        const updatedProfile = await updateBackendLocation(
          coordinate.latitude,
          coordinate.longitude,
        );
        if (updatedProfile) {
          setLocationStatus('GPS locked');
        }
      } catch {
        setLocationStatus('GPS locked');
      }
    },
    [updateBackendLocation],
  );

  const ingestPosition = useCallback(
    async (position: any, syncProfile = false) => {
      const coordinate: RunTrackPoint = {
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
        altitude:
          typeof position.coords.altitude === 'number'
            ? position.coords.altitude
            : null,
        accuracy:
          typeof position.coords.accuracy === 'number'
            ? position.coords.accuracy
            : null,
        speed:
          typeof position.coords.speed === 'number'
            ? position.coords.speed
            : null,
        heading:
          typeof position.coords.heading === 'number'
            ? position.coords.heading
            : null,
        timestamp:
          typeof position.timestamp === 'number' ? position.timestamp : Date.now(),
      };

      const store = useRunStore.getState();
      if (store.status === 'IDLE') {
        store.startRun(coordinate);
      } else if (store.status === 'TRACKING') {
        store.addCoordinate(coordinate);
      }

      setLocationStatus('Live GPS tracking');

      if (__DEV__) {
        const updatedStore = useRunStore.getState();
        const diagnostics = selectTelemetryDiagnostics(
          updatedStore,
          Date.now(),
          getLatestSensorSnapshot(),
        );
        const shouldLog =
          Date.now() - telemetryLogRef.current.lastLoggedAt >= 5000 ||
          telemetryLogRef.current.confidenceState !== diagnostics.confidenceState;

        if (shouldLog) {
          telemetryLogRef.current = {
            lastLoggedAt: Date.now(),
            confidenceState: diagnostics.confidenceState,
          };
          console.debug('[MilesAway][telemetry]', diagnostics);
        }
      }

      if (syncProfile) {
        await syncLocationToBackend(coordinate);
      }
    },
    [syncLocationToBackend],
  );

  useEffect(() => {
    let active = true;

    const bootstrap = async () => {
      const recoveredSession = await recoverActiveTelemetrySession().catch(() => null);
      if (active && recoveredSession) {
        const currentStore = useRunStore.getState();
        if (shouldRestoreTelemetrySession(currentStore, recoveredSession)) {
          currentStore.restoreRunFromJournal(recoveredSession);
          setLocationStatus('Recovered previous GPS session');

          if (__DEV__) {
            console.debug('[MilesAway][telemetry-journal]', {
              event: 'recovered',
              clientRunId: recoveredSession.clientRunId,
              status: recoveredSession.status,
              pointCount: recoveredSession.coordinates.length,
            });
          }
        }
      }

      const currentRun = useRunStore.getState();
      if (currentRun.status === 'COMPLETED') {
        if (currentRun.coordinates.length >= 2) {
          navigation.replace('RunSummary');
          return;
        }

        resetRun();
      }

      if (currentRun.status === 'IDLE') {
        resetRun();
      }

      try {
        const granted = await requestLocationPermission();
        if (!granted) {
          Toast.show({
            type: 'error',
            text1: 'Location permission required',
            text2: 'Enable GPS access to track an outdoor run.',
          });
          navigation.goBack();
          return;
        }

        const currentPosition = await getCurrentLocation();
        if (!active) {
          return;
        }

        await ingestPosition(currentPosition, true);
      } catch (error: any) {
        Toast.show({
          type: 'error',
          text1: 'Could not start GPS',
          text2: error?.message || 'Please check location services and try again.',
        });
        navigation.goBack();
        return;
      }

      if (active) {
        setInitializing(false);
      }
    };

    bootstrap();

    return () => {
      active = false;
      clearTrackingArtifacts({includeBackground: false});
    };
  }, [clearTrackingArtifacts, ingestPosition, navigation, resetRun]);

  useEffect(() => {
    if (runState.status !== 'TRACKING' && runState.status !== 'PAUSED') {
      return undefined;
    }

    const intervalId = setInterval(() => {
      setNow(Date.now());
    }, 1000);

    return () => clearInterval(intervalId);
  }, [runState.status]);

  useEffect(() => {
    if (
      initializing ||
      runState.status === 'IDLE' ||
      runState.status === 'COMPLETED'
    ) {
      clearTrackingArtifacts();
      return;
    }

    if (runState.status === 'PAUSED') {
      clearTrackingArtifacts();
      return;
    }

    ensureBackgroundTracking();

    if (watchRef.current === null) {
      startSensorTelemetry().catch(() => undefined);
      watchRef.current = startLocationWatch(
        position => {
          ingestPosition(position);
        },
        () => {
          setLocationStatus('Waiting for stronger GPS signal');
        },
      );
    }
  }, [
    clearTrackingArtifacts,
    ensureBackgroundTracking,
    ingestPosition,
    initializing,
    runState.status,
  ]);

  const pauseOrResume = () => {
    if (runState.status === 'TRACKING') {
      pauseRun();
      setLocationStatus('Run paused');
      return;
    }

    resumeRun();
    setLocationStatus('Live GPS tracking');
  };

  const discardRun = () => {
    clearTrackingArtifacts();
    resetRun();
    navigation.goBack();
  };

  const finishRun = () => {
    const currentRun = useRunStore.getState();
    const saveBlockReason = selectSaveBlockReason(currentRun, Date.now());
    if (saveBlockReason) {
      Alert.alert('Keep moving', saveBlockReason, [
        {text: 'OK', style: 'default'},
      ]);
      return;
    }

    Alert.alert('Finish run?', 'Your run will be saved and shown on the summary.', [
      {text: 'Keep running', style: 'cancel'},
      {
        text: 'Finish',
        onPress: () => {
          const latestRun = useRunStore.getState();
          const latestSaveBlockReason = selectSaveBlockReason(latestRun, Date.now());
          if (latestSaveBlockReason) {
            Toast.show({
              type: 'error',
              text1: 'Session is too short',
              text2: latestSaveBlockReason,
            });
            return;
          }

          clearTrackingArtifacts();
          completeRun();
          navigation.navigate('RunSummary');
        },
      },
    ]);
  };

  return (
    <LiveRunMap
      route={metrics.previewCoordinates}
      elapsedSeconds={metrics.elapsedSeconds}
      distanceKm={metrics.previewDistanceKm}
      elevationGain={metrics.elevationGain}
      calories={metrics.liveCaloriesBurned}
      currentPace={metrics.currentPace}
      motionState={metrics.motionState}
      canSaveRun={canSaveRun}
      gpsStatus={locationStatus}
      status={initializing ? 'idle' : toLiveRunStatus(runState.status)}
      onPauseResume={pauseOrResume}
      onFinish={finishRun}
      onCancel={discardRun}
    />
  );
};

export default RunTrackingScreen;
