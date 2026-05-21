require('../src/config/database');
const mongoose = require('mongoose');
const Run = require('../src/models/Run');
const User = require('../src/models/User');
const DailyAggregate = require('../src/models/DailyAggregate');
const RunService = require('../src/services/runService');

const rebuild = async () => {
  await DailyAggregate.deleteMany({});

  let rebuilt = 0;
  const cursor = Run.find().cursor();

  for await (const run of cursor) {
    const user = await User.findById(run.userId);
    if (!user || !run.location?.country) {
      continue;
    }

    await RunService.upsertDailyAggregate(user, run);
    rebuilt += 1;
  }

  console.log(`[MilesAway] Rebuilt daily aggregates for ${rebuilt} runs`);
};

rebuild()
  .catch((error) => {
    console.error('[MilesAway] Aggregate rebuild failed:', error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await mongoose.disconnect();
  });
