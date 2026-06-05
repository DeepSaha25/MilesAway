import {calculatePaceMinutesPerKm, formatPace} from '../src/utils/runMetrics';

describe('run metric formatting', () => {
  it('formats pace using min per kilometer units', () => {
    expect(formatPace(calculatePaceMinutesPerKm(1, 364))).toBe('6:04 min/km');
    expect(formatPace(12.5)).toBe('12:30 min/km');
    expect(formatPace(null)).toBe('--:-- min/km');
  });
});
