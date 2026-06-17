const express = require('express');
const fs = require('fs');
const path = require('path');
const { authenticateToken } = require('./auth');
require('dotenv').config();

const router = express.Router();
const envPath = path.resolve(__dirname, '../../../.env');

const parseEnv = () => {
    if (!fs.existsSync(envPath)) return {};
    const content = fs.readFileSync(envPath, 'utf8');
    const result = {};
    content.split('\n').forEach(line => {
        const match = line.match(/^([^=]+)=(.*)$/);
        if (match) {
            result[match[1]] = match[2].replace(/^"|"$|^'|'$/g, '').trim();
        }
    });

    // Filter out secrets
    delete result['WEBUI_ADMIN_PASS'];
    delete result['WEBUI_ADMIN_USER'];
    delete result['JWT_SECRET'];

    return result;
};

const safeKeys = new Set([
    'MC_MEMORY',
    'MC_TYPE',
    'PLAYIT_KEY',
    'CLOUDFLARED_TOKEN',
    'NGROK_AUTHTOKEN',
    'TAILSCALE_AUTHKEY',
    'COMPOSE_PROFILES'
]);

const saveEnv = (updates) => {
    let content = fs.existsSync(envPath) ? fs.readFileSync(envPath, 'utf8') : '';
    const lines = content.split('\n');
    const newLines = [];
    const keysUpdated = new Set();

    for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        const match = line.match(/^([^=]+)=(.*)$/);
        if (match && safeKeys.has(match[1]) && updates[match[1]] !== undefined) {
            newLines.push(`${match[1]}=${updates[match[1]]}`);
            keysUpdated.add(match[1]);
        } else {
            newLines.push(line);
        }
    }

    for (const [key, value] of Object.entries(updates)) {
        if (safeKeys.has(key) && !keysUpdated.has(key)) {
            newLines.push(`${key}=${value}`);
        }
    }

    fs.writeFileSync(envPath, newLines.join('\n'), 'utf8');
};

router.get('/', authenticateToken, (req, res) => {
    res.json(parseEnv());
});

router.post('/', authenticateToken, (req, res) => {
    try {
        saveEnv(req.body);
        res.json({ message: 'Settings saved' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
