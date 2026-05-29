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
  selectRunCoordinates,
  selectRunMetrics,
  useRunStore,
} from '../store/runStore';
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
  const [initializing, setInitializing] = useState(true);
  const [now, setNow] = useState(Date.now());
  const [locationStatus, setLocationStatus] = useState('Acquiring GPS lock...');
  const metrics = selectRunMetrics(runState, profile?.weightKg, now);
  const route = selectRunCoordinates(runState);

  const clearTrackingArtifacts = useCallback(() => {
    stopLocationWatch(watchRef.current);
    watchRef.current = null;
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

      if (syncProfile) {
        await syncLocationToBackend(coordinate);
      }
    },
    [syncLocationToBackend],
  );

  useEffect(() => {
    let active = true;

    const bootstrap = async () => {
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
      clearTrackingArtifacts();
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

    if (watchRef.current === null) {
      watchRef.current = startLocationWatch(
        position => {
          ingestPosition(position);
        },
        () => {
          setLocationStatus('Waiting for stronger GPS signal');
        },
      );
    }
  }, [clearTrackingArtifacts, ingestPosition, initializing, runState.status]);

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
    Alert.alert('Finish run?', 'Your run will be saved and shown on the summary.', [
      {text: 'Keep running', style: 'cancel'},
      {
        text: 'Finish',
        onPress: () => {
          const currentRun = useRunStore.getState();
          if (!selectCanSaveRun(currentRun)) {
            Toast.show({
              type: 'error',
              text1: 'Run discarded',
              text2:
                currentRun.coordinates.length < 2
                  ? 'A saved run needs at least two GPS samples.'
                  : 'A saved run needs at least 0.01 km and 30 seconds.',
            });
            discardRun();
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
      route={route}
      elapsedSeconds={metrics.elapsedSeconds}
      distanceKm={metrics.distanceKm}
      elevationGain={metrics.elevationGain}
      calories={metrics.caloriesBurned}
      gpsStatus={locationStatus}
      status={initializing ? 'idle' : toLiveRunStatus(runState.status)}
      onPauseResume={pauseOrResume}
      onFinish={finishRun}
      onCancel={discardRun}
    />
  );
};

export default RunTrackingScreen;
