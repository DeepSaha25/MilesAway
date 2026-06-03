import * as Location from 'expo-location';
import {startLocationWatch} from '../src/utils/location';

describe('location utility', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('starts foreground tracking with a high-density sports GPS profile', () => {
    const watch = startLocationWatch(jest.fn(), jest.fn());

    expect(Location.watchPositionAsync).toHaveBeenCalledWith(
      {
        accuracy: Location.Accuracy.BestForNavigation,
        timeInterval: 1500,
        distanceInterval: 1.5,
      },
      expect.any(Function),
    );
    expect(typeof watch.remove).toBe('function');
  });
});
