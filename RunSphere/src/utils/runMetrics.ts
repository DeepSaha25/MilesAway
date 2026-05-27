import {format, formatDistanceToNow} from 'date-fns';

export interface RunCoordinate {
  latitude: number;
  longitude: number;
  altitude?: number | null;
  accuracy?: number | null;
  speed?: number | null;
  heading?: number | null;
  timestamp: string;
}

const EARTH_RADIUS_METERS = 6371e3;

const toRadians = (value: number) => (value * Math.PI) / 180;

export const haversineMeters = (from: RunCoordinate, to: RunCoordinate) => {
  const phi1 = toRadians(from.latitude);
  const phi2 = toRadians(to.latitude);
  const deltaPhi = toRadians(to.latitude - from.latitude);
  const deltaLambda = toRadians(to.longitude - from.longitude);

  const a =
    Math.sin(deltaPhi / 2) * Math.sin(deltaPhi / 2) +
    Math.cos(phi1) *
      Math.cos(phi2) *
      Math.sin(deltaLambda / 2) *
      Math.sin(deltaLambda / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return EARTH_RADIUS_METERS * c;
};

export const shouldAcceptCoordinate = (
  previous: RunCoordinate | null,
  next: RunCoordinate,
  minDistanceMeters = 5,
) => {
  if (
    typeof next.accuracy === 'number' &&
    Number.isFinite(next.accuracy) &&
    next.accuracy > 80
  ) {
    return false;
  }

  if (!previous) {
    return true;
  }

  const distanceMeters = haversineMeters(previous, next);
  const elapsedSeconds =
    (new Date(next.timestamp).getTime() - new Date(previous.timestamp).getTime()) /
    1000;

  if (elapsedSeconds > 0) {
    const speedKmh = (distanceMeters / 1000) / (elapsedSeconds / 3600);
    if (speedKmh > 30) {
      return false;
    }
  }

  return distanceMeters >= minDistanceMeters;
};

export const calculateRouteDistanceKm = (coordinates: RunCoordinate[]) => {
  let totalMeters = 0;

  for (let index = 1; index < coordinates.length; index += 1) {
    totalMeters += haversineMeters(coordinates[index - 1], coordinates[index]);
  }

  return totalMeters / 1000;
};

export const calculateElevationGain = (coordinates: RunCoordinate[]) => {
  let gain = 0;

  for (let index = 1; index < coordinates.length; index += 1) {
    const previous = coordinates[index - 1].altitude;
    const current = coordinates[index].altitude;

    if (
      typeof previous === 'number' &&
      typeof current === 'number' &&
      Number.isFinite(previous) &&
      Number.isFinite(current) &&
      current > previous
    ) {
      gain += current - previous;
    }
  }

  return Math.round(gain * 100) / 100;
};

export const calculatePaceMinutesPerKm = (
  distanceKm: number,
  elapsedSeconds: number,
) => {
  if (!distanceKm || !elapsedSeconds) {
    return 0;
  }

  return elapsedSeconds / 60 / distanceKm;
};

export const estimateCalories = (distanceKm: number, weightKg?: number | null) =>
  Math.round(distanceKm * (weightKg || 70) * 1.036 * 100) / 100;

export const formatClock = (elapsedSeconds: number) => {
  const hours = Math.floor(elapsedSeconds / 3600)
    .toString()
    .padStart(2, '0');
  const minutes = Math.floor((elapsedSeconds % 3600) / 60)
    .toString()
    .padStart(2, '0');
  const seconds = Math.floor(elapsedSeconds % 60)
    .toString()
    .padStart(2, '0');

  return `${hours}:${minutes}:${seconds}`;
};

export const formatPace = (paceMinutesPerKm: number) => {
  if (!paceMinutesPerKm || !Number.isFinite(paceMinutesPerKm)) {
    return '--:-- /km';
  }

  const minutes = Math.floor(paceMinutesPerKm);
  const seconds = Math.round((paceMinutesPerKm - minutes) * 60)
    .toString()
    .padStart(2, '0');

  return `${minutes}:${seconds} /km`;
};

export const formatDistance = (distanceKm: number, compact = false) => {
  const distance = Number(distanceKm || 0);

  if (distance > 0 && distance < 1) {
    return distance.toFixed(3);
  }

  return distance.toFixed(compact ? 2 : 3);
};

export const formatRunDate = (date: string | Date) =>
  format(new Date(date), 'dd MMM yyyy, hh:mm a');

export const formatRelativeRunDate = (date: string | Date) =>
  formatDistanceToNow(new Date(date), {addSuffix: true});
