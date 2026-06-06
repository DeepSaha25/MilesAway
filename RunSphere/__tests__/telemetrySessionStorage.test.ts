import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  discardTelemetrySession,
  persistTelemetrySession,
  recoverActiveTelemetrySession,
} from '../src/services/telemetrySessionStorage';
import {initialRunFacts, RunFacts} from '../src/store/runStore';

const makeState = (overrides: Partial<RunFacts>): RunFacts => ({
  ...initialRunFacts,
  ...overrides,
});

describe('telemetrySessionStorage', () => {
  beforeEach(async () => {
    await AsyncStorage.clear();
  });

  it('persists and recovers the active telemetry session', async () => {
    const state = makeState({
      status: 'TRACKING',
      clientRunId: 'run-journal-1',
      startTime: 1_000,
      coordinates: [
        {latitude: 0, longitude: 0, timestamp: 1_000, accuracy: 5},
        {latitude: 0, longitude: 0.001, timestamp: 2_000, accuracy: 5},
      ],
    });

    const saved = await persistTelemetrySession(state);
    const recovered = await recoverActiveTelemetrySession();

    expect(saved?.clientRunId).toBe('run-journal-1');
    expect(recovered?.clientRunId).toBe('run-journal-1');
    expect(recovered?.status).toBe('TRACKING');
    expect(recovered?.coordinates).toHaveLength(2);
    expect(recovered?.coordinates[1]).toMatchObject({
      latitude: 0,
      longitude: 0.001,
      timestamp: 2_000,
      accuracy: 5,
    });
  });

  it('normalizes recovered coordinates by sorting and removing exact duplicates', async () => {
    await persistTelemetrySession(
      makeState({
        status: 'PAUSED',
        clientRunId: 'run-journal-2',
        startTime: 1_000,
        pauseIntervals: [{pausedAt: 3_000, resumedAt: null}],
        coordinates: [
          {latitude: 0, longitude: 0.002, timestamp: 3_000, accuracy: 5},
          {latitude: 0, longitude: 0, timestamp: 1_000, accuracy: 5},
          {latitude: 0, longitude: 0.002, timestamp: 3_000, accuracy: 5},
        ],
      }),
    );

    const recovered = await recoverActiveTelemetrySession();

    expect(recovered?.status).toBe('PAUSED');
    expect(recovered?.pauseIntervals).toEqual([
      {pausedAt: 3_000, resumedAt: null},
    ]);
    expect(recovered?.coordinates.map(point => point.timestamp)).toEqual([
      1_000,
      3_000,
    ]);
  });

  it('does not persist idle runs and clears discarded sessions', async () => {
    const idleResult = await persistTelemetrySession(
      makeState({
        status: 'IDLE',
        clientRunId: null,
      }),
    );

    expect(idleResult).toBeNull();
    expect(await recoverActiveTelemetrySession()).toBeNull();

    await persistTelemetrySession(
      makeState({
        status: 'TRACKING',
        clientRunId: 'run-journal-3',
        startTime: 1_000,
        coordinates: [{latitude: 0, longitude: 0, timestamp: 1_000, accuracy: 5}],
      }),
    );

    expect(await recoverActiveTelemetrySession()).not.toBeNull();

    await discardTelemetrySession('run-journal-3');

    expect(await recoverActiveTelemetrySession()).toBeNull();
  });
});
