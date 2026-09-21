const { test, describe } = require('node:test');
const assert = require('node:assert');
const path = require('path');
const filesRouter = require('../routes/files');
const { securePath } = filesRouter;

function createMockReqRes(query = {}) {
    const req = {
        query
    };

    const res = {
        statusCode: null,
        jsonData: null,
        status(code) {
            this.statusCode = code;
            return this;
        },
        json(data) {
            this.jsonData = data;
            return this;
        }
    };

    let nextCalled = false;
    const next = () => {
        nextCalled = true;
    };

    return { req, res, next, isNextCalled: () => nextCalled };
}

describe('securePath Middleware', () => {
    const baseDir = path.resolve(__dirname, '..', process.env.MC_SERVER_DIR || '../../atmg');

    test('allows default path when query.path is undefined', () => {
        const { req, res, next, isNextCalled } = createMockReqRes({});

        securePath(req, res, next);

        assert.strictEqual(isNextCalled(), true);
        assert.strictEqual(req.resolvedPath, baseDir);
        assert.strictEqual(res.statusCode, null);
    });

    test('allows safe path within baseDir', () => {
        const { req, res, next, isNextCalled } = createMockReqRes({ path: '/config/server.properties' });

        securePath(req, res, next);

        assert.strictEqual(isNextCalled(), true);
        assert.strictEqual(req.resolvedPath, path.resolve(baseDir, './config/server.properties'));
        assert.strictEqual(res.statusCode, null);
    });

    test('blocks path traversal attempt using ../', () => {
        const { req, res, next, isNextCalled } = createMockReqRes({ path: '/../../etc/passwd' });

        securePath(req, res, next);

        assert.strictEqual(isNextCalled(), false);
        assert.strictEqual(res.statusCode, 403);
        assert.deepStrictEqual(res.jsonData, { error: 'Access denied' });
    });

    test('blocks path traversal attempt traversing out of baseDir root', () => {
        const { req, res, next, isNextCalled } = createMockReqRes({ path: '/..' });

        securePath(req, res, next);

        assert.strictEqual(isNextCalled(), false);
        assert.strictEqual(res.statusCode, 403);
        assert.deepStrictEqual(res.jsonData, { error: 'Access denied' });
    });
});
