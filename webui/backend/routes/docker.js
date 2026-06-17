const express = require('express');
const { exec } = require('child_process');
const path = require('path');
const { authenticateToken } = require('./auth');
require('dotenv').config({ path: path.resolve(__dirname, '../../../.env') });

const router = express.Router();

// Status
router.get('/status', authenticateToken, (req, res) => {
    exec(`cd ../.. && docker compose ps -q mc | xargs docker inspect --format="{{.State.Status}}"`, (error, stdout, stderr) => {
        if (error) {
            return res.json({ status: 'unknown', error: stderr.trim() });
        }
        res.json({ status: stdout.trim() });
    });
});

// Logs
router.get('/logs', authenticateToken, (req, res) => {
    exec(`cd ../.. && docker compose logs --tail 100 mc`, (error, stdout, stderr) => {
        res.json({ logs: stdout + stderr });
    });
});

// Restart
router.post('/restart', authenticateToken, (req, res) => {
    exec(`cd ../.. && docker compose restart mc`, (error, stdout, stderr) => {
        if (error) {
            return res.status(500).json({ error: stderr });
        }
        res.json({ message: 'Server restarted successfully' });
    });
});

// Up
router.post('/up', authenticateToken, (req, res) => {
    exec(`cd ../.. && docker compose up -d`, (error, stdout, stderr) => {
        if (error) {
            return res.status(500).json({ error: stderr });
        }
        res.json({ message: 'Docker compose up successfully' });
    });
});

// Start
router.post('/start', authenticateToken, (req, res) => {
    exec(`cd ../.. && docker compose start mc`, (error, stdout, stderr) => {
        if (error) {
            return res.status(500).json({ error: stderr });
        }
        res.json({ message: 'Server started successfully' });
    });
});

// Stop
router.post('/stop', authenticateToken, (req, res) => {
    exec(`cd ../.. && docker compose stop mc`, (error, stdout, stderr) => {
        if (error) {
            return res.status(500).json({ error: stderr });
        }
        res.json({ message: 'Server stopped successfully' });
    });
});

module.exports = router;
