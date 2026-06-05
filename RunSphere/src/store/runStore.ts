import AsyncStorage from '@react-native-async-storage/async-storage';
import {create} from 'zustand';
import {createJSONStorage, devtools, persist} from 'zustand/middleware';
import {
  RunCoordinate,
  calculatePaceMinutesPerKm,
  calculateSegmentSpeedKmh,
  estimateCalories,
  hasUsableAccuracy,
  haversineMeters,
} from '../utils/runMetrics';
import {RUN_LEDGER_POLICY, RUN_LIVE_POLICY} from '../config/runPolicy';

export type RunStatus = 'IDLE' | 'TRACKING' | 'PAUSED' | 'COMPLETED';
export type MotionState =
  | 'ACQUIRING_GPS'
  | 'LIVE_ESTIMATE'
  | 'GOOD_GPS'
  | 'WEAK_GPS'
  | 'GPS_JUMPING'
  | 'STATIONARY'
  | 'TOO_FAST_FOR_RUN';

export type TelemetryIssueType = 'WEAK_GPS' | 'GPS_JUMPING';

export type TelemetryIssue = {
  type: TelemetryIssueType;
  timestamp: number;
};

export type PauseInterval = {
  pausedAt: number;
  resumedAt: number | null;
};

export type RunTrackPoint = {
  latitude: number;
  longitude: number;
  timestamp: number;
  accuracy: number | null;
  altitude?: number | null;
  speed?: number | null;
  heading?: number | null;
};

export type RunFacts = {
  status: RunStatus;
  startTime: number | null;
  endTime: number | null;
  pauseIntervals: PauseInterval[];
  coordinates: RunTrackPoint[];
  clientRunId: string | null;
  lastTelemetryIssue: TelemetryIssue | null;
};

export type RunMetrics = {
  coordinates: RunCoordinate[];
  previewCoordinates: RunCoordinate[];
  liveCoordinates: RunCoordinate[];
  elapsedSeconds: number;
  distanceKm: number;
  previewDistanceKm: number;
  liveDistanceKm: number;
  elevationGain: number;
  averagePace: number;
  currentPace: number | null;
  motionState: MotionState;
  caloriesBurned: number;
  liveCaloriesBurned: number;
};

export type TelemetryDiagnostics = {
  rawPointCount: number;
  previewPointCount: number;
  verifiedPointCount: number;
  latestAccuracyMeters: number | null;
  nativeSpeedMps: number | null;
  nativeSpeedKmh: number | null;
  latestSegmentSpeedKmh: number | null;
  confidenceState: MotionState;
  canSaveRun: boolean;
  saveEligibilityReason: string | null;
};

type StartRunSeed = RunTrackPoint | RunCoordinate | null;

interface RunState extends RunFacts {
  startRun: (seed?: StartRunSeed) => void;
  addCoordinate: (coordinate: RunTrackPoint | RunCoordinate) => void;
  pauseRun: () => void;
  resumeRun: () => void;
  completeRun: () => void;
  resetRun: () => void;
}

type LegacyRunStatus = RunStatus | 'idle' | 'running' | 'paused' | 'summary';

type LegacyRunState = Partial<
  RunFacts & {
    status: LegacyRunStatus;
    startedAt: string | null;
    finishedAt: string | null;
    elapsedSeconds: number;
    distanceKm: number;
    elevationGain: number;
    lastTelemetryIssue: TelemetryIssue | null;
    coordinates: Array<Partial<RunTrackPoint> & Partial<RunCoordinate>>;
  }
>;

const MIN_SAVE_DISTANCE_KM = RUN_LEDGER_POLICY.MIN_SAVE_DISTANCE_KM;
const MIN_SAVE_DURATION_SECONDS = RUN_LEDGER_POLICY.MIN_SAVE_DURATION_SECONDS;
const MIN_SAVE_COORDINATES = RUN_LEDGER_POLICY.MIN_SAVE_COORDINATES;
const STATIONARY_WINDOW_MS = 15 * 1000;
const TELEMETRY_ISSUE_WINDOW_MS = 12 * 1000;

export const MINIMUM_SAVE_BLOCK_REASON = `Track at least ${MIN_SAVE_DISTANCE_KM.toFixed(
  2,
)} km, ${MIN_SAVE_DURATION_SECONDS} seconds, and ${MIN_SAVE_COORDINATES} GPS points before saving a run.`;

export const PREVIEW_SAVE_BLOCK_REASON =
  'Live movement detected, but not enough verified movement distance to save.';

export const initialRunFacts: RunFacts = {
  status: 'IDLE',
  startTime: null,
  endTime: null,
  pauseIntervals: [],
  coordinates: [],
  clientRunId: null,
  lastTelemetryIssue: null,
};

export class RunStateTransitionError extends Error {
  constructor(action: string, current: RunStatus, expected: RunStatus[]) {
    super(
      `Cannot ${action} while run status is ${current}. Expected ${expected.join(
        ' or ',
      )}.`,
    );
    this.name = 'RunStateTransitionError';
  }
}

const createClientRunId = () =>
  `run-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;

const isFiniteNumber = (value: unknown): value is number =>
  typeof value === 'number' && Number.isFinite(value);

const toTimestamp = (value: unknown, fallback = Date.now()): number => {
  if (isFiniteNumber(value)) {
    return value;
  }

  if (typeof value === 'string') {
    const parsed = Date.parse(value);
    return Number.isFinite(parsed) ? parsed : fallback;
  }

  return fallback;
};

const parseTimestamp = (value: unknown): number | null => {
  if (isFiniteNumber(value)) {
    return value;
  }

  if (typeof value === 'string') {
    const parsed = Date.parse(value);
    return Number.isFinite(parsed) ? parsed : null;
  }

  return null;
};

const optionalNumber = (value: unknown): number | null =>
  isFiniteNumber(value) ? value : null;

const normalizeCoordinate = (
  coordinate: RunTrackPoint | RunCoordinate,
): RunTrackPoint | null => {
  const latitude = Number(coordinate.latitude);
  const longitude = Number(coordinate.longitude);

  if (
    !Number.isFinite(latitude) ||
    !Number.isFinite(longitude) ||
    Math.abs(latitude) > 90 ||
    Math.abs(longitude) > 180
  ) {
    return null;
  }

  const timestamp = parseTimestamp(coordinate.timestamp);
  if (timestamp === null) {
    return null;
  }

  return {
    latitude,
    longitude,
    timestamp,
    accuracy: optionalNumber(coordinate.accuracy),
    altitude: optionalNumber(coordinate.altitude),
    speed: optionalNumber(coordinate.speed),
    heading: optionalNumber(coordinate.heading),
  };
};

const toRunCoordinate = (coordinate: RunTrackPoint): RunCoordinate => ({
  latitude: coordinate.latitude,
  longitude: coordinate.longitude,
  altitude: coordinate.altitude ?? null,
  accuracy: coordinate.accuracy ?? null,
  speed: coordinate.speed ?? null,
  heading: coordinate.heading ?? null,
  timestamp: new Date(coordinate.timestamp).toISOString(),
});

const assertTransition = (
  status: RunStatus,
  expected: RunStatus[],
  action: string,
) => {
  if (!expected.includes(status)) {
    throw new RunStateTransitionError(action, status, expected);
  }
};

const normalizeStatus = (status: LegacyRunStatus | undefined): RunStatus => {
  switch (status) {
    case 'running':
      return 'TRACKING';
    case 'paused':
      return 'PAUSED';
    case 'summary':
      return 'COMPLETED';
    case 'idle':
      return 'IDLE';
    case 'TRACKING':
    case 'PAUSED':
    case 'COMPLETED':
    case 'IDLE':
      return status;
    default:
      return 'IDLE';
  }
};

export const migrateRunState = (persistedState: unknown): Partial<RunFacts> => {
  const legacy = (persistedState || {}) as LegacyRunState;
  const status = normalizeStatus(legacy.status);
  const startTime =
    legacy.startTime ?? (legacy.startedAt ? toTimestamp(legacy.startedAt) : null);
  const endTime =
    legacy.endTime ?? (legacy.finishedAt ? toTimestamp(legacy.finishedAt) : null);
  const coordinates = Array.isArray(legacy.coordinates)
    ? legacy.coordinates
        .map(coordinate => normalizeCoordinate(coordinate as RunTrackPoint))
        .filter((coordinate): coordinate is RunTrackPoint => Boolean(coordinate))
    : [];
  const pauseIntervals = Array.isArray(legacy.pauseIntervals)
    ? legacy.pauseIntervals
        .map(interval => ({
          pausedAt: toTimestamp(interval.pausedAt, startTime ?? Date.now()),
          resumedAt:
            interval.resumedAt === null || interval.resumedAt === undefined
              ? null
              : toTimestamp(interval.resumedAt),
        }))
        .filter(interval => Number.isFinite(interval.pausedAt))
    : [];

  return {
    status,
    startTime,
    endTime,
    pauseIntervals,
    coordinates,
    clientRunId: legacy.clientRunId ?? null,
    lastTelemetryIssue: legacy.lastTelemetryIssue ?? null,
  };
};

export const selectRunDuration = (
  state: RunFacts,
  now = Date.now(),
): number => {
  if (state.startTime === null) {
    return 0;
  }

  const effectiveEnd = state.endTime ?? now;
  const totalMs = Math.max(0, effectiveEnd - state.startTime);
  const pausedMs = state.pauseIntervals.reduce((sum, interval) => {
    const pausedAt = Math.max(interval.pausedAt, state.startTime ?? interval.pausedAt);
    const resumedAt = Math.min(interval.resumedAt ?? effectiveEnd, effectiveEnd);
    return sum + Math.max(0, resumedAt - pausedAt);
  }, 0);

  return Math.max(0, Math.floor((totalMs - pausedMs) / 1000));
};

type MovementSegment = {
  previous: RunTrackPoint;
  current: RunTrackPoint;
  distanceMeters: number;
  speedKmh: number | null;
};

type MovementPolicy = {
  JITTER_DISTANCE_METERS: number;
  MAX_SEGMENT_SPEED_KMH: number;
  STATIONARY_SPEED_THRESHOLD_KMH: number;
};

const LIVE_MOVEMENT_POLICY: MovementPolicy = {
  JITTER_DISTANCE_METERS: RUN_LIVE_POLICY.LIVE_JITTER_DISTANCE_METERS,
  MAX_SEGMENT_SPEED_KMH: RUN_LIVE_POLICY.LIVE_MAX_SEGMENT_SPEED_KMH,
  STATIONARY_SPEED_THRESHOLD_KMH: RUN_LIVE_POLICY.STATIONARY_SPEED_THRESHOLD_KMH,
};

const isPausedAt = (state: RunFacts, timestamp: number) =>
  state.pauseIntervals.some(interval => {
    const resumedAt = interval.resumedAt ?? Number.POSITIVE_INFINITY;
    return timestamp >= interval.pausedAt && timestamp <= resumedAt;
  });

const sortCoordinatesByTime = (coordinates: RunTrackPoint[]) =>
  [...coordinates].sort((a, b) => a.timestamp - b.timestamp);

const selectLedgerUsableCoordinates = (state: RunFacts): RunTrackPoint[] =>
  sortCoordinatesByTime(state.coordinates).filter(coordinate =>
    hasUsableAccuracy(
      toRunCoordinate(coordinate),
      RUN_LEDGER_POLICY.CORE_SAVE_MAX_ACCURACY,
    ),
  );

const selectLiveUsableCoordinates = (state: RunFacts): RunTrackPoint[] =>
  sortCoordinatesByTime(state.coordinates).filter(coordinate =>
    hasUsableAccuracy(
      toRunCoordinate(coordinate),
      RUN_LIVE_POLICY.LIVE_DISPLAY_MAX_ACCURACY,
    ),
  );

const getSegment = (
  previous: RunTrackPoint,
  current: RunTrackPoint,
): MovementSegment | null => {
  const previousCoordinate = toRunCoordinate(previous);
  const currentCoordinate = toRunCoordinate(current);
  const distanceMeters = haversineMeters(previousCoordinate, currentCoordinate);
  const speedKmh = calculateSegmentSpeedKmh(
    previousCoordinate,
    currentCoordinate,
    distanceMeters,
  );

  return {
    previous,
    current,
    distanceMeters,
    speedKmh,
  };
};

const isMovementSegment = (segment: MovementSegment, policy: MovementPolicy) =>
  segment.distanceMeters >= policy.JITTER_DISTANCE_METERS &&
  (segment.speedKmh === null ||
    segment.speedKmh >= policy.STATIONARY_SPEED_THRESHOLD_KMH);

const calculateAcceptedDistanceMeters = (
  coordinates: RunTrackPoint[],
  policy: MovementPolicy,
): number => {
  if (coordinates.length < 2) {
    return 0;
  }

  let totalMeters = 0;
  let anchor = coordinates[0];

  for (let index = 1; index < coordinates.length; index += 1) {
    const current = coordinates[index];
    const segment = getSegment(anchor, current);
    if (!segment) {
      anchor = current;
      continue;
    }

    if (!isMovementSegment(segment, policy)) {
      anchor = current;
      continue;
    }

    totalMeters += segment.distanceMeters;
    anchor = current;
  }

  return totalMeters;
};

const calculateTrustedDistanceMeters = (coordinates: RunTrackPoint[]): number =>
  calculateAcceptedDistanceMeters(coordinates, RUN_LEDGER_POLICY);

const calculateLiveDistanceMeters = (coordinates: RunTrackPoint[]): number =>
  calculateAcceptedDistanceMeters(coordinates, LIVE_MOVEMENT_POLICY);

const selectPreviewUsableCoordinates = (state: RunFacts): RunTrackPoint[] => {
  const coordinates = selectLiveUsableCoordinates(state);
  if (coordinates.length < 2) {
    return coordinates;
  }

  const acceptedCoordinates = [coordinates[0]];
  let anchor = coordinates[0];

  for (let index = 1; index < coordinates.length; index += 1) {
    const current = coordinates[index];
    const segment = getSegment(anchor, current);
    if (!segment) {
      continue;
    }

    acceptedCoordinates.push(current);
    anchor = current;
  }

  return acceptedCoordinates;
};

const isRecentTelemetryIssue = (
  state: RunFacts,
  type: TelemetryIssueType,
  now: number,
) =>
  state.lastTelemetryIssue?.type === type &&
  now - state.lastTelemetryIssue.timestamp <= TELEMETRY_ISSUE_WINDOW_MS;

const selectLatestCoordinate = (
  coordinates: RunTrackPoint[],
  state: RunFacts,
  now: number,
): RunTrackPoint | null => {
  const availableCoordinates = coordinates.filter(
    coordinate =>
      coordinate.timestamp <= now && !isPausedAt(state, coordinate.timestamp),
  );

  return availableCoordinates[availableCoordinates.length - 1] || null;
};

const selectLatestNativeSpeedKmh = (
  coordinates: RunTrackPoint[],
  state: RunFacts,
  now: number,
) => {
  const latest = selectLatestCoordinate(coordinates, state, now);
  return typeof latest?.speed === 'number' && Number.isFinite(latest.speed)
    ? latest.speed * 3.6
    : null;
};

const calculateAverageSpeedKmh = (coordinates: RunTrackPoint[]) => {
  if (coordinates.length < 2) {
    return 0;
  }

  const distanceMeters = calculateLiveDistanceMeters(coordinates);
  const elapsedSeconds =
    (coordinates[coordinates.length - 1].timestamp - coordinates[0].timestamp) /
    1000;

  if (elapsedSeconds <= 0) {
    return 0;
  }

  return (distanceMeters / 1000) / (elapsedSeconds / 3600);
};

const selectTrustedMovementCoordinates = (state: RunFacts): RunTrackPoint[] => {
  const coordinates = selectLedgerUsableCoordinates(state);
  if (coordinates.length < 2) {
    return coordinates;
  }

  const acceptedCoordinates = [coordinates[0]];
  let anchor = coordinates[0];

  for (let index = 1; index < coordinates.length; index += 1) {
    const current = coordinates[index];
    const segment = getSegment(anchor, current);
    if (!segment) {
      anchor = current;
      continue;
    }

    if (!isMovementSegment(segment, RUN_LEDGER_POLICY)) {
      anchor = current;
      continue;
    }

    acceptedCoordinates.push(current);
    anchor = current;
  }

  return acceptedCoordinates;
};

export const selectVerifiedDistance = (state: RunFacts): number => {
  const meters = calculateTrustedDistanceMeters(selectLedgerUsableCoordinates(state));

  return Math.round((meters / 1000) * 1000) / 1000;
};

export const selectRunDistance = selectVerifiedDistance;

export const selectPreviewDistance = (state: RunFacts): number => {
  const meters = calculateLiveDistanceMeters(selectPreviewUsableCoordinates(state));

  return Math.round((meters / 1000) * 1000) / 1000;
};

export const selectLiveDistance = selectPreviewDistance;

export const selectMotionState = (
  state: RunFacts,
  now = state.endTime ?? Date.now(),
): MotionState => {
  if (isRecentTelemetryIssue(state, 'GPS_JUMPING', now)) {
    return 'GPS_JUMPING';
  }

  const previewCoordinates = selectPreviewUsableCoordinates(state);
  const latestPreviewCoordinate = selectLatestCoordinate(
    previewCoordinates,
    state,
    now,
  );

  if (
    (typeof latestPreviewCoordinate?.accuracy === 'number' &&
      latestPreviewCoordinate.accuracy >
        RUN_LEDGER_POLICY.CORE_SAVE_MAX_ACCURACY &&
      latestPreviewCoordinate.accuracy <=
        RUN_LIVE_POLICY.LIVE_DISPLAY_MAX_ACCURACY) ||
    isRecentTelemetryIssue(state, 'WEAK_GPS', now)
  ) {
    return 'WEAK_GPS';
  }

  if (previewCoordinates.length < 2) {
    return 'ACQUIRING_GPS';
  }

  const windowStart = now - STATIONARY_WINDOW_MS;
  const recentCoordinates = previewCoordinates.filter(
    coordinate =>
      coordinate.timestamp >= windowStart &&
      coordinate.timestamp <= now &&
      !isPausedAt(state, coordinate.timestamp),
  );

  if (recentCoordinates.length < 2) {
    return 'ACQUIRING_GPS';
  }

  const recentDistanceMeters = calculateLiveDistanceMeters(recentCoordinates);
  const averageSpeedKmh = calculateAverageSpeedKmh(recentCoordinates);
  const latestNativeSpeedKmh = selectLatestNativeSpeedKmh(
    previewCoordinates,
    state,
    now,
  );
  const effectiveSpeedKmh = Math.max(averageSpeedKmh, latestNativeSpeedKmh ?? 0);

  if (
    recentDistanceMeters < RUN_LIVE_POLICY.LIVE_JITTER_DISTANCE_METERS &&
    effectiveSpeedKmh < RUN_LIVE_POLICY.STATIONARY_SPEED_THRESHOLD_KMH
  ) {
    return 'STATIONARY';
  }

  const verifiedRecentDistanceKm = selectVerifiedDistance({
    ...state,
    coordinates: recentCoordinates,
  });

  return verifiedRecentDistanceKm > 0 ? 'GOOD_GPS' : 'LIVE_ESTIMATE';
};

export const selectLiveMotionState = selectMotionState;

export const selectCurrentPace = (
  state: RunFacts,
  now = state.endTime ?? Date.now(),
): number | null => {
  if (state.status !== 'TRACKING') {
    return null;
  }

  const elapsedSeconds = selectRunDuration(state, now);
  const distanceKm = selectPreviewDistance(state);
  if (elapsedSeconds <= 0 || distanceKm <= 0) {
    return null;
  }

  return calculatePaceMinutesPerKm(distanceKm, elapsedSeconds);
};

export const selectRunElevationGain = (state: RunFacts): number => {
  const coordinates = selectTrustedMovementCoordinates(state);
  if (coordinates.length < 2) {
    return 0;
  }

  let meters = 0;
  for (let index = 1; index < coordinates.length; index += 1) {
    const previousAltitude = coordinates[index - 1].altitude;
    const nextAltitude = coordinates[index].altitude;
    if (
      isFiniteNumber(previousAltitude) &&
      isFiniteNumber(nextAltitude) &&
      nextAltitude > previousAltitude
    ) {
      meters += nextAltitude - previousAltitude;
    }
  }

  return Math.round(meters * 100) / 100;
};

export const selectVerifiedCoordinates = (state: RunFacts): RunCoordinate[] =>
  selectTrustedMovementCoordinates(state).map(toRunCoordinate);

export const selectRunCoordinates = selectVerifiedCoordinates;

export const selectPreviewCoordinates = (state: RunFacts): RunCoordinate[] =>
  selectPreviewUsableCoordinates(state).map(toRunCoordinate);

export const selectLiveCoordinates = selectPreviewCoordinates;

export const selectRunMetrics = (
  state: RunFacts,
  weightKg?: number | null,
  now = Date.now(),
): RunMetrics => {
  const elapsedSeconds = selectRunDuration(state, now);
  const distanceKm = selectRunDistance(state);
  const previewCoordinates = selectPreviewCoordinates(state);
  const previewDistanceKm = selectPreviewDistance(state);
  const motionState = selectMotionState(state, now);

  return {
    coordinates: selectRunCoordinates(state),
    previewCoordinates,
    liveCoordinates: previewCoordinates,
    elapsedSeconds,
    distanceKm,
    previewDistanceKm,
    liveDistanceKm: previewDistanceKm,
    elevationGain: selectRunElevationGain(state),
    averagePace: calculatePaceMinutesPerKm(distanceKm, elapsedSeconds),
    currentPace: selectCurrentPace(state, now),
    motionState,
    caloriesBurned: estimateCalories(distanceKm, weightKg),
    liveCaloriesBurned: estimateCalories(previewDistanceKm, weightKg),
  };
};

export const selectCanSaveRun = (state: RunFacts, now = Date.now()): boolean => {
  const trustedCoordinateCount = selectTrustedMovementCoordinates(state).length;
  const distanceKm = selectRunDistance(state);
  const durationSeconds = selectRunDuration(state, now);

  return (
    trustedCoordinateCount >= MIN_SAVE_COORDINATES &&
    distanceKm >= MIN_SAVE_DISTANCE_KM &&
    durationSeconds >= MIN_SAVE_DURATION_SECONDS
  );
};

export const selectSaveBlockReason = (
  state: RunFacts,
  now = Date.now(),
): string | null => {
  if (selectCanSaveRun(state, now)) {
    return null;
  }

  if (
    selectPreviewDistance(state) > 0 &&
    selectVerifiedDistance(state) < MIN_SAVE_DISTANCE_KM
  ) {
    return PREVIEW_SAVE_BLOCK_REASON;
  }

  return MINIMUM_SAVE_BLOCK_REASON;
};

export const selectTelemetryDiagnostics = (
  state: RunFacts,
  now = Date.now(),
): TelemetryDiagnostics => {
  const rawCoordinates = sortCoordinatesByTime(state.coordinates).filter(
    coordinate => coordinate.timestamp <= now,
  );
  const latest = rawCoordinates[rawCoordinates.length - 1] || null;
  const previous =
    rawCoordinates.length >= 2 ? rawCoordinates[rawCoordinates.length - 2] : null;
  const distanceMeters =
    previous && latest
      ? haversineMeters(toRunCoordinate(previous), toRunCoordinate(latest))
      : null;
  const latestSegmentSpeedKmh =
    previous && latest && distanceMeters !== null
      ? calculateSegmentSpeedKmh(
          toRunCoordinate(previous),
          toRunCoordinate(latest),
          distanceMeters,
        )
      : null;
  const nativeSpeedMps =
    typeof latest?.speed === 'number' && Number.isFinite(latest.speed)
      ? latest.speed
      : null;

  return {
    rawPointCount: rawCoordinates.length,
    previewPointCount: selectPreviewCoordinates(state).length,
    verifiedPointCount: selectVerifiedCoordinates(state).length,
    latestAccuracyMeters:
      typeof latest?.accuracy === 'number' && Number.isFinite(latest.accuracy)
        ? latest.accuracy
        : null,
    nativeSpeedMps,
    nativeSpeedKmh: nativeSpeedMps !== null ? nativeSpeedMps * 3.6 : null,
    latestSegmentSpeedKmh,
    confidenceState: selectMotionState(state, now),
    canSaveRun: selectCanSaveRun(state, now),
    saveEligibilityReason: selectSaveBlockReason(state, now),
  };
};

export const selectRunTiming = (
  state: RunFacts,
  now = Date.now(),
): {startedAt: string | null; finishedAt: string | null} => ({
  startedAt:
    state.startTime !== null ? new Date(state.startTime).toISOString() : null,
  finishedAt: state.startTime !== null
    ? new Date(state.endTime ?? now).toISOString()
    : null,
});

export const useRunStore = create<RunState>()(
  persist(
    devtools(
      (set, get) => ({
        ...initialRunFacts,
        startRun: seed => {
          const current = get();
          assertTransition(current.status, ['IDLE'], 'start a run');

          const coordinate = seed ? normalizeCoordinate(seed) : null;
          const startTime = coordinate?.timestamp ?? Date.now();

          set({
            ...initialRunFacts,
            status: 'TRACKING',
            clientRunId: createClientRunId(),
            startTime,
            coordinates: coordinate ? [coordinate] : [],
          });
        },
        addCoordinate: coordinate => {
          const current = get();
          assertTransition(current.status, ['TRACKING'], 'add a coordinate');

          const nextCoordinate = normalizeCoordinate(coordinate);
          if (!nextCoordinate) {
            return;
          }

          if (
            !hasUsableAccuracy(
              toRunCoordinate(nextCoordinate),
              RUN_LIVE_POLICY.LIVE_DISPLAY_MAX_ACCURACY,
            )
          ) {
            set({
              lastTelemetryIssue: {
                type: 'WEAK_GPS',
                timestamp: nextCoordinate.timestamp,
              },
            });
            return;
          }

          const previous = current.coordinates[current.coordinates.length - 1] || null;
          if (
            previous &&
            nextCoordinate.timestamp <= previous.timestamp
          ) {
            return;
          }

          if (
            previous &&
            getSegment(previous, nextCoordinate) === null
          ) {
            set({
              lastTelemetryIssue: {
                type: 'GPS_JUMPING',
                timestamp: nextCoordinate.timestamp,
              },
            });
            return;
          }

          set({
            coordinates: [...current.coordinates, nextCoordinate],
            lastTelemetryIssue: null,
          });
        },
        pauseRun: () => {
          const current = get();
          assertTransition(current.status, ['TRACKING'], 'pause a run');

          set({
            status: 'PAUSED',
            pauseIntervals: [
              ...current.pauseIntervals,
              {pausedAt: Date.now(), resumedAt: null},
            ],
          });
        },
        resumeRun: () => {
          const current = get();
          assertTransition(current.status, ['PAUSED'], 'resume a run');

          let activePauseIndex = -1;
          for (
            let index = current.pauseIntervals.length - 1;
            index >= 0;
            index -= 1
          ) {
            if (current.pauseIntervals[index].resumedAt === null) {
              activePauseIndex = index;
              break;
            }
          }
          if (activePauseIndex === -1) {
            throw new RunStateTransitionError('resume a run', current.status, [
              'PAUSED',
            ]);
          }

          const pauseIntervals = [...current.pauseIntervals];
          pauseIntervals[activePauseIndex] = {
            ...pauseIntervals[activePauseIndex],
            resumedAt: Date.now(),
          };

          set({status: 'TRACKING', pauseIntervals});
        },
        completeRun: () => {
          const current = get();
          assertTransition(current.status, ['TRACKING', 'PAUSED'], 'complete a run');

          const endTime = Date.now();
          const pauseIntervals = current.pauseIntervals.map(interval =>
            interval.resumedAt === null
              ? {...interval, resumedAt: endTime}
              : interval,
          );

          set({
            status: 'COMPLETED',
            endTime,
            pauseIntervals,
          });
        },
        resetRun: () => set(initialRunFacts),
      }),
      {name: 'milesaway-run-store'},
    ),
    {
      name: 'milesaway-active-run',
      storage: createJSONStorage(() => AsyncStorage),
      version: 2,
      migrate: persistedState => migrateRunState(persistedState),
      partialize: state => ({
        status: state.status,
        startTime: state.startTime,
        endTime: state.endTime,
        pauseIntervals: state.pauseIntervals,
        coordinates: state.coordinates,
        clientRunId: state.clientRunId,
        lastTelemetryIssue: state.lastTelemetryIssue,
      }),
    },
  ),
);
