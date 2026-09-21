const fs = require('fs');
const path = require('path');

const envPath = path.resolve(__dirname, '../../../.env');

const safeKeys = new Set([
    'MC_MEMORY',
    'MC_TYPE',
    'PLAYIT_KEY',
    'CLOUDFLARED_TOKEN',
    'NGROK_AUTHTOKEN',
    'TAILSCALE_AUTHKEY',
    'COMPOSE_PROFILES'
]);

const parseEnv = (targetPath = envPath) => {
    if (!fs.existsSync(targetPath)) return {};
    const content = fs.readFileSync(targetPath, 'utf8');
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

const saveEnv = (updates, targetPath = envPath, allowedKeys = safeKeys) => {
    let content = fs.existsSync(targetPath) ? fs.readFileSync(targetPath, 'utf8') : '';
    const lines = content.split('\n');
    const newLines = [];
    const keysUpdated = new Set();

    for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        const match = line.match(/^([^=]+)=(.*)$/);
        const isAllowed = !allowedKeys || allowedKeys.has(match?.[1]);
        if (match && isAllowed && updates[match[1]] !== undefined) {
            newLines.push(`${match[1]}=${updates[match[1]]}`);
            keysUpdated.add(match[1]);
        } else {
            newLines.push(line);
        }
    }

    for (const [key, value] of Object.entries(updates)) {
        const isAllowed = !allowedKeys || allowedKeys.has(key);
        if (isAllowed && !keysUpdated.has(key)) {
            newLines.push(`${key}=${value}`);
        }
    }

    fs.writeFileSync(targetPath, newLines.join('\n'), 'utf8');
};

module.exports = {
    envPath,
    safeKeys,
    parseEnv,
    saveEnv
};
