import {
  Accelerometer,
  Barometer,
  Pedometer,
  type AccelerometerMeasurement,
  type BarometerMeasurement,
} from 'expo-sensors';

type SensorSubscription = {
  remove: () => void;
};

export type SensorVector = {
  x: number;
  y: number;
  z: number;
};

export type SensorTelemetrySnapshot = {
  active: boolean;
  startedAt: number | null;
  updatedAt: number | null;
  accelerometerAvailable: boolean | null;
  pedometerAvailable: boolean | null;
  barometerAvailable: boolean | null;
  pedometerPermissionStatus: string | null;
  latestAccelerationG: SensorVector | null;
  accelerationMagnitudeG: number | null;
  motionIntensityG: number | null;
  stepCount: number | null;
  cadenceSpm: number | null;
  barometricPressureHpa: number | null;
  relativeAltitudeMeters: number | null;
};

const SENSOR_UPDATE_INTERVAL_MS = 500;

const initialSnapshot: SensorTelemetrySnapshot = {
  active: false,
  startedAt: null,
  updatedAt: null,
  accelerometerAvailable: null,
  pedometerAvailable: null,
  barometerAvailable: null,
  pedometerPermissionStatus: null,
  latestAccelerationG: null,
  accelerationMagnitudeG: null,
  motionIntensityG: null,
  stepCount: null,
  cadenceSpm: null,
  barometricPressureHpa: null,
  relativeAltitudeMeters: null,
};

let snapshot: SensorTelemetrySnapshot = initialSnapshot;
let subscriptions: SensorSubscription[] = [];
let lastStepSample: {steps: number; timestamp: number} | null = null;

const updateSnapshot = (patch: Partial<SensorTelemetrySnapshot>) => {
  snapshot = {
    ...snapshot,
    ...patch,
    updatedAt: Date.now(),
  };
};

const safeBoolean = async (read: () => Promise<boolean>): Promise<boolean> => {
  try {
    return await read();
  } catch {
    return false;
  }
};

const addSubscription = (subscription: SensorSubscription | null | undefined) => {
  if (subscription) {
    subscriptions.push(subscription);
  }
};

const handleAccelerometerUpdate = (measurement: AccelerometerMeasurement) => {
  const vector = {
    x: measurement.x,
    y: measurement.y,
    z: measurement.z,
  };
  const magnitude = Math.sqrt(
    vector.x * vector.x + vector.y * vector.y + vector.z * vector.z,
  );

  updateSnapshot({
    latestAccelerationG: vector,
    accelerationMagnitudeG: magnitude,
    motionIntensityG: Math.abs(magnitude - 1),
  });
};

const handleStepUpdate = ({steps}: {steps: number}) => {
  const timestamp = Date.now();
  let cadenceSpm = snapshot.cadenceSpm;

  if (lastStepSample && timestamp > lastStepSample.timestamp) {
    const deltaSteps = Math.max(0, steps - lastStepSample.steps);
    const deltaMinutes = (timestamp - lastStepSample.timestamp) / 60000;
    if (deltaSteps > 0 && deltaMinutes > 0) {
      cadenceSpm = deltaSteps / deltaMinutes;
    }
  }

  lastStepSample = {steps, timestamp};
  updateSnapshot({
    stepCount: steps,
    cadenceSpm,
  });
};

const handleBarometerUpdate = (measurement: BarometerMeasurement) => {
  updateSnapshot({
    barometricPressureHpa: measurement.pressure,
    relativeAltitudeMeters:
      typeof measurement.relativeAltitude === 'number'
        ? measurement.relativeAltitude
        : null,
  });
};

const startAccelerometer = async () => {
  const available = await safeBoolean(() => Accelerometer.isAvailableAsync());
  updateSnapshot({accelerometerAvailable: available});

  if (!available) {
    return;
  }

  Accelerometer.setUpdateInterval(SENSOR_UPDATE_INTERVAL_MS);
  addSubscription(Accelerometer.addListener(handleAccelerometerUpdate));
};

const startPedometer = async () => {
  const available = await safeBoolean(() => Pedometer.isAvailableAsync());
  updateSnapshot({pedometerAvailable: available});

  if (!available) {
    return;
  }

  const permission = await Pedometer.getPermissionsAsync().catch(() => null);
  const finalPermission =
    permission?.status === 'granted'
      ? permission
      : await Pedometer.requestPermissionsAsync().catch(() => permission);

  updateSnapshot({
    pedometerPermissionStatus: finalPermission?.status ?? null,
  });

  if (finalPermission?.status !== 'granted') {
    return;
  }

  addSubscription(Pedometer.watchStepCount(handleStepUpdate));
};

const startBarometer = async () => {
  const available = await safeBoolean(() => Barometer.isAvailableAsync());
  updateSnapshot({barometerAvailable: available});

  if (!available) {
    return;
  }

  Barometer.setUpdateInterval(SENSOR_UPDATE_INTERVAL_MS);
  addSubscription(Barometer.addListener(handleBarometerUpdate));
};

export const startSensorTelemetry = async () => {
  if (snapshot.active) {
    return snapshot;
  }

  snapshot = {
    ...initialSnapshot,
    active: true,
    startedAt: Date.now(),
    updatedAt: Date.now(),
  };
  lastStepSample = null;

  await Promise.all([startAccelerometer(), startPedometer(), startBarometer()]);
  return snapshot;
};

export const stopSensorTelemetry = () => {
  subscriptions.forEach(subscription => subscription.remove());
  subscriptions = [];
  lastStepSample = null;
  snapshot = {
    ...snapshot,
    active: false,
    updatedAt: Date.now(),
  };
};

export const getLatestSensorSnapshot = (): SensorTelemetrySnapshot => snapshot;

export const resetSensorTelemetryForTests = () => {
  subscriptions = [];
  lastStepSample = null;
  snapshot = initialSnapshot;
};
