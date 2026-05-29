import {
  RunFacts,
  RunStateTransitionError,
  initialRunFacts,
  migrateRunState,
  selectCanSaveRun,
  selectRunDistance,
  selectRunDuration,
  useRunStore,
} from '../src/store/runStore';

const makeState = (overrides: Partial<RunFacts>): RunFacts => ({
  ...initialRunFacts,
  ...overrides,
});

describe('runStore fact-only selectors', () => {
  it('excludes closed pause intervals from duration', () => {
    const state = makeState({
      status: 'COMPLETED',
      startTime: 1_000,
      endTime: 121_000,
      pauseIntervals: [{pausedAt: 31_000, resumedAt: 61_000}],
    });

    expect(selectRunDuration(state)).toBe(90);
  });

  it('excludes active pause intervals using now', () => {
    const state = makeState({
      status: 'PAUSED',
      startTime: 1_000,
      pauseIntervals: [{pausedAt: 31_000, resumedAt: null}],
    });

    expect(selectRunDuration(state, 121_000)).toBe(30);
  });

  it('derives distance from raw coordinates', () => {
    const state = makeState({
      coordinates: [
        {latitude: 0, longitude: 0, timestamp: 1_000, accuracy: 5},
        {latitude: 0, longitude: 0.001, timestamp: 2_000, accuracy: 5},
      ],
    });

    expect(selectRunDistance(state)).toBeGreaterThan(0.1);
  });

  it('enforces save thresholds for distance, duration, and samples', () => {
    const validState = makeState({
      status: 'COMPLETED',
      startTime: 1_000,
      endTime: 31_000,
      coordinates: [
        {latitude: 0, longitude: 0, timestamp: 1_000, accuracy: 5},
        {latitude: 0, longitude: 0.001, timestamp: 31_000, accuracy: 5},
      ],
    });

    expect(selectCanSaveRun(validState)).toBe(true);
    expect(selectCanSaveRun({...validState, endTime: 30_000})).toBe(false);
    expect(
      selectCanSaveRun({
        ...validState,
        coordinates: validState.coordinates.slice(0, 1),
      }),
    ).toBe(false);
  });
});

describe('runStore state machine', () => {
  beforeEach(() => {
    useRunStore.getState().resetRun();
  });

  it('throws on invalid transitions', () => {
    expect(() => useRunStore.getState().pauseRun()).toThrow(
      RunStateTransitionError,
    );
  });

  it('closes an active pause when completing from paused', () => {
    const store = useRunStore.getState();
    store.startRun({latitude: 0, longitude: 0, timestamp: 1_000, accuracy: 5});
    useRunStore.getState().pauseRun();
    useRunStore.getState().completeRun();

    const state = useRunStore.getState();
    expect(state.status).toBe('COMPLETED');
    expect(state.pauseIntervals).toHaveLength(1);
    expect(state.pauseIntervals[0].resumedAt).toEqual(state.endTime);
  });

  it('migrates old persisted state to the fact-only shape', () => {
    const migrated = migrateRunState({
      status: 'running',
      startedAt: '2026-05-28T00:00:00.000Z',
      finishedAt: null,
      elapsedSeconds: 999,
      distanceKm: 42,
      elevationGain: 300,
      clientRunId: 'legacy-run',
      coordinates: [
        {
          latitude: 1,
          longitude: 2,
          accuracy: 5,
          timestamp: '2026-05-28T00:00:01.000Z',
        },
      ],
    });

    expect(migrated.status).toBe('TRACKING');
    expect(migrated.startTime).toBe(Date.parse('2026-05-28T00:00:00.000Z'));
    expect(migrated.coordinates?.[0].timestamp).toBe(
      Date.parse('2026-05-28T00:00:01.000Z'),
    );
    expect('elapsedSeconds' in migrated).toBe(false);
    expect('distanceKm' in migrated).toBe(false);
    expect('elevationGain' in migrated).toBe(false);
  });
});
