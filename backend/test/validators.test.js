const test = require('node:test');
const assert = require('node:assert/strict');
const {
  validateObjectIdParams,
  validatePagination,
  validateCommunityPost,
  validateCommunityComment,
  validateForgotPassword,
  validateResetPassword
} = require('../src/middlewares/validators');

const runMiddleware = (middleware, req) =>
  new Promise((resolve) => {
    middleware(req, {}, (error) => resolve(error || null));
  });

test('object id validator rejects malformed route params before queries', async () => {
  const error = await runMiddleware(validateObjectIdParams('postId'), {
    params: { postId: { $ne: null } }
  });

  assert.equal(error.statusCode, 400);
  assert.match(error.details.join(' '), /postId must be a valid MongoDB ObjectId/);
});

test('pagination validator normalizes and clamps page and limit', async () => {
  const req = {
    query: {
      page: '-4',
      limit: '500'
    }
  };

  const error = await runMiddleware(validatePagination, req);

  assert.equal(error, null);
  assert.equal(req.query.page, 1);
  assert.equal(req.query.limit, 50);
});

test('community post validator trims text and rejects invalid runId', async () => {
  const req = {
    body: {
      text: '  hello    runners  ',
      runId: 'not-a-valid-object-id'
    }
  };

  const error = await runMiddleware(validateCommunityPost, req);

  assert.equal(error.statusCode, 400);
  assert.equal(req.body.text, 'hello runners');
  assert.match(error.details.join(' '), /runId must be a valid MongoDB ObjectId/);
});

test('community comment validator rejects oversized comments', async () => {
  const error = await runMiddleware(validateCommunityComment, {
    body: { text: 'a'.repeat(281) }
  });

  assert.equal(error.statusCode, 400);
  assert.match(error.details.join(' '), /Comment text cannot exceed 280 characters/);
});

test('forgot password validator normalizes email', async () => {
  const req = { body: { email: '  Runner@Example.COM ' } };

  const error = await runMiddleware(validateForgotPassword, req);

  assert.equal(error, null);
  assert.equal(req.body.email, 'runner@example.com');
});

test('reset password validator enforces token structure and password strength', async () => {
  const error = await runMiddleware(validateResetPassword, {
    body: {
      token: 'bad-token',
      password: 'password123',
      confirmPassword: 'password123'
    }
  });

  assert.equal(error.statusCode, 400);
  assert.match(error.details.join(' '), /Valid password reset token is required/);
  assert.match(error.details.join(' '), /symbol/);
});
