const express = require('express');
const { exec } = require('child_process');
const { authenticateToken } = require('./auth');
require('dotenv').config();

const router = express.Router();
const containerName = process.env.DOCKER_CONTAINER_NAME || 'atmg';

// Status
router.get('/status', authenticateToken, (req, res) => {
    exec(`docker inspect --format="{{.State.Status}}" ${containerName}`, (error, stdout, stderr) => {
        if (error) {
            return res.json({ status: 'unknown', error: stderr.trim() });
        }
        res.json({ status: stdout.trim() });
    });
});

// Logs
router.get('/logs', authenticateToken, (req, res) => {
    exec(`docker logs --tail 100 ${containerName}`, (error, stdout, stderr) => {
        res.json({ logs: stdout + stderr });
    });
});

// Restart
router.post('/restart', authenticateToken, (req, res) => {
    exec(`docker restart ${containerName}`, (error, stdout, stderr) => {
        if (error) {
            return res.status(500).json({ error: stderr });
        }
        res.json({ message: 'Server restarted successfully' });
    });
});

// Start
router.post('/start', authenticateToken, (req, res) => {
    exec(`docker start ${containerName}`, (error, stdout, stderr) => {
        if (error) {
            return res.status(500).json({ error: stderr });
        }
        res.json({ message: 'Server started successfully' });
    });
});

// Stop
router.post('/stop', authenticateToken, (req, res) => {
    exec(`docker stop ${containerName}`, (error, stdout, stderr) => {
        if (error) {
            return res.status(500).json({ error: stderr });
        }
        res.json({ message: 'Server stopped successfully' });
    });
});

module.exports = router;
