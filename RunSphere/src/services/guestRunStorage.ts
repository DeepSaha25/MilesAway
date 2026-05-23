import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  RunCoordinate,
  calculatePaceMinutesPerKm,
  estimateCalories,
} from '../utils/runMetrics';

const GUEST_RUNS_KEY = '@milesaway_guest_runs';

export interface GuestRun {
  _id: string;
  clientRunId: string;
  distance: number;
  duration: number;
  coordinates: RunCoordinate[];
  route: RunCoordinate[];
  date: string;
  startTime: string;
  endTime: string;
  avgSpeed: number;
  averagePace: number;
  caloriesBurned: number;
  elevationGain: number;
  location?: {
    latitude?: number | null;
    longitude?: number | null;
  };
  isGuestRun: true;
}

const readRuns = async (): Promise<GuestRun[]> => {
  try {
    const raw = await AsyncStorage.getItem(GUEST_RUNS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
};

const writeRuns = async (runs: GuestRun[]) => {
  await AsyncStorage.setItem(GUEST_RUNS_KEY, JSON.stringify(runs));
};

const sumRuns = (runs: GuestRun[]) => {
  const totalDistance = runs.reduce((total, run) => total + Number(run.distance || 0), 0);
  const totalDuration = runs.reduce((total, run) => total + Number(run.duration || 0), 0);
  const caloriesBurned = runs.reduce(
    (total, run) => total + Number(run.caloriesBurned || 0),
    0,
  );
  const elevationGain = runs.reduce(
    (total, run) => total + Number(run.elevationGain || 0),
    0,
  );
  const avgSpeed = totalDuration > 0 ? totalDistance / (totalDuration / 3600) : 0;

  return {
    totalDistance: Math.round(totalDistance * 100) / 100,
    totalDuration,
    totalRuns: runs.length,
    avgSpeed: Math.round(avgSpeed * 100) / 100,
    averagePace: calculatePaceMinutesPerKm(totalDistance, totalDuration),
    caloriesBurned: Math.round(caloriesBurned),
    elevationGain: Math.round(elevationGain),
  };
};

const isSameLocalDay = (dateA: Date, dateB: Date) =>
  dateA.getFullYear() === dateB.getFullYear() &&
  dateA.getMonth() === dateB.getMonth() &&
  dateA.getDate() === dateB.getDate();

const GuestRunStorage = {
  async saveRun(input: {
    clientRunId: string;
    coordinates: RunCoordinate[];
    distanceKm: number;
    elapsedSeconds: number;
    elevationGain: number;
    weightKg?: number | null;
    startedAt?: string | null;
    finishedAt?: string | null;
  }) {
    const now = new Date().toISOString();
    const firstCoordinate = input.coordinates[0];
    const lastCoordinate = input.coordinates[input.coordinates.length - 1];
    const distance = Math.round(input.distanceKm * 100) / 100;
    const duration = input.elapsedSeconds;
    const avgSpeed = duration > 0 ? distance / (duration / 3600) : 0;
    const averagePace = calculatePaceMinutesPerKm(distance, duration);

    const run: GuestRun = {
      _id: input.clientRunId,
      clientRunId: input.clientRunId,
      distance,
      duration,
      coordinates: input.coordinates,
      route: input.coordinates,
      date: input.finishedAt || now,
      startTime: input.startedAt || firstCoordinate?.timestamp || now,
      endTime: input.finishedAt || lastCoordinate?.timestamp || now,
      avgSpeed: Math.round(avgSpeed * 100) / 100,
      averagePace,
      caloriesBurned: estimateCalories(distance, input.weightKg),
      elevationGain: Math.round(input.elevationGain),
      location: firstCoordinate
        ? {
            latitude: firstCoordinate.latitude,
            longitude: firstCoordinate.longitude,
          }
        : undefined,
      isGuestRun: true,
    };

    const runs = await readRuns();
    const nextRuns = [run, ...runs.filter(item => item.clientRunId !== run.clientRunId)];
    await writeRuns(nextRuns);
    return run;
  },

  async getDashboard(historyLimit = 10) {
    const runs = await readRuns();
    const sortedRuns = runs.sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
    );
    const today = new Date();
    const weekStart = new Date();
    weekStart.setDate(today.getDate() - 6);
    weekStart.setHours(0, 0, 0, 0);

    const dailyRuns = sortedRuns.filter(run =>
      isSameLocalDay(new Date(run.date), today),
    );
    const weeklyRuns = sortedRuns.filter(run => new Date(run.date) >= weekStart);

    return {
      stats: sumRuns(sortedRuns),
      dailyStats: sumRuns(dailyRuns),
      weeklyStats: sumRuns(weeklyRuns),
      recentRuns: sortedRuns.slice(0, historyLimit),
    };
  },
};

export default GuestRunStorage;
