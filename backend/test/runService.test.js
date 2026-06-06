const test = require('node:test');
const assert = require('node:assert/strict');
const mongoose = require('mongoose');
const RunService = require('../src/services/runService');
const Run = require('../src/models/Run');
const User = require('../src/models/User');
const LeaderboardService = require('../src/services/leaderboardService');
const RUN_POLICY = require('../src/config/runPolicy');

const sample = (offsetSeconds, latitude, longitude, extra = {}) => ({
  latitude,
  longitude,
  accuracy: 12,
  altitude: 10,
  timestamp: new Date(Date.now() - 5 * 60 * 1000 + offsetSeconds * 1000).toISOString(),
  ...extra
});

const TEST_USER_ID = '507f1f77bcf86cd799439011';

const createSession = (events) => ({
  startTransaction: () => events.push('startTransaction'),
  commitTransaction: async () => events.push('commitTransaction'),
  abortTransaction: async () => events.push('abortTransaction'),
  endSession: async () => events.push('endSession')
});

const validRunInput = () => ({
  clientRunId: `client-${Date.now()}`,
  coordinates: [
    sample(0, 22.57, 88.36),
    sample(15, 22.5702, 88.3602),
    sample(30, 22.5704, 88.3604),
    sample(45, 22.5706, 88.3606),
    sample(60, 22.5708, 88.3608),
    sample(75, 22.571, 88.361)
  ],
  startedAt: sample(0, 22.57, 88.36).timestamp,
  finishedAt: sample(75, 22.571, 88.361).timestamp,
  elapsedSeconds: 75
});

const fetchGeocodeResponse = async () => ({
  ok: true,
  json: async () => ({
    address: {
      city: 'Kolkata',
      county: 'Kolkata',
      state: 'West Bengal',
      country: 'India'
    }
  })
});

const withPatchedStatics = async (patches, assertion) => {
  const originals = patches.map(({ target, key }) => ({
    target,
    key,
    value: target[key]
  }));

  patches.forEach(({ target, key, value }) => {
    target[key] = value;
  });

  try {
    await assertion();
  } finally {
    originals.forEach(({ target, key, value }) => {
      target[key] = value;
    });
  }
};

test('calculates trusted run metrics from GPS samples', () => {
  const metrics = RunService.calculateTrustedMetrics(RunService.normalizeCoordinates([
    sample(0, 28.7041, 77.1025),
    sample(36, 28.7045, 77.1029, {altitude: 12}),
    sample(72, 28.7049, 77.1033, {altitude: 15}),
    sample(108, 28.7053, 77.1037, {altitude: 17}),
    sample(144, 28.7057, 77.1041, {altitude: 20}),
    sample(180, 28.7061, 77.1045, {altitude: 23})
  ]));

  assert.equal(metrics.durationSeconds, 180);
  assert.ok(metrics.distanceKm >= 0.25);
  assert.ok(metrics.elevationGain >= 13);
});

test('accepts high-speed movement when production save gates pass', () => {
  const metrics = RunService.calculateTrustedMetrics([
    sample(0, 28.7041, 77.1025),
    sample(15, 28.7141, 77.1125),
    sample(30, 28.7241, 77.1225),
    sample(45, 28.7341, 77.1325),
    sample(60, 28.7441, 77.1425),
    sample(75, 28.7541, 77.1525)
  ].map((coordinate) => ({
    ...coordinate,
    timestamp: new Date(coordinate.timestamp)
  })));

  assert.equal(metrics.coordinates.length, 6);
  assert.ok(metrics.distanceKm > RUN_POLICY.MIN_SAVE_DISTANCE_KM);
  assert.equal(metrics.durationSeconds, 75);
});

test('accepts weak-but-usable GPS movement up to 100m accuracy', () => {
  const metrics = RunService.calculateTrustedMetrics([
    sample(0, 28.7041, 77.1025, {accuracy: 80}),
    sample(64, 28.7048, 77.1032, {accuracy: 80}),
    sample(128, 28.7055, 77.1039, {accuracy: 80}),
    sample(192, 28.7062, 77.1046, {accuracy: 80}),
    sample(256, 28.7069, 77.1053, {accuracy: 80}),
    sample(320, 28.7084, 77.1068, {accuracy: 80})
  ].map((coordinate) => ({
    ...coordinate,
    timestamp: new Date(coordinate.timestamp)
  })));

  assert.equal(RUN_POLICY.MAX_ACCURACY_METERS, 100);
  assert.equal(metrics.coordinates.length, 6);
  assert.ok(metrics.distanceKm > RUN_POLICY.MIN_SAVE_DISTANCE_KM);
  assert.equal(metrics.durationSeconds, 320);
});

test('still rejects accuracy above the weak GPS save ceiling', () => {
  assert.throws(
    () =>
      RunService.calculateTrustedMetrics([
        sample(0, 28.7041, 77.1025, {accuracy: 120}),
        sample(30, 28.7045, 77.1029, {accuracy: 120}),
        sample(60, 28.7049, 77.1033, {accuracy: 120}),
        sample(90, 28.7053, 77.1037, {accuracy: 120}),
        sample(120, 28.7057, 77.1041, {accuracy: 120}),
        sample(150, 28.7061, 77.1045, {accuracy: 120})
      ].map((coordinate) => ({
        ...coordinate,
        timestamp: new Date(coordinate.timestamp)
      }))),
    /GPS accuracy is too low/
  );
});

test('rejects duplicate GPS timestamps', () => {
  const timestamp = new Date(Date.now() - 5 * 60 * 1000).toISOString();

  assert.throws(
    () =>
      RunService.calculateTrustedMetrics([
        sample(0, 28.7041, 77.1025, {timestamp}),
        sample(30, 28.7043, 77.1027, {timestamp}),
        sample(60, 28.7045, 77.1029),
        sample(90, 28.7047, 77.1031),
        sample(120, 28.7049, 77.1033),
        sample(150, 28.7051, 77.1035)
      ].map((coordinate) => ({
        ...coordinate,
        timestamp: new Date(coordinate.timestamp)
      }))),
    /Duplicate GPS timestamps/
  );
});

test('rejects unusable accuracy-only tracks', () => {
  assert.throws(
    () =>
      RunService.calculateTrustedMetrics([
        sample(0, 28.7041, 77.1025, {accuracy: 150}),
        sample(30, 28.7045, 77.1029, {accuracy: 150}),
        sample(60, 28.7049, 77.1033, {accuracy: 150}),
        sample(90, 28.7053, 77.1037, {accuracy: 150}),
        sample(120, 28.7057, 77.1041, {accuracy: 150}),
        sample(150, 28.7061, 77.1045, {accuracy: 150})
      ].map((coordinate) => ({
        ...coordinate,
        timestamp: new Date(coordinate.timestamp)
      }))),
    /GPS accuracy is too low/
  );
});

test('run model validation helper enforces production save thresholds', () => {
  assert.deepEqual(
    Run.validateRunData(
      RUN_POLICY.MIN_SAVE_DISTANCE_KM,
      RUN_POLICY.MIN_SAVE_DURATION_SECONDS
    ),
    []
  );
  assert.match(
    Run.validateRunData(
      RUN_POLICY.MIN_SAVE_DISTANCE_KM - 0.001,
      RUN_POLICY.MIN_SAVE_DURATION_SECONDS
    ).join(' '),
    /Distance must be at least 0\.1 km/
  );
  assert.match(
    Run.validateRunData(
      RUN_POLICY.MIN_SAVE_DISTANCE_KM,
      RUN_POLICY.MIN_SAVE_DURATION_SECONDS - 1
    ).join(' '),
    /Run duration must be at least 60 seconds/
  );
  assert.deepEqual(
    Run.validateRunData(
      5,
      RUN_POLICY.MIN_SAVE_DURATION_SECONDS
    ),
    []
  );
});

test('uses sane client elapsed time for accepted saved runs', () => {
  const metrics = RunService.calculateTrustedMetrics(
    RunService.normalizeCoordinates([
      sample(0, 22.57, 88.36),
      sample(13, 22.5702, 88.3602),
      sample(26, 22.5704, 88.3604),
      sample(39, 22.5706, 88.3606),
      sample(52, 22.5708, 88.3608),
      sample(65, 22.571, 88.361)
    ]),
    {
      startedAt: sample(0, 22.57, 88.36).timestamp,
      finishedAt: sample(65, 22.571, 88.361).timestamp,
      elapsedSeconds: 65
    }
  );

  assert.equal(metrics.durationSeconds, 65);
  assert.ok(metrics.distanceKm >= RUN_POLICY.MIN_SAVE_DISTANCE_KM);
});

test('aggregated stats read is passive and returns empty totals', async () => {
  let rebuildCalled = false;

  await withPatchedStatics(
    [
      {
        target: Run,
        key: 'aggregate',
        value: async () => []
      },
      {
        target: RunService,
        key: 'rebuildUserDerivedStats',
        value: async () => {
          rebuildCalled = true;
          throw new Error('read path must not rebuild aggregates');
        }
      }
    ],
    async () => {
      const stats = await RunService.getUserAggregatedStats(TEST_USER_ID);

      assert.equal(rebuildCalled, false);
      assert.deepEqual(stats, RunService.emptyTotalStats());
    }
  );
});

test('weekly and daily stats reads return empty period defaults', async () => {
  let aggregateCalls = 0;
  let rebuildCalled = false;

  await withPatchedStatics(
    [
      {
        target: Run,
        key: 'aggregate',
        value: async () => {
          aggregateCalls += 1;
          return [];
        }
      },
      {
        target: RunService,
        key: 'rebuildUserDerivedStats',
        value: async () => {
          rebuildCalled = true;
          throw new Error('period reads must not rebuild aggregates');
        }
      }
    ],
    async () => {
      const weeklyStats = await RunService.getWeeklyStats(TEST_USER_ID);
      const dailyStats = await RunService.getDailyStats(TEST_USER_ID, new Date());

      assert.equal(rebuildCalled, false);
      assert.equal(aggregateCalls, 2);
      assert.deepEqual(weeklyStats, RunService.emptyPeriodStats());
      assert.deepEqual(dailyStats, RunService.emptyPeriodStats());
    }
  );
});

test('weekly and daily stats aggregation pipelines output the full period contract', async () => {
  const pipelines = [];

  await withPatchedStatics(
    [
      {
        target: Run,
        key: 'aggregate',
        value: async (pipeline) => {
          pipelines.push(pipeline);
          return [];
        }
      }
    ],
    async () => {
      await RunService.getWeeklyStats(TEST_USER_ID);
      await RunService.getDailyStats(TEST_USER_ID, new Date());

      assert.equal(pipelines.length, 2);
      pipelines.forEach((pipeline) => {
        const groupStage = pipeline.find((stage) => stage.$group);
        const projectStage = pipeline.find((stage) => stage.$project);

        assert.ok(groupStage.$group.totalDuration);
        assert.ok(groupStage.$group.caloriesBurned);
        assert.ok(groupStage.$group.elevationGain);
        assert.equal(projectStage.$project._id, 0);
        assert.equal(projectStage.$project.totalDistance, 1);
        assert.equal(projectStage.$project.totalDuration, 1);
        assert.equal(projectStage.$project.totalRuns, 1);
        assert.ok(projectStage.$project.avgSpeed);
        assert.ok(projectStage.$project.averagePace);
        assert.equal(projectStage.$project.caloriesBurned, 1);
        assert.equal(projectStage.$project.elevationGain, 1);
      });
    }
  );
});

test('duplicate run submission is idempotent without aggregate rebuild', async () => {
  const existingRun = {
    _id: 'existing-run-id',
    clientRunId: 'client-run-id'
  };
  let rebuildCalled = false;
  let sessionStarted = false;

  await withPatchedStatics(
    [
      {
        target: User,
        key: 'findById',
        value: async () => ({ _id: TEST_USER_ID })
      },
      {
        target: Run,
        key: 'findOne',
        value: async () => existingRun
      },
      {
        target: RunService,
        key: 'rebuildUserDerivedStats',
        value: async () => {
          rebuildCalled = true;
          throw new Error('duplicate submissions must not rebuild aggregates');
        }
      },
      {
        target: mongoose,
        key: 'startSession',
        value: async () => {
          sessionStarted = true;
          throw new Error('duplicate pre-check must not start a transaction');
        }
      }
    ],
    async () => {
      const result = await RunService.submitRun(TEST_USER_ID, {
        clientRunId: existingRun.clientRunId,
        coordinates: [],
        startedAt: null,
        finishedAt: null,
        elapsedSeconds: 0
      });

      assert.equal(rebuildCalled, false);
      assert.equal(sessionStarted, false);
      assert.deepEqual(result, { run: existingRun, created: false });
    }
  );
});

test('new run submission commits run and user writes in one transaction', async () => {
  const events = [];
  const session = createSession(events);
  const input = validRunInput();
  const createdRun = {
    _id: 'created-run-id',
    endTime: new Date(input.finishedAt),
    clientRunId: input.clientRunId
  };
  let runCreateOptions = null;
  let userUpdateOptions = null;

  await withPatchedStatics(
    [
      {
        target: globalThis,
        key: 'fetch',
        value: fetchGeocodeResponse
      },
      {
        target: User,
        key: 'findById',
        value: async () => ({ _id: TEST_USER_ID, weightKg: 70 })
      },
      {
        target: Run,
        key: 'findOne',
        value: async () => null
      },
      {
        target: mongoose,
        key: 'startSession',
        value: async () => {
          events.push('startSession');
          return session;
        }
      },
      {
        target: Run,
        key: 'create',
        value: async (payload, options) => {
          events.push('Run.create');
          assert.equal(Array.isArray(payload), true);
          assert.equal(payload[0].clientRunId, input.clientRunId);
          runCreateOptions = options;
          return [createdRun];
        }
      },
      {
        target: User,
        key: 'updateOne',
        value: async (query, update, options) => {
          events.push('User.updateOne');
          assert.deepEqual(query, { _id: TEST_USER_ID });
          assert.equal(update['location.latitude'], 22.571);
          userUpdateOptions = options;
          return { matchedCount: 1 };
        }
      },
      {
        target: RunService,
        key: 'rebuildUserDerivedStats',
        value: async (userId, runDate) => {
          events.push('rebuildUserDerivedStats');
          assert.equal(userId, TEST_USER_ID);
          assert.equal(runDate, createdRun.endTime);
        }
      },
      {
        target: LeaderboardService,
        key: 'clearCache',
        value: () => events.push('clearCache')
      }
    ],
    async () => {
      const result = await RunService.submitRun(TEST_USER_ID, input);

      assert.equal(runCreateOptions.session, session);
      assert.equal(userUpdateOptions.session, session);
      assert.deepEqual(result, { run: createdRun, created: true });
      assert.deepEqual(events, [
        'startSession',
        'startTransaction',
        'Run.create',
        'User.updateOne',
        'commitTransaction',
        'endSession',
        'rebuildUserDerivedStats',
        'clearCache'
      ]);
    }
  );
});

test('run submission aborts transaction when user update fails', async () => {
  const events = [];
  const session = createSession(events);
  const input = validRunInput();
  let rebuildCalled = false;
  let cacheCleared = false;

  await withPatchedStatics(
    [
      {
        target: globalThis,
        key: 'fetch',
        value: fetchGeocodeResponse
      },
      {
        target: User,
        key: 'findById',
        value: async () => ({ _id: TEST_USER_ID, weightKg: 70 })
      },
      {
        target: Run,
        key: 'findOne',
        value: async () => null
      },
      {
        target: mongoose,
        key: 'startSession',
        value: async () => {
          events.push('startSession');
          return session;
        }
      },
      {
        target: Run,
        key: 'create',
        value: async () => {
          events.push('Run.create');
          return [{ _id: 'created-run-id', endTime: new Date(input.finishedAt) }];
        }
      },
      {
        target: User,
        key: 'updateOne',
        value: async () => {
          events.push('User.updateOne');
          throw new Error('user update failed');
        }
      },
      {
        target: RunService,
        key: 'rebuildUserDerivedStats',
        value: async () => {
          rebuildCalled = true;
        }
      },
      {
        target: LeaderboardService,
        key: 'clearCache',
        value: () => {
          cacheCleared = true;
        }
      }
    ],
    async () => {
      await assert.rejects(
        () => RunService.submitRun(TEST_USER_ID, input),
        /user update failed/
      );

      assert.equal(rebuildCalled, false);
      assert.equal(cacheCleared, false);
      assert.deepEqual(events, [
        'startSession',
        'startTransaction',
        'Run.create',
        'User.updateOne',
        'abortTransaction',
        'endSession'
      ]);
    }
  );
});

test('duplicate key during run create aborts transaction and returns duplicate run', async () => {
  const events = [];
  const session = createSession(events);
  const input = validRunInput();
  const duplicateRun = {
    _id: 'duplicate-run-id',
    clientRunId: input.clientRunId
  };
  let findOneCalls = 0;
  let rebuildCalled = false;
  let userUpdateCalled = false;
  let cacheCleared = false;

  await withPatchedStatics(
    [
      {
        target: globalThis,
        key: 'fetch',
        value: fetchGeocodeResponse
      },
      {
        target: User,
        key: 'findById',
        value: async () => ({ _id: TEST_USER_ID, weightKg: 70 })
      },
      {
        target: Run,
        key: 'findOne',
        value: async () => {
          findOneCalls += 1;
          return findOneCalls === 1 ? null : duplicateRun;
        }
      },
      {
        target: mongoose,
        key: 'startSession',
        value: async () => {
          events.push('startSession');
          return session;
        }
      },
      {
        target: Run,
        key: 'create',
        value: async () => {
          events.push('Run.create');
          const error = new Error('duplicate key');
          error.code = 11000;
          throw error;
        }
      },
      {
        target: User,
        key: 'updateOne',
        value: async () => {
          userUpdateCalled = true;
        }
      },
      {
        target: RunService,
        key: 'rebuildUserDerivedStats',
        value: async () => {
          rebuildCalled = true;
        }
      },
      {
        target: LeaderboardService,
        key: 'clearCache',
        value: () => {
          cacheCleared = true;
        }
      }
    ],
    async () => {
      const result = await RunService.submitRun(TEST_USER_ID, input);

      assert.equal(findOneCalls, 2);
      assert.equal(userUpdateCalled, false);
      assert.equal(rebuildCalled, false);
      assert.equal(cacheCleared, false);
      assert.deepEqual(result, { run: duplicateRun, created: false });
      assert.deepEqual(events, [
        'startSession',
        'startTransaction',
        'Run.create',
        'abortTransaction',
        'endSession'
      ]);
    }
  );
});
