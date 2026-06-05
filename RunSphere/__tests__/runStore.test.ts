import {
  RunFacts,
  RunStateTransitionError,
  initialRunFacts,
  migrateRunState,
  selectCanSaveRun,
  selectCurrentPace,
  selectLiveCoordinates,
  selectLiveDistance,
  selectMotionState,
  selectPreviewCoordinates,
  selectPreviewDistance,
  selectRunCoordinates,
  selectRunDistance,
  selectRunDuration,
  selectRunMetrics,
  selectSaveBlockReason,
  selectTelemetryDiagnostics,
  selectVerifiedCoordinates,
  selectVerifiedDistance,
  useRunStore,
  MINIMUM_SAVE_BLOCK_REASON,
} from '../src/store/runStore';
import {RUN_LIVE_POLICY, RUN_POLICY} from '../src/config/runPolicy';

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

const highSpeedSaveCoordinates = () => [
  {latitude: 0, longitude: 0, timestamp: 1_000, accuracy: 5, speed: 12},
  {latitude: 0, longitude: 0.001, timestamp: 13_000, accuracy: 5, speed: 12},
  {latitude: 0, longitude: 0.002, timestamp: 25_000, accuracy: 5, speed: 12},
  {latitude: 0, longitude: 0.003, timestamp: 37_000, accuracy: 5, speed: 12},
  {latitude: 0, longitude: 0.004, timestamp: 49_000, accuracy: 5, speed: 12},
  {latitude: 0, longitude: 0.005, timestamp: 61_000, accuracy: 5, speed: 12},
];

describe('runStore fact-only selectors', () => {
  it('keeps compatibility policy defaults strict while exposing live preview tolerances', () => {
    expect(RUN_POLICY.MAX_ACCURACY_METERS).toBe(30);
    expect(RUN_POLICY.JITTER_DISTANCE_METERS).toBe(4);
    expect(RUN_POLICY.MAX_SEGMENT_SPEED_KMH).toBe(30);
    expect(RUN_LIVE_POLICY.LIVE_DISPLAY_MAX_ACCURACY).toBe(100);
    expect(RUN_LIVE_POLICY.LIVE_JITTER_DISTANCE_METERS).toBe(1);
    expect(RUN_LIVE_POLICY.LIVE_MAX_SEGMENT_SPEED_KMH).toBe(180);
  });

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

  it('keeps weak live-acceptable points in preview while excluding them from verified output', () => {
    const state = makeState({
      status: 'TRACKING',
      startTime: 1_000,
      coordinates: [
        {latitude: 0, longitude: 0, timestamp: 1_000, accuracy: 80},
        {latitude: 0, longitude: 0.0002, timestamp: 13_000, accuracy: 80},
        {latitude: 0, longitude: 0.0004, timestamp: 25_000, accuracy: 80},
      ],
    });

    expect(selectPreviewCoordinates(state)).toHaveLength(3);
    expect(selectPreviewDistance(state)).toBeGreaterThan(0.04);
    expect(selectVerifiedCoordinates(state)).toHaveLength(0);
    expect(selectVerifiedDistance(state)).toBe(0);
    expect(selectLiveCoordinates(state)).toEqual(selectPreviewCoordinates(state));
    expect(selectLiveDistance(state)).toBe(selectPreviewDistance(state));
    expect(selectRunCoordinates(state)).toEqual(selectVerifiedCoordinates(state));
    expect(selectRunDistance(state)).toBe(selectVerifiedDistance(state));
    expect(selectCanSaveRun(state, 61_000)).toBe(false);
  });

  it('reports telemetry diagnostics across raw, preview, verified, speed, confidence, and save state', () => {
    const state = makeState({
      status: 'TRACKING',
      startTime: 1_000,
      coordinates: [
        {latitude: 0, longitude: 0, timestamp: 1_000, accuracy: 5, speed: 2.5},
        {latitude: 0, longitude: 0.0002, timestamp: 13_000, accuracy: 5, speed: 2.5},
        {latitude: 0, longitude: 0.0004, timestamp: 25_000, accuracy: 5, speed: 2.5},
        {latitude: 0, longitude: 0.0006, timestamp: 37_000, accuracy: 5, speed: 2.5},
        {latitude: 0, longitude: 0.0008, timestamp: 49_000, accuracy: 5, speed: 2.5},
        {latitude: 0, longitude: 0.001, timestamp: 61_000, accuracy: 5, speed: 2.5},
      ],
    });

    const diagnostics = selectTelemetryDiagnostics(state, 61_000);

    expect(diagnostics.rawPointCount).toBe(6);
    expect(diagnostics.previewPointCount).toBe(6);
    expect(diagnostics.verifiedPointCount).toBe(6);
    expect(diagnostics.latestAccuracyMeters).toBe(5);
    expect(diagnostics.nativeSpeedMps).toBe(2.5);
    expect(diagnostics.nativeSpeedKmh).toBe(9);
    expect(diagnostics.latestSegmentSpeedKmh).toBeGreaterThan(6);
    expect(diagnostics.confidenceState).toBe('GOOD_GPS');
    expect(diagnostics.canSaveRun).toBe(true);
    expect(diagnostics.saveEligibilityReason).toBeNull();
  });

  it('stores sub-jitter live packets without inflating preview or verified distance', () => {
    const state = makeState({
      status: 'TRACKING',
      startTime: 1_000,
      coordinates: [
        {latitude: 0, longitude: 0, timestamp: 1_000, accuracy: 5},
        {latitude: 0, longitude: 0.000002, timestamp: 3_000, accuracy: 5},
        {latitude: 0, longitude: 0.000004, timestamp: 5_000, accuracy: 5},
      ],
    });

    expect(selectPreviewCoordinates(state)).toHaveLength(3);
    expect(selectPreviewDistance(state)).toBe(0);
    expect(selectVerifiedDistance(state)).toBe(0);
  });

  it('exposes acquiring, stationary, and good GPS confidence states', () => {
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
            {latitude: 0, longitude: 0, timestamp: 1_000, accuracy: 5, speed: 0.2},
            {latitude: 0, longitude: 0.000001, timestamp: 8_000, accuracy: 5, speed: 0.2},
            {latitude: 0, longitude: 0.000002, timestamp: 16_000, accuracy: 5, speed: 0.2},
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
    ).toBe('GOOD_GPS');
  });

  it('reports live estimate when preview movement is not strict-ledger compatible yet', () => {
    const liveEstimateState = makeState({
      coordinates: [
        {latitude: 0, longitude: 0, timestamp: 1_000, accuracy: 5},
        {latitude: 0, longitude: 0.00002, timestamp: 3_000, accuracy: 5},
        {latitude: 0, longitude: 0.00004, timestamp: 5_000, accuracy: 5},
      ],
    });

    expect(selectPreviewDistance(liveEstimateState)).toBeGreaterThan(0);
    expect(selectVerifiedDistance(liveEstimateState)).toBe(0);
    expect(selectMotionState(liveEstimateState, 5_000)).toBe('LIVE_ESTIMATE');
  });

  it('reports weak GPS and GPS jumping from recent telemetry quality issues', () => {
    expect(
      selectMotionState(
        makeState({
          coordinates: [
            {latitude: 0, longitude: 0, timestamp: 1_000, accuracy: 80},
            {latitude: 0, longitude: 0.0002, timestamp: 8_000, accuracy: 80},
          ],
        }),
        8_000,
      ),
    ).toBe('WEAK_GPS');

    expect(
      selectMotionState(
        makeState({
          lastTelemetryIssue: {type: 'WEAK_GPS', timestamp: 8_000},
          coordinates: [],
        }),
        10_000,
      ),
    ).toBe('WEAK_GPS');

    expect(
      selectMotionState(
        makeState({
          lastTelemetryIssue: {type: 'GPS_JUMPING', timestamp: 8_000},
          coordinates: productionSaveCoordinates(),
        }),
        10_000,
      ),
    ).toBe('GPS_JUMPING');
  });

  it('allows high-speed valid movement to become verified and saveable', () => {
    const transportState = makeState({
      status: 'TRACKING',
      startTime: 1_000,
      coordinates: highSpeedSaveCoordinates(),
    });

    expect(selectMotionState(transportState, 61_000)).toBe('GOOD_GPS');
    expect(selectLiveDistance(transportState)).toBeGreaterThan(0.5);
    expect(selectRunDistance(transportState)).toBeGreaterThan(0.5);
    expect(selectCanSaveRun(transportState, 61_000)).toBe(true);
    expect(selectSaveBlockReason(transportState, 61_000)).toBeNull();
    expect(selectTelemetryDiagnostics(transportState, 61_000)).toMatchObject({
      rawPointCount: 6,
      previewPointCount: 6,
      verifiedPointCount: 6,
      confidenceState: 'GOOD_GPS',
      canSaveRun: true,
      saveEligibilityReason: null,
    });
  });

  it('returns null current pace until preview distance is available', () => {
    const stationaryState = makeState({
      status: 'TRACKING',
      coordinates: [
        {latitude: 0, longitude: 0, timestamp: 1_000, accuracy: 5, speed: 0.2},
        {latitude: 0, longitude: 0.000001, timestamp: 8_000, accuracy: 5, speed: 0.2},
        {latitude: 0, longitude: 0.000002, timestamp: 16_000, accuracy: 5, speed: 0.2},
      ],
    });

    expect(selectCurrentPace(stationaryState, 16_000)).toBeNull();
    expect(selectRunMetrics(stationaryState, 70, 16_000).currentPace).toBeNull();
  });

  it('derives current pace from total elapsed tracking time divided by preview distance', () => {
    const movingState = makeState({
      status: 'TRACKING',
      startTime: 0,
      coordinates: [
        {latitude: 0, longitude: 0, timestamp: 0, accuracy: 5, speed: null},
        {latitude: 0, longitude: 0.003, timestamp: 182_000, accuracy: 5, speed: null},
        {latitude: 0, longitude: 0.006, timestamp: 364_000, accuracy: 5, speed: null},
      ],
    });

    const currentPace = selectCurrentPace(movingState, 364_000);

    expect(currentPace).not.toBeNull();
    expect(currentPace as number).toBeGreaterThan(9);
    expect(currentPace as number).toBeLessThan(9.2);
  });

  it('does not depend on native speed samples for current pace', () => {
    const movingState = makeState({
      status: 'TRACKING',
      startTime: 0,
      coordinates: [
        {latitude: 0, longitude: 0, timestamp: 0, accuracy: 5, speed: null},
        {latitude: 0, longitude: 0.003, timestamp: 182_000, accuracy: 5, speed: 0},
        {latitude: 0, longitude: 0.006, timestamp: 364_000, accuracy: 5, speed: Number.NaN},
      ],
    });

    const currentPace = selectCurrentPace(movingState, 364_000);

    expect(currentPace).not.toBeNull();
    expect(currentPace as number).toBeGreaterThan(9);
    expect(currentPace as number).toBeLessThan(9.2);
  });

  it('allows relaxed accuracy points to contribute to preview pace', () => {
    const movingState = makeState({
      status: 'TRACKING',
      startTime: 48_000,
      coordinates: [
        {latitude: 0, longitude: 0, timestamp: 48_000, accuracy: 45},
        {latitude: 0, longitude: 0.00008, timestamp: 52_000, accuracy: 45},
        {latitude: 0, longitude: 0.00016, timestamp: 56_000, accuracy: 45},
        {latitude: 0, longitude: 0.00024, timestamp: 60_000, accuracy: 45},
      ],
    });

    const currentPace = selectCurrentPace(movingState, 60_000);

    expect(selectMotionState(movingState, 60_000)).toBe('WEAK_GPS');
    expect(selectPreviewDistance(movingState)).toBeGreaterThan(0);
    expect(currentPace).not.toBeNull();
  });

  it('uses full elapsed time rather than a rolling current pace window', () => {
    const movingState = makeState({
      status: 'TRACKING',
      startTime: 0,
      coordinates: [
        {latitude: 0, longitude: 0, timestamp: 0, accuracy: 5},
        {latitude: 0, longitude: 0.003, timestamp: 182_000, accuracy: 5},
        {latitude: 0, longitude: 0.006, timestamp: 364_000, accuracy: 5},
      ],
    });

    const currentPace = selectCurrentPace(movingState, 364_000);

    expect(currentPace).not.toBeNull();
    expect(currentPace as number).toBeGreaterThan(9);
    expect(currentPace as number).toBeLessThan(9.2);
  });

  it('counts high-speed valid movement for live display and verified summary', () => {
    const transportState = makeState({
      status: 'TRACKING',
      startTime: 1_000,
      coordinates: highSpeedSaveCoordinates(),
    });

    const metrics = selectRunMetrics(transportState, 70, 61_000);

    expect(selectMotionState(transportState, 61_000)).toBe('GOOD_GPS');
    expect(selectLiveDistance(transportState)).toBeGreaterThan(0.5);
    expect(selectRunDistance(transportState)).toBeGreaterThan(0.5);
    expect(selectLiveCoordinates(transportState)).toHaveLength(6);
    expect(selectRunCoordinates(transportState)).toHaveLength(6);
    expect(metrics.previewCoordinates).toHaveLength(6);
    expect(metrics.previewDistanceKm).toBeGreaterThan(0.5);
    expect(metrics.liveDistanceKm).toBeGreaterThan(0.5);
    expect(metrics.distanceKm).toBeGreaterThan(0.5);
    expect(metrics.currentPace).not.toBeNull();
  });

  it('stores high-speed packets because speed is no longer a save barrier', () => {
    useRunStore.getState().resetRun();
    useRunStore.getState().startRun({
      latitude: 0,
      longitude: 0,
      timestamp: 1_000,
      accuracy: 5,
    });
    useRunStore.getState().addCoordinate({
      latitude: 0,
      longitude: 0.1,
      timestamp: 4_000,
      accuracy: 5,
    });

    expect(useRunStore.getState().coordinates).toHaveLength(2);
  });

  it('does not reject high-speed GPS transitions from live or strict distance', () => {
    const jumpState = makeState({
      status: 'TRACKING',
      coordinates: [
        {latitude: 0, longitude: 0, timestamp: 1_000, accuracy: 5},
        {latitude: 0, longitude: 0.1, timestamp: 4_000, accuracy: 5},
        {latitude: 0, longitude: 0.2, timestamp: 7_000, accuracy: 5},
      ],
    });

    expect(selectLiveDistance(jumpState)).toBeGreaterThan(20);
    expect(selectRunDistance(jumpState)).toBeGreaterThan(20);
    expect(selectMotionState(jumpState, 7_000)).toBe('GOOD_GPS');
  });

  it('enforces save thresholds for distance, duration, and samples', () => {
    const validState = makeState({
      status: 'COMPLETED',
      startTime: 1_000,
      endTime: 61_000,
      coordinates: productionSaveCoordinates(),
    });

    expect(selectCanSaveRun(validState)).toBe(true);
    expect(selectSaveBlockReason(validState)).toBeNull();
    expect(selectCanSaveRun({...validState, endTime: 60_000})).toBe(false);
    expect(
      selectCanSaveRun({
        ...validState,
        coordinates: validState.coordinates.slice(0, 5),
      }),
    ).toBe(false);
    expect(
      selectCanSaveRun({
        ...validState,
        coordinates: productionSaveCoordinates().map(coordinate => ({
          ...coordinate,
          accuracy: 45,
        })),
      }),
    ).toBe(false);
    expect(
      selectSaveBlockReason(makeState({coordinates: []}), 61_000),
    ).toBe(MINIMUM_SAVE_BLOCK_REASON);
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
