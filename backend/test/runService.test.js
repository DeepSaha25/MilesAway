const test = require('node:test');
const assert = require('node:assert/strict');
const RunService = require('../src/services/runService');
const Run = require('../src/models/Run');

const sample = (offsetSeconds, latitude, longitude, extra = {}) => ({
  latitude,
  longitude,
  accuracy: 12,
  altitude: 10,
  timestamp: new Date(Date.now() - 5 * 60 * 1000 + offsetSeconds * 1000).toISOString(),
  ...extra
});

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
