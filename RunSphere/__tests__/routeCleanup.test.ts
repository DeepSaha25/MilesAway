import {
  cleanupVerifiedRoute,
  dedupeCoordinatesByTimestamp,
  simplifyRouteByDistance,
} from '../src/utils/routeCleanup';
import {calculateRouteDistanceKm, RunCoordinate} from '../src/utils/runMetrics';

const coordinate = (
  longitude: number,
  timestamp: number,
): RunCoordinate => ({
  latitude: 0,
  longitude,
  accuracy: 5,
  timestamp: new Date(timestamp).toISOString(),
});

describe('routeCleanup', () => {
  it('removes duplicate timestamps while preserving first occurrence order', () => {
    const route = [
      coordinate(0, 1_000),
      coordinate(0.001, 2_000),
      coordinate(0.002, 2_000),
      coordinate(0.003, 3_000),
    ];

    const deduped = dedupeCoordinatesByTimestamp(route);

    expect(deduped).toHaveLength(3);
    expect(deduped.map(point => point.longitude)).toEqual([0, 0.001, 0.003]);
  });

  it('simplifies dense routes while preserving first and last point', () => {
    const route = Array.from({length: 24}, (_, index) =>
      coordinate(index * 0.00005, 1_000 + index * 1_000),
    );

    const simplified = simplifyRouteByDistance(route, 20);

    expect(simplified.length).toBeLessThan(route.length);
    expect(simplified[0]).toEqual(route[0]);
    expect(simplified[simplified.length - 1]).toEqual(route[route.length - 1]);
  });

  it('falls back to deduped route when simplification would break sample gates', () => {
    const route = Array.from({length: 6}, (_, index) =>
      coordinate(index * 0.00005, 1_000 + index * 1_000),
    );

    const cleaned = cleanupVerifiedRoute(route, {
      minCoordinates: 6,
      minDistanceMeters: 20,
    });

    expect(cleaned).toHaveLength(6);
  });

  it('keeps simplified distance close enough to the verified route distance', () => {
    const route = Array.from({length: 24}, (_, index) =>
      coordinate(index * 0.00005, 1_000 + index * 1_000),
    );

    const cleaned = cleanupVerifiedRoute(route, {
      minCoordinates: 6,
      minDistanceMeters: 20,
    });
    const originalDistance = calculateRouteDistanceKm(route);
    const cleanedDistance = calculateRouteDistanceKm(cleaned);

    expect(cleaned.length).toBeLessThan(route.length);
    expect(cleanedDistance / originalDistance).toBeGreaterThanOrEqual(0.95);
  });
});
