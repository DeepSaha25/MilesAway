import AsyncStorage from '@react-native-async-storage/async-storage';
import type {
  PauseInterval,
  RunFacts,
  RunStatus,
  RunTrackPoint,
  TelemetryIssue,
} from '../store/runStore';

const ACTIVE_TELEMETRY_SESSION_KEY = 'milesaway:telemetry-session:active';
const TELEMETRY_SESSION_PREFIX = 'milesaway:telemetry-session:';
const TELEMETRY_SESSION_VERSION = 1;

type JournalRunStatus = Exclude<RunStatus, 'IDLE'>;

export type TelemetryJournalSession = {
  version: typeof TELEMETRY_SESSION_VERSION;
  clientRunId: string;
  status: JournalRunStatus;
  startTime: number;
  endTime: number | null;
  pauseIntervals: PauseInterval[];
  coordinates: RunTrackPoint[];
  lastTelemetryIssue: TelemetryIssue | null;
  createdAt: number;
  updatedAt: number;
};

const getSessionKey = (clientRunId: string) =>
  `${TELEMETRY_SESSION_PREFIX}${clientRunId}`;

const isJournalRunStatus = (status: RunStatus): status is JournalRunStatus =>
  status === 'TRACKING' || status === 'PAUSED' || status === 'COMPLETED';

const isFiniteNumber = (value: unknown): value is number =>
  typeof value === 'number' && Number.isFinite(value);

const isRunTrackPoint = (value: unknown): value is RunTrackPoint => {
  const point = value as Partial<RunTrackPoint>;
  return (
    isFiniteNumber(point?.latitude) &&
    isFiniteNumber(point?.longitude) &&
    Math.abs(point.latitude) <= 90 &&
    Math.abs(point.longitude) <= 180 &&
    isFiniteNumber(point.timestamp)
  );
};

const normalizeCoordinates = (coordinates: unknown): RunTrackPoint[] => {
  if (!Array.isArray(coordinates)) {
    return [];
  }

  const seen = new Set<string>();
  return coordinates
    .filter(isRunTrackPoint)
    .sort((a, b) => a.timestamp - b.timestamp)
    .filter(point => {
      const key = `${point.timestamp}:${point.latitude}:${point.longitude}`;
      if (seen.has(key)) {
        return false;
      }
      seen.add(key);
      return true;
    })
    .map(point => ({
      latitude: point.latitude,
      longitude: point.longitude,
      timestamp: point.timestamp,
      accuracy: isFiniteNumber(point.accuracy) ? point.accuracy : null,
      altitude: isFiniteNumber(point.altitude) ? point.altitude : null,
      speed: isFiniteNumber(point.speed) ? point.speed : null,
      heading: isFiniteNumber(point.heading) ? point.heading : null,
    }));
};

const parseSession = (raw: string | null): TelemetryJournalSession | null => {
  if (!raw) {
    return null;
  }

  try {
    const parsed = JSON.parse(raw) as Partial<TelemetryJournalSession>;
    const coordinates = normalizeCoordinates(parsed.coordinates);

    if (
      parsed.version !== TELEMETRY_SESSION_VERSION ||
      typeof parsed.clientRunId !== 'string' ||
      parsed.clientRunId.length === 0 ||
      !isJournalRunStatus(parsed.status as RunStatus) ||
      !isFiniteNumber(parsed.startTime)
    ) {
      return null;
    }

    return {
      version: TELEMETRY_SESSION_VERSION,
      clientRunId: parsed.clientRunId,
      status: parsed.status as JournalRunStatus,
      startTime: parsed.startTime,
      endTime: isFiniteNumber(parsed.endTime) ? parsed.endTime : null,
      pauseIntervals: Array.isArray(parsed.pauseIntervals)
        ? parsed.pauseIntervals
            .filter(
              interval =>
                isFiniteNumber(interval?.pausedAt) &&
                (interval.resumedAt === null ||
                  interval.resumedAt === undefined ||
                  isFiniteNumber(interval.resumedAt)),
            )
            .map(interval => ({
              pausedAt: interval.pausedAt,
              resumedAt: isFiniteNumber(interval.resumedAt)
                ? interval.resumedAt
                : null,
            }))
        : [],
      coordinates,
      lastTelemetryIssue: parsed.lastTelemetryIssue ?? null,
      createdAt: isFiniteNumber(parsed.createdAt)
        ? parsed.createdAt
        : parsed.startTime,
      updatedAt: isFiniteNumber(parsed.updatedAt)
        ? parsed.updatedAt
        : Date.now(),
    };
  } catch {
    return null;
  }
};

export const persistTelemetrySession = async (
  state: RunFacts,
): Promise<TelemetryJournalSession | null> => {
  if (!state.clientRunId || !isJournalRunStatus(state.status)) {
    return null;
  }

  const now = Date.now();
  const existing = parseSession(
    await AsyncStorage.getItem(getSessionKey(state.clientRunId)),
  );
  const session: TelemetryJournalSession = {
    version: TELEMETRY_SESSION_VERSION,
    clientRunId: state.clientRunId,
    status: state.status,
    startTime: state.startTime ?? now,
    endTime: state.endTime,
    pauseIntervals: state.pauseIntervals,
    coordinates: normalizeCoordinates(state.coordinates),
    lastTelemetryIssue: state.lastTelemetryIssue,
    createdAt: existing?.createdAt ?? now,
    updatedAt: now,
  };

  await AsyncStorage.multiSet?.([
    [ACTIVE_TELEMETRY_SESSION_KEY, state.clientRunId],
    [getSessionKey(state.clientRunId), JSON.stringify(session)],
  ]);

  if (!AsyncStorage.multiSet) {
    await AsyncStorage.setItem(ACTIVE_TELEMETRY_SESSION_KEY, state.clientRunId);
    await AsyncStorage.setItem(
      getSessionKey(state.clientRunId),
      JSON.stringify(session),
    );
  }

  return session;
};

export const recoverActiveTelemetrySession =
  async (): Promise<TelemetryJournalSession | null> => {
    const clientRunId = await AsyncStorage.getItem(ACTIVE_TELEMETRY_SESSION_KEY);
    if (!clientRunId) {
      return null;
    }

    return parseSession(await AsyncStorage.getItem(getSessionKey(clientRunId)));
  };

export const discardTelemetrySession = async (clientRunId?: string | null) => {
  const activeClientRunId =
    clientRunId ?? (await AsyncStorage.getItem(ACTIVE_TELEMETRY_SESSION_KEY));

  if (!activeClientRunId) {
    await AsyncStorage.removeItem(ACTIVE_TELEMETRY_SESSION_KEY);
    return;
  }

  await AsyncStorage.removeItem(getSessionKey(activeClientRunId));

  const active = await AsyncStorage.getItem(ACTIVE_TELEMETRY_SESSION_KEY);
  if (active === activeClientRunId || clientRunId === undefined) {
    await AsyncStorage.removeItem(ACTIVE_TELEMETRY_SESSION_KEY);
  }
};

export const markTelemetrySessionSaved = discardTelemetrySession;
