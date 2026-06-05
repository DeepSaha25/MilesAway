import React, {useEffect, useMemo, useRef} from 'react';
import {StyleSheet, Text, TouchableOpacity, View} from 'react-native';
import MapView, {Marker, Polyline, Region} from 'react-native-maps';
import {Colors} from '../theme/colors';
import type {MotionState} from '../store/runStore';
import {
  RunCoordinate,
  estimateCalories,
  formatClock,
  formatDistance,
  formatPace,
} from '../utils/runMetrics';

interface LiveRunMapProps {
  route: RunCoordinate[];
  elapsedSeconds: number;
  distanceKm: number;
  elevationGain: number;
  currentPace: number | null;
  motionState: MotionState;
  canSaveRun: boolean;
  calories?: number;
  gpsStatus?: string;
  status: 'idle' | 'running' | 'paused' | 'summary';
  onPauseResume: () => void;
  onFinish: () => void;
  onCancel: () => void;
}

const computeBearing = (from: RunCoordinate, to: RunCoordinate) => {
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const toDeg = (rad: number) => (rad * 180) / Math.PI;

  const lat1 = toRad(from.latitude);
  const lat2 = toRad(to.latitude);
  const dLon = toRad(to.longitude - from.longitude);

  const y = Math.sin(dLon) * Math.cos(lat2);
  const x =
    Math.cos(lat1) * Math.sin(lat2) -
    Math.sin(lat1) * Math.cos(lat2) * Math.cos(dLon);
  const brng = toDeg(Math.atan2(y, x));
  return (brng + 360) % 360;
};

const LiveRunMap = ({
  route,
  elapsedSeconds,
  distanceKm,
  elevationGain,
  currentPace,
  motionState,
  canSaveRun,
  calories,
  gpsStatus,
  status,
  onPauseResume,
  onFinish,
  onCancel,
}: LiveRunMapProps) => {
  const mapRef = useRef<MapView>(null);
  const isPaused = status === 'paused';
  const hasRouteLine = route.length >= 2;
  const caloriesBurned = calories ?? estimateCalories(distanceKm);
  const latest = route[route.length - 1] || null;
  const start = route[0] || null;
  const gpsNeedsAttention =
    motionState !== 'GOOD_GPS' ||
    /acquiring|search|waiting|weak|required|could/i.test(gpsStatus || '');

  const arrowRotation =
    typeof latest?.heading === 'number'
      ? latest.heading
      : route.length >= 2 && latest
      ? computeBearing(route[route.length - 2], latest)
      : 0;

  const routeCoordinates = useMemo(
    () => route.map(point => ({latitude: point.latitude, longitude: point.longitude})),
    [route],
  );
  const motionBannerText =
    motionState === 'ACQUIRING_GPS'
      ? 'Finding GPS...'
      : motionState === 'LIVE_ESTIMATE'
      ? 'Tracking live estimate'
      : motionState === 'WEAK_GPS'
      ? 'GPS signal weak'
      : motionState === 'GPS_JUMPING'
      ? 'GPS signal jumping'
      : motionState === 'STATIONARY'
      ? 'Waiting for movement'
      : null;
  const statusText =
    motionState === 'GOOD_GPS' && canSaveRun
      ? 'Ready to save'
      : motionState === 'GOOD_GPS'
      ? 'Live GPS tracking'
      : motionBannerText || gpsStatus || 'Live GPS tracking';

  const initialRegion: Region = {
    latitude: latest?.latitude ?? 20.5937,
    longitude: latest?.longitude ?? 78.9629,
    latitudeDelta: latest ? 0.008 : 18,
    longitudeDelta: latest ? 0.008 : 18,
  };

  useEffect(() => {
    if (!latest || !mapRef.current) {
      return;
    }

    // prefer device-provided heading if available, otherwise derive from last two points
    let heading = 0;
    if (typeof latest.heading === 'number') {
      heading = latest.heading;
    } else if (route.length >= 2) {
      const prev = route[route.length - 2];
      heading = computeBearing(prev, latest);
    }

    mapRef.current.animateCamera(
      {
        center: {latitude: latest.latitude, longitude: latest.longitude},
        zoom: 16.5,
        pitch: 0,
        heading,
      },
      {duration: 900},
    );
  }, [latest, route]);

  return (
    <View style={styles.container}>
      <View style={styles.mapPanel}>
        <MapView
          ref={mapRef}
          style={styles.map}
          initialRegion={initialRegion}
          showsCompass={false}
          showsMyLocationButton={false}
          showsUserLocation={false}
          toolbarEnabled={false}
          loadingEnabled>
          {hasRouteLine ? (
            <Polyline
              coordinates={routeCoordinates}
              strokeColor={Colors.primaryContainer}
              strokeWidth={5}
            />
          ) : null}

          {start ? (
            <Marker coordinate={start} anchor={{x: 0.5, y: 0.5}}>
              <View style={styles.startMarker} />
            </Marker>
          ) : null}

          {latest ? (
            <Marker coordinate={latest} anchor={{x: 0.5, y: 0.5}}>
              <View style={styles.locationMarker}>
                <View style={styles.markerHalo} />
                <View style={styles.markerCore}>
                  <View
                    style={[
                      styles.markerArrow,
                      {transform: [{rotate: `${arrowRotation}deg`}]},
                    ]}
                  />
                  <View style={styles.markerCenter} />
                </View>
              </View>
            </Marker>
          ) : null}
        </MapView>
      </View>

      <View style={styles.statsPanel}>
        <View style={styles.heroCard}>
          <Text
            style={[
              styles.gpsStatus,
              gpsNeedsAttention && styles.gpsStatusWarning,
            ]}>
            {statusText}
          </Text>
          <View style={styles.distanceRow}>
            <Text style={styles.primaryValue}>{formatDistance(distanceKm)}</Text>
            <Text style={styles.primaryLabel}>km</Text>
          </View>
          <Text style={styles.timer}>{formatClock(elapsedSeconds)}</Text>
          {motionBannerText ? (
            <View style={styles.motionBanner}>
              <Text style={styles.motionBannerText}>{motionBannerText}</Text>
            </View>
          ) : null}
          <View style={styles.pacePanel}>
            <Text style={styles.paceLabel}>Pace</Text>
            <Text style={styles.paceValue}>
              {formatPace(currentPace)}
            </Text>
          </View>
        </View>

        <View style={styles.statGrid}>
          <View style={styles.statCard}>
            <Text style={styles.statLabel}>Calories</Text>
            <Text style={styles.statValue}>{Math.round(caloriesBurned)}</Text>
            <Text style={styles.statUnit}>kcal</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statLabel}>Climb</Text>
            <Text style={styles.statValue}>{Math.round(elevationGain)}</Text>
            <Text style={styles.statUnit}>m</Text>
          </View>
        </View>

        {isPaused ? (
          <View style={styles.pausedControls}>
            <TouchableOpacity
              style={[
                styles.primaryButton,
                styles.resumeButton,
                styles.fullWidthButton,
              ]}
              onPress={onPauseResume}>
              <Text style={styles.primaryButtonText}>Resume</Text>
            </TouchableOpacity>
            <View style={styles.pausedSecondaryRow}>
              <TouchableOpacity
                style={[
                  styles.finishButton,
                  !canSaveRun && styles.finishButtonDisabled,
                ]}
                activeOpacity={canSaveRun ? 0.7 : 1}
                accessibilityState={{disabled: !canSaveRun}}
                onPress={onFinish}>
                <Text
                  style={[
                    styles.finishButtonText,
                    !canSaveRun && styles.finishButtonTextDisabled,
                  ]}>
                  Finish Run
                </Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.discardButton} onPress={onCancel}>
                <Text style={styles.discardButtonText}>Discard Run</Text>
              </TouchableOpacity>
            </View>
          </View>
        ) : (
          <View style={styles.bottomControls}>
            <TouchableOpacity style={styles.primaryButton} onPress={onPauseResume}>
              <Text style={styles.primaryButtonText}>Pause</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.finishButton,
                !canSaveRun && styles.finishButtonDisabled,
              ]}
              activeOpacity={canSaveRun ? 0.7 : 1}
              accessibilityState={{disabled: !canSaveRun}}
              onPress={onFinish}>
              <Text
                style={[
                  styles.finishButtonText,
                  !canSaveRun && styles.finishButtonTextDisabled,
                ]}>
                Finish
              </Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.surface,
  },
  mapPanel: {
    flex: 0.75,
    minHeight: 220,
    borderBottomLeftRadius: 26,
    borderBottomRightRadius: 26,
    overflow: 'hidden',
    backgroundColor: Colors.surfaceContainerLow,
  },
  map: {
    flex: 1,
  },
  startMarker: {
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: Colors.secondary,
    borderWidth: 3,
    borderColor: Colors.onSurface,
  },
  locationMarker: {
    width: 54,
    height: 54,
    alignItems: 'center',
    justifyContent: 'center',
  },
  markerHalo: {
    position: 'absolute',
    width: 54,
    height: 54,
    borderRadius: 27,
    backgroundColor: Colors.primary + '22',
  },
  markerCore: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: Colors.surface,
    borderWidth: 5,
    borderColor: Colors.onSurface,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000000',
    shadowOffset: {width: 0, height: 6},
    shadowOpacity: 0.18,
    shadowRadius: 10,
    elevation: 8,
  },
  markerArrow: {
    position: 'absolute',
    top: -10,
    width: 0,
    height: 0,
    borderLeftWidth: 8,
    borderRightWidth: 8,
    borderBottomWidth: 22,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    borderBottomColor: Colors.secondary,
  },
  markerCenter: {
    width: 7,
    height: 7,
    borderRadius: 99,
    backgroundColor: Colors.onSurface,
  },
  pausedDot: {
    backgroundColor: Colors.tertiary,
  },
  statsPanel: {
    flexShrink: 0,
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 20,
    justifyContent: 'flex-start',
  },
  heroCard: {
    borderRadius: 24,
    backgroundColor: Colors.surfaceContainerLow,
    paddingHorizontal: 18,
    paddingVertical: 14,
    alignItems: 'center',
    shadowColor: '#000000',
    shadowOffset: {width: 0, height: 10},
    shadowOpacity: 0.08,
    shadowRadius: 22,
    elevation: 8,
  },
  timer: {
    color: Colors.onSurface,
    fontSize: 32,
    lineHeight: 38,
    fontWeight: '900',
    textAlign: 'center',
  },
  gpsStatus: {
    color: Colors.onSurfaceVariant,
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 1.4,
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  gpsStatusWarning: {
    color: Colors.tertiary,
  },
  distanceRow: {
    marginTop: 6,
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'center',
  },
  primaryValue: {
    color: Colors.onSurface,
    fontSize: 66,
    lineHeight: 70,
    fontWeight: '900',
    textAlign: 'center',
  },
  primaryLabel: {
    marginLeft: 8,
    color: Colors.onSurfaceVariant,
    fontSize: 18,
    fontWeight: '900',
  },
  pacePanel: {
    marginTop: 10,
    width: '100%',
    borderRadius: 18,
    paddingVertical: 12,
    paddingHorizontal: 14,
    backgroundColor: Colors.surfaceContainerHigh,
    alignItems: 'center',
  },
  motionBanner: {
    marginTop: 10,
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 8,
    backgroundColor: Colors.primary + '16',
    borderWidth: 1,
    borderColor: Colors.primary + '35',
  },
  motionBannerText: {
    color: Colors.primary,
    fontSize: 12,
    fontWeight: '900',
    textAlign: 'center',
  },
  paceLabel: {
    color: Colors.onSurfaceVariant,
    fontSize: 12,
    fontWeight: '900',
  },
  paceValue: {
    marginTop: 4,
    color: Colors.primary,
    fontSize: 28,
    fontWeight: '900',
  },
  statGrid: {
    marginTop: 10,
    flexDirection: 'row',
    gap: 8,
  },
  statCard: {
    flex: 1,
    minHeight: 82,
    borderRadius: 18,
    backgroundColor: Colors.surfaceContainerHigh,
    padding: 12,
  },
  statLabel: {
    color: Colors.onSurfaceVariant,
    fontSize: 11,
    fontWeight: '900',
    textTransform: 'uppercase',
  },
  statValue: {
    marginTop: 6,
    color: Colors.onSurface,
    fontSize: 20,
    fontWeight: '900',
  },
  statUnit: {
    marginTop: 2,
    color: Colors.onSurfaceVariant,
    fontSize: 11,
    fontWeight: '800',
  },
  bottomControls: {
    marginTop: 18,
    minHeight: 72,
    borderRadius: 28,
    backgroundColor: Colors.surfaceContainerHigh,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 12,
    shadowColor: '#000000',
    shadowOffset: {width: 0, height: 12},
    shadowOpacity: 0.14,
    shadowRadius: 26,
    elevation: 14,
  },
  secondaryButton: {
    flex: 1,
    height: 50,
    borderRadius: 17,
    backgroundColor: Colors.surfaceContainerHighest,
    alignItems: 'center',
    justifyContent: 'center',
  },
  secondaryButtonText: {
    color: Colors.onSurfaceVariant,
    fontSize: 13,
    fontWeight: '900',
    textTransform: 'uppercase',
  },
  primaryButton: {
    flex: 1.45,
    height: 54,
    borderRadius: 19,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  resumeButton: {
    backgroundColor: Colors.secondary,
  },
  fullWidthButton: {
    width: '100%',
    flex: 0,
  },
  primaryButtonText: {
    color: Colors.onPrimaryFixed,
    fontSize: 15,
    fontWeight: '900',
    textTransform: 'uppercase',
  },
  finishButton: {
    flex: 1,
    height: 50,
    borderRadius: 17,
    backgroundColor: Colors.surfaceContainerHighest,
    alignItems: 'center',
    justifyContent: 'center',
  },
  finishButtonDisabled: {
    opacity: 0.45,
  },
  finishButtonText: {
    color: Colors.onSurface,
    fontSize: 13,
    fontWeight: '900',
    textTransform: 'uppercase',
  },
  finishButtonTextDisabled: {
    color: Colors.onSurfaceVariant,
  },
  pausedControls: {
    marginTop: 18,
    borderRadius: 28,
    backgroundColor: Colors.surfaceContainerHigh,
    gap: 12,
    padding: 12,
    shadowColor: '#000000',
    shadowOffset: {width: 0, height: 12},
    shadowOpacity: 0.14,
    shadowRadius: 26,
    elevation: 14,
  },
  pausedSecondaryRow: {
    flexDirection: 'row',
    gap: 12,
  },
  discardButton: {
    flex: 1,
    height: 50,
    borderRadius: 17,
    backgroundColor: Colors.errorContainer,
    alignItems: 'center',
    justifyContent: 'center',
  },
  discardButtonText: {
    color: Colors.onErrorContainer,
    fontSize: 12,
    fontWeight: '900',
    textTransform: 'uppercase',
  },
});

export default LiveRunMap;
