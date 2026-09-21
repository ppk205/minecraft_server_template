const express = require('express');
const Docker = require('dockerode');
const { exec } = require('child_process');
const path = require('path');
const { authenticateToken } = require('./auth');
require('dotenv').config({ path: path.resolve(__dirname, '../../../.env') });

const router = express.Router();
const docker = new Docker({ socketPath: '/var/run/docker.sock' });

// We assume the docker compose container name follows a pattern like <project-name>-mc-1
// Let's find the container dynamically by label or name, or just use the exec command slightly modified
// to get the id if needed. Since docker compose names the container, let's find the container named or containing '-mc-'.
const getMcContainer = async () => {
    const containers = await docker.listContainers({ all: true });
    // Look for container with name ending in mc-1 or having 'mc' in the compose service label
    const mcContainerInfo = containers.find(c =>
        c.Labels['com.docker.compose.service'] === 'mc' ||
        c.Names.some(name => name.includes('-mc-'))
    );
    if (!mcContainerInfo) {
        throw new Error('MC container not found');
    }
    return docker.getContainer(mcContainerInfo.Id);
};


// Status
router.get('/status', authenticateToken, async (req, res) => {
    try {
        const container = await getMcContainer();
        const data = await container.inspect();
        res.json({ status: data.State.Status });
    } catch (error) {
        res.json({ status: 'unknown', error: error.message });
    }
});

// Logs
router.get('/logs', authenticateToken, async (req, res) => {
    try {
        const container = await getMcContainer();
        const logs = await container.logs({
            follow: false,
            stdout: true,
            stderr: true,
            tail: 100
        });
        res.json({ logs: logs.toString('utf8') });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Restart
router.post('/restart', authenticateToken, async (req, res) => {
    try {
        const container = await getMcContainer();
        await container.restart();
        res.json({ message: 'Server restarted successfully' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Up
// docker-compose up is hard to replicate cleanly purely in dockerode without parsing docker-compose.yml
// so we'll leave it as exec for 'up', but since the container exists in most cases,
// if it's just created we can start it.
router.post('/up', authenticateToken, (req, res) => {
    exec(`cd ../.. && docker compose up -d`, (error, stdout, stderr) => {
        if (error) {
            return res.status(500).json({ error: stderr });
        }
        res.json({ message: 'Docker compose up successfully' });
    });
});

// Start
router.post('/start', authenticateToken, async (req, res) => {
    try {
        const container = await getMcContainer();
        await container.start();
        res.json({ message: 'Server started successfully' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Stop
router.post('/stop', authenticateToken, async (req, res) => {
    try {
        const container = await getMcContainer();
        await container.stop();
        res.json({ message: 'Server stopped successfully' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;
module.exports.getMcContainer = getMcContainer;
