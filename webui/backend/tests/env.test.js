const fs = require('fs');
const path = require('path');
const assert = require('assert');
const { parseEnv, saveEnv, safeKeys } = require('../utils/env');

const testEnvPath = path.resolve(__dirname, 'test.env');

try {
    // Setup test file
    fs.writeFileSync(testEnvPath, 'MC_MEMORY=4G\nWEBUI_ADMIN_PASS=secret\nMC_TYPE=vanilla\n', 'utf8');

    // Test parseEnv
    const parsed = parseEnv(testEnvPath);
    assert.strictEqual(parsed.MC_MEMORY, '4G');
    assert.strictEqual(parsed.MC_TYPE, 'vanilla');
    assert.strictEqual(parsed.WEBUI_ADMIN_PASS, undefined, 'Secrets should be filtered out in parseEnv');

    // Test saveEnv updating existing safe key
    saveEnv({ MC_MEMORY: '8G' }, testEnvPath, safeKeys);
    let updatedContent = fs.readFileSync(testEnvPath, 'utf8');
    assert(updatedContent.includes('MC_MEMORY=8G'));
    assert(updatedContent.includes('WEBUI_ADMIN_PASS=secret'));

    // Test saveEnv ignoring non-safe keys when allowedKeys is passed
    saveEnv({ UNSAFE_KEY: 'hacked' }, testEnvPath, safeKeys);
    updatedContent = fs.readFileSync(testEnvPath, 'utf8');
    assert(!updatedContent.includes('UNSAFE_KEY=hacked'));

    // Test saveEnv adding new safe key
    saveEnv({ PLAYIT_KEY: 'my-key' }, testEnvPath, safeKeys);
    updatedContent = fs.readFileSync(testEnvPath, 'utf8');
    assert(updatedContent.includes('PLAYIT_KEY=my-key'));

    console.log('All env.test.js assertions passed successfully!');
} finally {
    if (fs.existsSync(testEnvPath)) {
        fs.unlinkSync(testEnvPath);
    }
}
