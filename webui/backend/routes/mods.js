const express = require('express');
const fs = require('fs');
const path = require('path');
const axios = require('axios');
const { authenticateToken } = require('./auth');
require('dotenv').config();

const router = express.Router();
const baseDir = path.resolve(__dirname, '..', process.env.MC_SERVER_DIR || '../../atmg');

router.post('/fix-missing', authenticateToken, async (req, res) => {
    // A simplified example showing CF to Modrinth fallback
    // In a real scenario, this would parse manifest.json and check the installed mods folder
    
    // For demonstration, let's say we expect the user to send missing project IDs or names
    const { missingNames } = req.body; // e.g. ["sodium", "lithium"]
    
    if (!missingNames || !Array.isArray(missingNames)) {
        return res.status(400).json({ error: 'Please provide missingNames array.' });
    }
    
    const modsDir = path.join(baseDir, 'mods');
    if (!fs.existsSync(modsDir)) {
        fs.mkdirSync(modsDir, { recursive: true });
    }

    const downloaded = [];
    const failed = [];

    for (const name of missingNames) {
        try {
            // Query Modrinth for the project
            // Using search API: https://api.modrinth.com/v2/search?query=name
            const searchRes = await axios.get(`https://api.modrinth.com/v2/search?query=${name}&limit=1`);
            
            if (searchRes.data.hits && searchRes.data.hits.length > 0) {
                const projectId = searchRes.data.hits[0].project_id;
                
                // Get project versions
                const versionsRes = await axios.get(`https://api.modrinth.com/v2/project/${projectId}/version`);
                
                if (versionsRes.data && versionsRes.data.length > 0) {
                    // Pick latest version file
                    const file = versionsRes.data[0].files[0];
                    const downloadUrl = file.url;
                    const fileName = file.filename;
                    
                    // Download the file
                    const fileRes = await axios.get(downloadUrl, { responseType: 'stream' });
                    const writeStream = fs.createWriteStream(path.join(modsDir, fileName));
                    fileRes.data.pipe(writeStream);
                    
                    await new Promise((resolve, reject) => {
                        writeStream.on('finish', resolve);
                        writeStream.on('error', reject);
                    });
                    
                    downloaded.push(fileName);
                } else {
                    failed.push(name);
                }
            } else {
                failed.push(name);
            }
        } catch (error) {
            console.error(`Error downloading ${name}:`, error.message);
            failed.push(name);
        }
    }

    res.json({ downloaded, failed });
});

module.exports = router;
