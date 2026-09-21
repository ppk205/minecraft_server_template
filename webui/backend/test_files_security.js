const assert = require('assert');
const path = require('path');
const filesRouter = require('./routes/files');

// Extract securePath middleware from route layer for testing
function getSecurePathMiddleware() {
    const routeLayer = filesRouter.stack.find(layer => layer.route && layer.route.path === '/list');
    if (!routeLayer) {
        throw new Error('Could not find /list route layer');
    }
    const securePathLayer = routeLayer.route.stack[1];
    return securePathLayer.handle;
}

const securePath = getSecurePathMiddleware();

function runTests() {
    console.log('Running securePath middleware unit tests...');

    function testRequest(queryPath) {
        let nextCalled = false;
        let resStatus = null;
        let resJson = null;

        const req = {
            query: queryPath !== undefined ? { path: queryPath } : {}
        };
        const res = {
            status(code) {
                resStatus = code;
                return this;
            },
            json(data) {
                resJson = data;
                return this;
            }
        };
        const next = () => {
            nextCalled = true;
        };

        securePath(req, res, next);
        return { nextCalled, resStatus, resJson, req };
    }

    // Test 1: Default path (no query path)
    {
        const result = testRequest(undefined);
        assert.strictEqual(result.nextCalled, true, 'Default path should call next()');
        assert.strictEqual(result.resStatus, null, 'Default path should not set error status');
        console.log('✔ Passed: Default path access');
    }

    // Test 2: Valid root path '/'
    {
        const result = testRequest('/');
        assert.strictEqual(result.nextCalled, true, 'Valid root path should call next()');
        assert.strictEqual(result.resStatus, null, 'Valid root path should not set error status');
        console.log('✔ Passed: Root path access');
    }

    // Test 3: Valid relative subpath '/subfolder/file.txt'
    {
        const result = testRequest('/subfolder/file.txt');
        assert.strictEqual(result.nextCalled, true, 'Valid subpath should call next()');
        assert.strictEqual(result.resStatus, null, 'Valid subpath should not set error status');
        console.log('✔ Passed: Subpath access');
    }

    // Test 4: Path traversal attempt to sibling directory with matching prefix (e.g. /../atmg-secret)
    {
        const result = testRequest('/../atmg-secret');
        assert.strictEqual(result.nextCalled, false, 'Path traversal prefix attack should not call next()');
        assert.strictEqual(result.resStatus, 403, 'Path traversal prefix attack should return 403');
        assert.deepStrictEqual(result.resJson, { error: 'Access denied' });
        console.log('✔ Passed: Blocked directory prefix traversal attack (/../atmg-secret)');
    }

    // Test 5: Path traversal attempt outside base directory (/../../etc/passwd)
    {
        const result = testRequest('/../../etc/passwd');
        assert.strictEqual(result.nextCalled, false, 'Path traversal outside base directory should not call next()');
        assert.strictEqual(result.resStatus, 403, 'Path traversal outside base directory should return 403');
        assert.deepStrictEqual(result.resJson, { error: 'Access denied' });
        console.log('✔ Passed: Blocked outer directory traversal attack (/../../etc/passwd)');
    }

    console.log('\nAll securePath tests passed successfully!');
}

try {
    runTests();
} catch (err) {
    console.error('Test failed:', err);
    process.exit(1);
}
