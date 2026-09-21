const express = require('express');
const fs = require('fs');
const path = require('path');
const { execSync, exec } = require('child_process');
const { authenticateToken } = require('./auth');
const { saveEnv } = require('../utils/env');
require('dotenv').config({ path: path.resolve(__dirname, '../../../.env') });

const router = express.Router();
const baseDir = path.resolve(__dirname, '..', process.env.MC_SERVER_DIR || '../../atmg');

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
