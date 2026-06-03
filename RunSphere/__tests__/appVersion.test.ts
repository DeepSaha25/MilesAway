import {
  APP_CHANGELOG_DATE,
  APP_CHANGELOG_LABEL,
  APP_CHANGELOG_VERSION,
} from '../src/config/appVersion';

declare const process: {cwd: () => string};
declare const require: (name: string) => any;

const fs = require('fs');
const path = require('path');

describe('app changelog version', () => {
  it('matches the latest changelog entry shown in the Home footer', () => {
    const changelogPath = path.join(process.cwd(), '..', 'CHANGELOG.md');
    const changelog = fs.readFileSync(changelogPath, 'utf8');
    const latestEntry = changelog.match(/^## (v\d+\.\d+\.\d+) - (\d{4}-\d{2}-\d{2})/m);

    expect(latestEntry).not.toBeNull();
    expect(APP_CHANGELOG_VERSION).toBe(latestEntry?.[1]);
    expect(APP_CHANGELOG_DATE).toBe(latestEntry?.[2]);
    expect(APP_CHANGELOG_LABEL).toBe(`${latestEntry?.[1]} · ${latestEntry?.[2]}`);
  });
});
