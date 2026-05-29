const test = require('node:test');
const assert = require('node:assert/strict');
const mongoose = require('mongoose');
const RunService = require('../src/services/runService');
const Run = require('../src/models/Run');
const User = require('../src/models/User');
const LeaderboardService = require('../src/services/leaderboardService');

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
    sample(40, 22.5702, 88.3602)
  ],
  startedAt: sample(0, 22.57, 88.36).timestamp,
  finishedAt: sample(40, 22.5702, 88.3602).timestamp,
  elapsedSeconds: 40
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
    sample(90, 28.7054, 77.1038, {altitude: 18}),
    sample(180, 28.7068, 77.1052, {altitude: 22})
  ]));

  assert.equal(metrics.durationSeconds, 180);
  assert.ok(metrics.distanceKm >= 0.35);
  assert.ok(metrics.elevationGain >= 12);
});

test('rejects GPS teleport jumps', () => {
  assert.throws(
    () =>
      RunService.calculateTrustedMetrics([
        sample(0, 28.7041, 77.1025),
        sample(90, 28.9041, 77.3025)
      ].map((coordinate) => ({
        ...coordinate,
        timestamp: new Date(coordinate.timestamp)
      }))),
    /GPS jump detected/
  );
});

test('rejects duplicate GPS timestamps', () => {
  const timestamp = new Date(Date.now() - 5 * 60 * 1000).toISOString();

  assert.throws(
    () =>
      RunService.calculateTrustedMetrics([
        sample(0, 28.7041, 77.1025, {timestamp}),
        sample(90, 28.7051, 77.1035, {timestamp})
      ].map((coordinate) => ({
        ...coordinate,
        timestamp: new Date(coordinate.timestamp)
      }))),
    /Duplicate GPS timestamps/
  );
});

test('rejects low accuracy-only tracks', () => {
  assert.throws(
    () =>
      RunService.calculateTrustedMetrics([
        sample(0, 28.7041, 77.1025, {accuracy: 150}),
        sample(120, 28.7061, 77.1045, {accuracy: 150})
      ].map((coordinate) => ({
        ...coordinate,
        timestamp: new Date(coordinate.timestamp)
      }))),
    /GPS accuracy is too low/
  );
});

test('run model validation helper accepts temporary short-run threshold', () => {
  assert.deepEqual(Run.validateRunData(0.01, 30), []);
  assert.match(
    Run.validateRunData(0.009, 30).join(' '),
    /Distance must be at least 0\.01 km/
  );
  assert.match(
    Run.validateRunData(0.01, 29).join(' '),
    /Run duration must be at least 30 seconds/
  );
});

test('uses sane client elapsed time for short saved runs', () => {
  const metrics = RunService.calculateTrustedMetrics(
    RunService.normalizeCoordinates([
      sample(0, 22.57, 88.36),
      sample(20, 22.5702, 88.3602)
    ]),
    {
      startedAt: sample(0, 22.57, 88.36).timestamp,
      finishedAt: sample(37, 22.5702, 88.3602).timestamp,
      elapsedSeconds: 37
    }
  );

  assert.equal(metrics.durationSeconds, 37);
  assert.ok(metrics.distanceKm >= 0.01);
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
          assert.equal(update['location.latitude'], 22.5702);
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
