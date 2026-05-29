import {buildQuery} from '../src/utils/url';

describe('buildQuery', () => {
  it('filters nullish values and URL-encodes keys and values', () => {
    expect(
      buildQuery({
        keyword: ' running events ',
        countryCode: 'IN',
        empty: null,
        missing: undefined,
        limit: 10,
      }),
    ).toBe('?keyword=running+events&countryCode=IN&limit=10');
  });

  it('returns an empty string when no params survive filtering', () => {
    expect(buildQuery({date: undefined, startDate: null})).toBe('');
  });
});
