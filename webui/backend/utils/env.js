const fs = require('fs');
const path = require('path');

const DEFAULT_ENV_PATH = path.resolve(__dirname, '../../../.env');

const SAFE_KEYS = new Set([
    'MC_MEMORY',
    'MC_TYPE',
    'PLAYIT_KEY',
    'CLOUDFLARED_TOKEN',
    'NGROK_AUTHTOKEN',
    'TAILSCALE_AUTHKEY',
    'COMPOSE_PROFILES'
]);

const parseEnv = (customEnvPath = DEFAULT_ENV_PATH) => {
    if (!fs.existsSync(customEnvPath)) return {};
    const content = fs.readFileSync(customEnvPath, 'utf8');
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

const saveEnv = (updates, options = {}) => {
    const envPath = options.envPath || DEFAULT_ENV_PATH;
    const enforceSafeKeys = options.enforceSafeKeys !== undefined ? options.enforceSafeKeys : true;
    const allowedKeys = options.allowedKeys || SAFE_KEYS;

    let content = fs.existsSync(envPath) ? fs.readFileSync(envPath, 'utf8') : '';
    const lines = content.split('\n');
    const newLines = [];
    const keysUpdated = new Set();

    const isKeyAllowed = (key) => !enforceSafeKeys || allowedKeys.has(key);

    for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        const match = line.match(/^([^=]+)=(.*)$/);
        if (match && isKeyAllowed(match[1]) && updates[match[1]] !== undefined) {
            newLines.push(`${match[1]}=${updates[match[1]]}`);
            keysUpdated.add(match[1]);
        } else {
            newLines.push(line);
        }
    }

    for (const [key, value] of Object.entries(updates)) {
        if (isKeyAllowed(key) && !keysUpdated.has(key)) {
            newLines.push(`${key}=${value}`);
        }
    }

    fs.writeFileSync(envPath, newLines.join('\n'), 'utf8');
};

module.exports = {
    saveEnv,
    parseEnv,
    SAFE_KEYS,
    DEFAULT_ENV_PATH
};
