const express = require('express');
const cors = require('cors');
const path = require('path');
const dotenv = require('dotenv');
const authRoutes = require('./routes/auth');
const dockerRoutes = require('./routes/docker');
const filesRoutes = require('./routes/files');
const modsRoutes = require('./routes/mods');

dotenv.config();

const app = express();

app.use(cors());
app.use(express.json());

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/docker', dockerRoutes);
app.use('/api/files', filesRoutes);
app.use('/api/mods', modsRoutes);

// Serve Frontend
app.use(express.static(path.join(__dirname, '../frontend/dist')));
app.get('/{*splat}', (req, res) => {
    res.sendFile(path.join(__dirname, '../frontend/dist/index.html'));
});

const PORT = process.env.PORT || 3001;

app.listen(PORT, () => {
    console.log(`WebUI Backend listening on port ${PORT}`);
});
