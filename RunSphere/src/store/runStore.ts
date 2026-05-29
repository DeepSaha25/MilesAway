import AsyncStorage from '@react-native-async-storage/async-storage';
import {create} from 'zustand';
import {createJSONStorage, devtools, persist} from 'zustand/middleware';
import {
  RunCoordinate,
  calculatePaceMinutesPerKm,
  estimateCalories,
  haversineMeters,
  shouldAcceptCoordinate,
} from '../utils/runMetrics';

export type RunStatus = 'IDLE' | 'TRACKING' | 'PAUSED' | 'COMPLETED';

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
};

export type RunMetrics = {
  coordinates: RunCoordinate[];
  elapsedSeconds: number;
  distanceKm: number;
  elevationGain: number;
  averagePace: number;
  caloriesBurned: number;
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
    coordinates: Array<Partial<RunTrackPoint> & Partial<RunCoordinate>>;
  }
>;

const MIN_SAVE_DISTANCE_KM = 0.01;
const MIN_SAVE_DURATION_SECONDS = 30;
const MIN_SAVE_COORDINATES = 2;

export const initialRunFacts: RunFacts = {
  status: 'IDLE',
  startTime: null,
  endTime: null,
  pauseIntervals: [],
  coordinates: [],
  clientRunId: null,
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

  return {
    latitude,
    longitude,
    timestamp: toTimestamp(coordinate.timestamp),
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

export const selectRunDistance = (state: RunFacts): number => {
  if (state.coordinates.length < 2) {
    return 0;
  }

  let meters = 0;
  for (let index = 1; index < state.coordinates.length; index += 1) {
    meters += haversineMeters(
      toRunCoordinate(state.coordinates[index - 1]),
      toRunCoordinate(state.coordinates[index]),
    );
  }

  return Math.round((meters / 1000) * 1000) / 1000;
};

export const selectRunElevationGain = (state: RunFacts): number => {
  if (state.coordinates.length < 2) {
    return 0;
  }

  let meters = 0;
  for (let index = 1; index < state.coordinates.length; index += 1) {
    const previousAltitude = state.coordinates[index - 1].altitude;
    const nextAltitude = state.coordinates[index].altitude;
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

export const selectRunCoordinates = (state: RunFacts): RunCoordinate[] =>
  state.coordinates.map(toRunCoordinate);

export const selectRunMetrics = (
  state: RunFacts,
  weightKg?: number | null,
  now = Date.now(),
): RunMetrics => {
  const elapsedSeconds = selectRunDuration(state, now);
  const distanceKm = selectRunDistance(state);

  return {
    coordinates: selectRunCoordinates(state),
    elapsedSeconds,
    distanceKm,
    elevationGain: selectRunElevationGain(state),
    averagePace: calculatePaceMinutesPerKm(distanceKm, elapsedSeconds),
    caloriesBurned: estimateCalories(distanceKm, weightKg),
  };
};

export const selectCanSaveRun = (state: RunFacts, now = Date.now()): boolean =>
  state.coordinates.length >= MIN_SAVE_COORDINATES &&
  selectRunDistance(state) >= MIN_SAVE_DISTANCE_KM &&
  selectRunDuration(state, now) >= MIN_SAVE_DURATION_SECONDS;

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

          const previous = current.coordinates[current.coordinates.length - 1] || null;
          if (
            !shouldAcceptCoordinate(
              previous ? toRunCoordinate(previous) : null,
              toRunCoordinate(nextCoordinate),
            )
          ) {
            return;
          }

          set({coordinates: [...current.coordinates, nextCoordinate]});
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
      }),
    },
  ),
);
