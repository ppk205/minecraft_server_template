const test = require('node:test');
const assert = require('node:assert');
const fs = require('fs');
const path = require('path');
const os = require('os');
const { saveEnv, parseEnv } = require('../utils/env');

test('parseEnv reads and filters secrets from env file', () => {
    const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'env-test-'));
    const envPath = path.join(tmpDir, '.env');

    fs.writeFileSync(envPath, [
        'MC_MEMORY=4G',
        'WEBUI_ADMIN_PASS=secret123',
        'WEBUI_ADMIN_USER=admin',
        'JWT_SECRET=supersecret',
        'MC_TYPE=paper'
    ].join('\n'));

    const parsed = parseEnv(envPath);
    assert.strictEqual(parsed.MC_MEMORY, '4G');
    assert.strictEqual(parsed.MC_TYPE, 'paper');
    assert.strictEqual(parsed.WEBUI_ADMIN_PASS, undefined);
    assert.strictEqual(parsed.WEBUI_ADMIN_USER, undefined);
    assert.strictEqual(parsed.JWT_SECRET, undefined);

    fs.rmSync(tmpDir, { recursive: true, force: true });
});

test('saveEnv updates existing safe keys and adds new safe keys', () => {
    const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'env-test-'));
    const envPath = path.join(tmpDir, '.env');

    fs.writeFileSync(envPath, [
        'MC_MEMORY=2G',
        'UNSAFE_KEY=dontchange'
    ].join('\n'));

    saveEnv({ MC_MEMORY: '8G', MC_TYPE: 'forge', UNSAFE_KEY: 'changed' }, { envPath });

    const content = fs.readFileSync(envPath, 'utf8');
    assert.match(content, /MC_MEMORY=8G/);
    assert.match(content, /MC_TYPE=forge/);
    assert.match(content, /UNSAFE_KEY=dontchange/);

    fs.rmSync(tmpDir, { recursive: true, force: true });
});

test('saveEnv allows overriding safe key enforcement when disabled', () => {
    const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'env-test-'));
    const envPath = path.join(tmpDir, '.env');

    fs.writeFileSync(envPath, 'CUSTOM_VAR=old\n');

    saveEnv({ CUSTOM_VAR: 'new' }, { envPath, enforceSafeKeys: false });

    const content = fs.readFileSync(envPath, 'utf8');
    assert.match(content, /CUSTOM_VAR=new/);

    fs.rmSync(tmpDir, { recursive: true, force: true });
});
