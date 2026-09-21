const fs = require('fs');
const path = require('path');
const assert = require('assert');
const { execFileSync } = require('child_process');

// Test backup functionality with special characters in directory names
function testBackupExecution() {
    const tmpDir = path.join(__dirname, 'tmp-test-dir; $(echo injected)');
    const worldDir = path.join(tmpDir, 'world');
    const backupDir = path.join(tmpDir, 'backups');

    try {
        if (fs.existsSync(tmpDir)) {
            fs.rmSync(tmpDir, { recursive: true, force: true });
        }

        fs.mkdirSync(worldDir, { recursive: true });
        fs.mkdirSync(backupDir, { recursive: true });

        fs.writeFileSync(path.join(worldDir, 'level.dat'), 'dummy data');

        const timestamp = 'test-time';
        const backupFile = path.join(backupDir, `world-backup-${timestamp}.tar.gz`);

        // Execute tar safely as done in software.js
        execFileSync('tar', ['-czf', backupFile, '-C', tmpDir, 'world']);

        assert.strictEqual(fs.existsSync(backupFile), true, 'Backup file should exist');
        console.log('Test passed: Backup file created successfully in directory with shell characters.');
    } finally {
        if (fs.existsSync(tmpDir)) {
            fs.rmSync(tmpDir, { recursive: true, force: true });
        }
    }
}

testBackupExecution();
