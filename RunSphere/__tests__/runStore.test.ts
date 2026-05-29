import {
  RunFacts,
  RunStateTransitionError,
  initialRunFacts,
  migrateRunState,
  selectCanSaveRun,
  selectCurrentPace,
  selectMotionState,
  selectRunDistance,
  selectRunDuration,
  selectRunMetrics,
  useRunStore,
} from '../src/store/runStore';

const makeState = (overrides: Partial<RunFacts>): RunFacts => ({
  ...initialRunFacts,
  ...overrides,
});

const productionSaveCoordinates = () => [
  {latitude: 0, longitude: 0, timestamp: 1_000, accuracy: 5},
  {latitude: 0, longitude: 0.0002, timestamp: 13_000, accuracy: 5},
  {latitude: 0, longitude: 0.0004, timestamp: 25_000, accuracy: 5},
  {latitude: 0, longitude: 0.0006, timestamp: 37_000, accuracy: 5},
  {latitude: 0, longitude: 0.0008, timestamp: 49_000, accuracy: 5},
  {latitude: 0, longitude: 0.001, timestamp: 61_000, accuracy: 5},
];

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
        {latitude: 0, longitude: 0.001, timestamp: 61_000, accuracy: 5},
      ],
    });

    expect(selectRunDistance(state)).toBeGreaterThan(0.1);
  });

  it('drops poor accuracy and stationary drift from distance accumulation', () => {
    const state = makeState({
      coordinates: [
        {latitude: 0, longitude: 0, timestamp: 1_000, accuracy: 5},
        {latitude: 0, longitude: 0.00002, timestamp: 10_000, accuracy: 5},
        {latitude: 0, longitude: 0.00004, timestamp: 20_000, accuracy: 5},
        {latitude: 0, longitude: 0.001, timestamp: 30_000, accuracy: 80},
      ],
    });

    expect(selectRunDistance(state)).toBe(0);
  });

  it('exposes acquiring, stationary, and moving motion states', () => {
    expect(
      selectMotionState(
        makeState({
          coordinates: productionSaveCoordinates().slice(0, 2),
        }),
        25_000,
      ),
    ).toBe('ACQUIRING_GPS');

    expect(
      selectMotionState(
        makeState({
          coordinates: [
            {latitude: 0, longitude: 0, timestamp: 1_000, accuracy: 5},
            {latitude: 0, longitude: 0.00001, timestamp: 8_000, accuracy: 5},
            {latitude: 0, longitude: 0.00002, timestamp: 16_000, accuracy: 5},
          ],
        }),
        16_000,
      ),
    ).toBe('STATIONARY');

    expect(
      selectMotionState(
        makeState({
          coordinates: [
            {latitude: 0, longitude: 0, timestamp: 1_000, accuracy: 5},
            {latitude: 0, longitude: 0.00014, timestamp: 8_000, accuracy: 5},
            {latitude: 0, longitude: 0.00028, timestamp: 16_000, accuracy: 5},
          ],
        }),
        16_000,
      ),
    ).toBe('MOVING');
  });

  it('returns null current pace until movement is confident', () => {
    const stationaryState = makeState({
      status: 'TRACKING',
      coordinates: [
        {latitude: 0, longitude: 0, timestamp: 1_000, accuracy: 5},
        {latitude: 0, longitude: 0.00001, timestamp: 8_000, accuracy: 5},
        {latitude: 0, longitude: 0.00002, timestamp: 16_000, accuracy: 5},
      ],
    });

    expect(selectCurrentPace(stationaryState, 16_000)).toBeNull();
    expect(selectRunMetrics(stationaryState, 70, 16_000).currentPace).toBeNull();
  });

  it('derives current pace from the trailing 45-second movement window', () => {
    const movingState = makeState({
      status: 'TRACKING',
      coordinates: [
        {latitude: 0, longitude: 0, timestamp: 0, accuracy: 5},
        {latitude: 0, longitude: 0.0003, timestamp: 15_000, accuracy: 5},
        {latitude: 0, longitude: 0.0006, timestamp: 30_000, accuracy: 5},
        {latitude: 0, longitude: 0.0009, timestamp: 45_000, accuracy: 5},
        {latitude: 0, longitude: 0.0012, timestamp: 60_000, accuracy: 5},
      ],
    });

    const currentPace = selectCurrentPace(movingState, 60_000);

    expect(currentPace).not.toBeNull();
    expect(currentPace as number).toBeGreaterThan(7);
    expect(currentPace as number).toBeLessThan(8);
  });

  it('enforces save thresholds for distance, duration, and samples', () => {
    const validState = makeState({
      status: 'COMPLETED',
      startTime: 1_000,
      endTime: 61_000,
      coordinates: productionSaveCoordinates(),
    });

    expect(selectCanSaveRun(validState)).toBe(true);
    expect(selectCanSaveRun({...validState, endTime: 60_000})).toBe(false);
    expect(
      selectCanSaveRun({
        ...validState,
        coordinates: validState.coordinates.slice(0, 5),
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
