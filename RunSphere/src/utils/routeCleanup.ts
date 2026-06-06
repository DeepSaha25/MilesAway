import {
  MIN_SAVE_COORDINATES,
  POST_RUN_ROUTE_SIMPLIFY_DISTANCE_METERS,
} from '../config/runPolicy';
import {
  RunCoordinate,
  calculateRouteDistanceKm,
  getCoordinateTimestampMs,
  haversineMeters,
} from './runMetrics';

const MIN_SIMPLIFIED_DISTANCE_RATIO = 0.95;

export const dedupeCoordinatesByTimestamp = (
  coordinates: RunCoordinate[],
): RunCoordinate[] => {
  const seen = new Set<number>();

  return coordinates.filter(coordinate => {
    const timestamp = getCoordinateTimestampMs(coordinate);
    if (timestamp === null) {
      return false;
    }

    if (seen.has(timestamp)) {
      return false;
    }

    seen.add(timestamp);
    return true;
  });
};

export const simplifyRouteByDistance = (
  coordinates: RunCoordinate[],
  minDistanceMeters: number = POST_RUN_ROUTE_SIMPLIFY_DISTANCE_METERS,
): RunCoordinate[] => {
  if (coordinates.length <= 2) {
    return coordinates;
  }

  const simplified = [coordinates[0]];
  let lastAccepted = coordinates[0];

  for (let index = 1; index < coordinates.length - 1; index += 1) {
    if (haversineMeters(lastAccepted, coordinates[index]) >= minDistanceMeters) {
      simplified.push(coordinates[index]);
      lastAccepted = coordinates[index];
    }
  }

  simplified.push(coordinates[coordinates.length - 1]);
  return simplified;
};

export const cleanupVerifiedRoute = (
  coordinates: RunCoordinate[],
  {
    minCoordinates = MIN_SAVE_COORDINATES,
    minDistanceMeters = POST_RUN_ROUTE_SIMPLIFY_DISTANCE_METERS,
  }: {
    minCoordinates?: number;
    minDistanceMeters?: number;
  } = {},
): RunCoordinate[] => {
  const deduped = dedupeCoordinatesByTimestamp(coordinates);

  if (deduped.length < minCoordinates) {
    return deduped;
  }

  const simplified = simplifyRouteByDistance(deduped, minDistanceMeters);
  if (simplified.length < minCoordinates) {
    return deduped;
  }

  const dedupedDistance = calculateRouteDistanceKm(deduped);
  const simplifiedDistance = calculateRouteDistanceKm(simplified);
  if (
    dedupedDistance > 0 &&
    simplifiedDistance / dedupedDistance < MIN_SIMPLIFIED_DISTANCE_RATIO
  ) {
    return deduped;
  }

  return simplified;
};
