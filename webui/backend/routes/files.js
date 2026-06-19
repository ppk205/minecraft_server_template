const express = require('express');
const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');
const { authenticateToken } = require('./auth');
require('dotenv').config({ path: path.resolve(__dirname, '../../../.env') });

const router = express.Router();
const baseDir = path.resolve(__dirname, '..', process.env.MC_SERVER_DIR || '../../atmg');

// Middleware to prevent path traversal
const securePath = (req, res, next) => {
    const targetPath = req.query.path || '/';
    const resolvedPath = path.resolve(baseDir, `.${targetPath}`);
    if (!resolvedPath.startsWith(baseDir)) {
        return res.status(403).json({ error: 'Access denied' });
    }
    req.resolvedPath = resolvedPath;
    next();
};

router.get('/list', authenticateToken, securePath, (req, res) => {
    if (!fs.existsSync(req.resolvedPath)) {
        return res.status(404).json({ error: 'Directory not found' });
    }

    try {
        const items = fs.readdirSync(req.resolvedPath, { withFileTypes: true });
        const list = items.map(item => ({
            name: item.name,
            isDirectory: item.isDirectory(),
            path: path.join(req.query.path || '/', item.name).replace(/\\/g, '/')
        }));
        res.json({ list });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

router.get('/read', authenticateToken, securePath, (req, res) => {
    if (!fs.existsSync(req.resolvedPath)) {
        return res.status(404).json({ error: 'File not found' });
    }

    try {
        const content = fs.readFileSync(req.resolvedPath, 'utf8');
        res.json({ content });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

router.post('/write', authenticateToken, securePath, (req, res) => {
    try {
        fs.writeFileSync(req.resolvedPath, req.body.content, 'utf8');

        // Auto restart docker container to apply config changes
        exec(`cd ../.. && docker compose restart mc`, (error, stdout, stderr) => {
            if (error) {
                console.error("Failed to restart container:", stderr);
                return res.json({ message: 'File saved, but failed to auto-restart server.', error: stderr });
            }
            res.json({ message: 'File saved successfully and server restarting to apply changes.' });
        });

    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;
