const { describe, it, beforeEach } = require('node:test');
const assert = require('node:assert');
const jwt = require('jsonwebtoken');
const { authenticateToken } = require('../routes/auth');

describe('authenticateToken middleware', () => {
    const JWT_SECRET = 'test-secret-key';

    beforeEach(() => {
        process.env.JWT_SECRET = JWT_SECRET;
    });

    const createMockRes = () => {
        const res = {};
        res.sendStatus = (statusCode) => {
            res.statusCode = statusCode;
            return res;
        };
        return res;
    };

    it('should return 401 if no authorization header is present', () => {
        const req = { headers: {} };
        const res = createMockRes();
        let nextCalled = false;
        const next = () => { nextCalled = true; };

        authenticateToken(req, res, next);

        assert.strictEqual(res.statusCode, 401);
        assert.strictEqual(nextCalled, false);
    });

    it('should return 401 if authorization header is present but missing token', () => {
        const req = { headers: { authorization: 'Bearer' } };
        const res = createMockRes();
        let nextCalled = false;
        const next = () => { nextCalled = true; };

        authenticateToken(req, res, next);

        assert.strictEqual(res.statusCode, 401);
        assert.strictEqual(nextCalled, false);
    });

    it('should return 403 if token is invalid', () => {
        const req = { headers: { authorization: 'Bearer invalid-token' } };
        const res = createMockRes();
        let nextCalled = false;
        const next = () => { nextCalled = true; };

        authenticateToken(req, res, next);

        assert.strictEqual(res.statusCode, 403);
        assert.strictEqual(nextCalled, false);
    });

    it('should set req.user and call next() if token is valid', () => {
        const payload = { username: 'admin' };
        const token = jwt.sign(payload, JWT_SECRET, { expiresIn: '1h' });

        const req = { headers: { authorization: `Bearer ${token}` } };
        const res = createMockRes();
        let nextCalled = false;
        const next = () => { nextCalled = true; };

        authenticateToken(req, res, next);

        assert.strictEqual(nextCalled, true);
        assert.strictEqual(req.user.username, 'admin');
    });
});
