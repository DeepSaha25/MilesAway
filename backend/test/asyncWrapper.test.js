const test = require('node:test');
const assert = require('node:assert/strict');
const asyncWrapper = require('../src/utils/asyncWrapper');

test('asyncWrapper forwards rejected route handlers to next', async () => {
  const expectedError = new Error('route failed');
  const wrapped = asyncWrapper(async () => {
    throw expectedError;
  });

  const forwardedError = await new Promise((resolve) => {
    wrapped({}, {}, resolve);
  });

  assert.equal(forwardedError, expectedError);
});

test('asyncWrapper allows successful route handlers to complete', async () => {
  let called = false;
  const wrapped = asyncWrapper(async (req, res) => {
    called = true;
    res.statusCode = 204;
  });
  const res = {};

  wrapped({}, res, () => {
    throw new Error('next should not be called');
  });

  await new Promise((resolve) => setImmediate(resolve));

  assert.equal(called, true);
  assert.equal(res.statusCode, 204);
});
