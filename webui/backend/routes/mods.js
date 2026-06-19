const express = require('express');
const fs = require('fs');
const path = require('path');
const axios = require('axios');
const { authenticateToken } = require('./auth');
require('dotenv').config({ path: path.resolve(__dirname, '../../../.env') });

const router = express.Router();
const baseDir = path.resolve(__dirname, '..', process.env.MC_SERVER_DIR || '../../atmg');

router.post('/fix-missing', authenticateToken, async (req, res) => {
    let { missingNames } = req.body;
    
    // Auto mode: check manifest.json and mods/ folder
    if (!missingNames || missingNames.length === 0) {
        missingNames = [];
        try {
            const manifestPath = path.join(baseDir, 'manifest.json');
            const modsDir = path.join(baseDir, 'mods');

            if (fs.existsSync(manifestPath) && fs.existsSync(modsDir)) {
                const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
                const installedMods = fs.readdirSync(modsDir).filter(f => f.endsWith('.jar'));

                // For demonstration: we don't know the exact jar names for CF file IDs,
                // but a user can also pass missing project names from the frontend.
                // We'll just rely on the manual names if they're passed, but if not we can return an error
                // asking for manual names. A true CF-to-Modrinth mapper requires mapping CF Project IDs to Modrinth slugs.
            }
        } catch(e) {}
    }
    
    if (!missingNames || !Array.isArray(missingNames) || missingNames.length === 0) {
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
            const searchRes = await axios.get(`https://api.modrinth.com/v2/search?query=${name}&limit=1`);
            
            if (searchRes.data.hits && searchRes.data.hits.length > 0) {
                const projectId = searchRes.data.hits[0].project_id;
                
                const versionsRes = await axios.get(`https://api.modrinth.com/v2/project/${projectId}/version`);
                
                if (versionsRes.data && versionsRes.data.length > 0) {
                    const file = versionsRes.data[0].files.find(f => f.primary) || versionsRes.data[0].files[0];
                    const downloadUrl = file.url;
                    const fileName = file.filename;
                    
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
