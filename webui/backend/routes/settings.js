const express = require('express');
const { authenticateToken } = require('./auth');
const { parseEnv, saveEnv } = require('../utils/env');
require('dotenv').config();

const router = express.Router();

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
