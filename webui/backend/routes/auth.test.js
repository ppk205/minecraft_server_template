const test = require('node:test');
const assert = require('node:assert/strict');
const jwt = require('jsonwebtoken');
const { authenticateToken } = require('./auth');

process.env.JWT_SECRET = process.env.JWT_SECRET || 'test-secret-key';

function createMockReqRes(headers = {}) {
  const req = {
    headers: headers,
  };
  const res = {
    statusCode: null,
    sendStatus(status) {
      this.statusCode = status;
      return this;
    },
    status(status) {
      this.statusCode = status;
      return this;
    },
    json(data) {
      this.body = data;
      return this;
    },
  };
  return { req, res };
}

test('authenticateToken - missing authorization header returns 401', () => {
  const { req, res } = createMockReqRes({});
  let nextCalled = false;
  const next = () => { nextCalled = true; };

  authenticateToken(req, res, next);

  assert.strictEqual(res.statusCode, 401);
  assert.strictEqual(nextCalled, false);
});

test('authenticateToken - authorization header without token returns 401', () => {
  const { req, res } = createMockReqRes({ authorization: 'Bearer' });
  let nextCalled = false;
  const next = () => { nextCalled = true; };

  authenticateToken(req, res, next);

  assert.strictEqual(res.statusCode, 401);
  assert.strictEqual(nextCalled, false);
});

test('authenticateToken - invalid token returns 403', () => {
  const { req, res } = createMockReqRes({ authorization: 'Bearer invalidtoken123' });
  let nextCalled = false;
  const next = () => { nextCalled = true; };

  authenticateToken(req, res, next);

  assert.strictEqual(res.statusCode, 403);
  assert.strictEqual(nextCalled, false);
});

test('authenticateToken - valid token calls next() and sets req.user', () => {
  const payload = { username: 'admin' };
  const token = jwt.sign(payload, process.env.JWT_SECRET);
  const { req, res } = createMockReqRes({ authorization: `Bearer ${token}` });
  let nextCalled = false;
  const next = () => { nextCalled = true; };

  authenticateToken(req, res, next);

  assert.strictEqual(nextCalled, true);
  assert.ok(req.user);
  assert.strictEqual(req.user.username, 'admin');
  assert.strictEqual(res.statusCode, null);
});
