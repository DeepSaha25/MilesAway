import React, {useCallback, useEffect, useRef, useState} from 'react';
import {
  Alert,
} from 'react-native';
import Toast from 'react-native-toast-message';
import LiveRunMap from '../components/LiveRunMap';
import {useRunStore} from '../store/runStore';
import {useUserStore} from '../store/userStore';
import {
  RunCoordinate,
  estimateCalories,
} from '../utils/runMetrics';
import {
  getCurrentLocation,
  requestLocationPermission,
  startLocationWatch,
  stopLocationWatch,
} from '../utils/location';

const RunTrackingScreen = ({navigation}: any) => {
  const updateBackendLocation = useUserStore(state => state.updateBackendLocation);
  const status = useRunStore(state => state.status);
  const coordinates = useRunStore(state => state.coordinates);
  const distanceKm = useRunStore(state => state.distanceKm);
  const elapsedSeconds = useRunStore(state => state.elapsedSeconds);
  const elevationGain = useRunStore(state => state.elevationGain);
  const profile = useUserStore(state => state.profile);
  const pauseRun = useRunStore(state => state.pauseRun);
  const resumeRun = useRunStore(state => state.resumeRun);
  const prepareSummary = useRunStore(state => state.prepareSummary);
  const resetRun = useRunStore(state => state.resetRun);
  const watchRef = useRef<ReturnType<typeof startLocationWatch> | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const [initializing, setInitializing] = useState(true);
  const [locationStatus, setLocationStatus] = useState('Acquiring GPS lock...');

  const clearTrackingArtifacts = useCallback(() => {
    stopLocationWatch(watchRef.current);
    watchRef.current = null;

    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const syncLocationToBackend = useCallback(
    async (coordinate: RunCoordinate) => {
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
      const coordinate: RunCoordinate = {
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
        timestamp: new Date(position.timestamp || Date.now()).toISOString(),
      };

      const store = useRunStore.getState();
      if (store.status === 'idle') {
        store.startRun(coordinate);
      } else {
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
      if (currentRun.status === 'summary') {
        if (currentRun.coordinates.length >= 2) {
          navigation.replace('RunSummary');
          return;
        }

        resetRun();
      }

      if (currentRun.status === 'idle') {
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
    if (initializing || status === 'idle' || status === 'summary') {
      clearTrackingArtifacts();
      return;
    }

    if (status === 'paused') {
      clearTrackingArtifacts();
      return;
    }

    if (!timerRef.current) {
      timerRef.current = setInterval(() => {
        useRunStore.getState().tick();
      }, 1000);
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
  }, [clearTrackingArtifacts, ingestPosition, initializing, status]);

  const pauseOrResume = () => {
    if (status === 'running') {
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
          if (distanceKm < 0.2 || elapsedSeconds < 60) {
            Toast.show({
              type: 'error',
              text1: 'Run discarded',
              text2: 'A saved run needs at least 0.2 km and 60 seconds.',
            });
            discardRun();
            return;
          }

          if (coordinates.length < 2) {
            Toast.show({
              type: 'error',
              text1: 'Run discarded',
              text2: 'A saved run needs at least two GPS samples.',
            });
            discardRun();
            return;
          }

          clearTrackingArtifacts();
          prepareSummary();
          navigation.navigate('RunSummary');
        },
      },
    ]);
  };

  return (
    <LiveRunMap
      route={coordinates}
      elapsedSeconds={elapsedSeconds}
      distanceKm={distanceKm}
      elevationGain={elevationGain}
      calories={estimateCalories(distanceKm, profile?.weightKg)}
      gpsStatus={locationStatus}
      status={initializing ? 'idle' : status}
      onPauseResume={pauseOrResume}
      onFinish={finishRun}
      onCancel={discardRun}
    />
  );
};

export default RunTrackingScreen;
