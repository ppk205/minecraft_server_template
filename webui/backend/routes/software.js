const express = require('express');
const fs = require('fs');
const path = require('path');
const { execSync, exec } = require('child_process');
const { authenticateToken } = require('./auth');
require('dotenv').config({ path: path.resolve(__dirname, '../../../.env') });

const router = express.Router();
const baseDir = path.resolve(__dirname, '..', process.env.MC_SERVER_DIR || '../../atmg');
const envPath = path.resolve(__dirname, '../../../.env');

// Save object to .env
const saveEnv = (updates) => {
    let content = fs.existsSync(envPath) ? fs.readFileSync(envPath, 'utf8') : '';
    const lines = content.split('\n');
    const newLines = [];
    const keysUpdated = new Set();

    for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        const match = line.match(/^([^=]+)=(.*)$/);
        if (match && updates[match[1]] !== undefined) {
            newLines.push(`${match[1]}=${updates[match[1]]}`);
            keysUpdated.add(match[1]);
        } else {
            newLines.push(line);
        }
    }

    for (const [key, value] of Object.entries(updates)) {
        if (!keysUpdated.has(key)) {
            newLines.push(`${key}=${value}`);
        }
    }

    fs.writeFileSync(envPath, newLines.join('\n'), 'utf8');
};

router.post('/change', authenticateToken, (req, res) => {
    const { software, backup } = req.body;

    // Backup Logic
    if (backup) {
        const backupDir = path.resolve(baseDir, '../backups');
        if (!fs.existsSync(backupDir)) {
            fs.mkdirSync(backupDir, { recursive: true });
        }

        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const worldPath = path.join(baseDir, 'world');
        if (fs.existsSync(worldPath)) {
            const backupFile = path.join(backupDir, `world-backup-${timestamp}.tar.gz`);
            try {
                execSync(`tar -czf "${backupFile}" -C "${baseDir}" world`);
            } catch (err) {
                console.error("Backup failed", err);
            }
        }
    }

    // Wipe server dir except specific directories if you want
    try {
        execSync(`rm -rf "${path.join(baseDir, 'world')}" "${path.join(baseDir, 'mods')}" "${path.join(baseDir, 'config')}"`);
    } catch(err) {}

    saveEnv({ MC_TYPE: software });

    // Restart the container
    exec(`cd ../.. && docker compose up -d`, (error, stdout, stderr) => {
        if (error) {
            return res.status(500).json({ error: stderr });
        }
        res.json({ message: 'Software changed successfully' });
    });
});

module.exports = router;
