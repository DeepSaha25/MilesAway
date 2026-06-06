import {Accelerometer, Barometer, Pedometer} from 'expo-sensors';
import {
  getLatestSensorSnapshot,
  resetSensorTelemetryForTests,
  startSensorTelemetry,
  stopSensorTelemetry,
} from '../src/services/sensorTelemetry';

const sensorMocks = jest.requireMock('expo-sensors').__sensorMocks;

describe('sensorTelemetry', () => {
  let now = 1_000;
  let dateSpy: jest.SpyInstance<number, []>;

  beforeEach(() => {
    sensorMocks.reset();
    resetSensorTelemetryForTests();
    now = 1_000;
    dateSpy = jest.spyOn(Date, 'now').mockImplementation(() => now);
    jest.clearAllMocks();
  });

  afterEach(() => {
    stopSensorTelemetry();
    dateSpy.mockRestore();
  });

  it('starts available sensors and records latest sensor values', async () => {
    await startSensorTelemetry();

    expect(Accelerometer.isAvailableAsync).toHaveBeenCalled();
    expect(Accelerometer.setUpdateInterval).toHaveBeenCalledWith(500);
    expect(Pedometer.watchStepCount).toHaveBeenCalled();
    expect(Barometer.addListener).toHaveBeenCalled();

    sensorMocks.emitAccelerometer({x: 0.1, y: 0.2, z: 1, timestamp: 1});
    sensorMocks.emitBarometer({pressure: 1008, relativeAltitude: 12});
    sensorMocks.emitPedometer({steps: 0});
    now = 61_000;
    sensorMocks.emitPedometer({steps: 120});

    const snapshot = getLatestSensorSnapshot();

    expect(snapshot.active).toBe(true);
    expect(snapshot.accelerometerAvailable).toBe(true);
    expect(snapshot.pedometerAvailable).toBe(true);
    expect(snapshot.barometerAvailable).toBe(true);
    expect(snapshot.pedometerPermissionStatus).toBe('granted');
    expect(snapshot.latestAccelerationG).toEqual({x: 0.1, y: 0.2, z: 1});
    expect(snapshot.accelerationMagnitudeG).toBeGreaterThan(1);
    expect(snapshot.motionIntensityG).toBeGreaterThan(0);
    expect(snapshot.stepCount).toBe(120);
    expect(snapshot.cadenceSpm).toBe(120);
    expect(snapshot.barometricPressureHpa).toBe(1008);
    expect(snapshot.relativeAltitudeMeters).toBe(12);
  });

  it('stops subscriptions without clearing the last diagnostic sample', async () => {
    await startSensorTelemetry();
    sensorMocks.emitPedometer({steps: 10});

    stopSensorTelemetry();

    const snapshot = getLatestSensorSnapshot();

    expect(snapshot.active).toBe(false);
    expect(snapshot.stepCount).toBe(10);
  });
});
