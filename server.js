const express = require('express');
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Serve Static Frontend Files from public directory
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.static(__dirname));

// API Endpoint: Health Check
app.get('/api/status', (req, res) => {
    res.json({
        status: 'online',
        app: 'म्यूजिक प्लेयर — Music Player',
        version: '1.0.0',
        timestamp: new Date().toISOString()
    });
});

// API Endpoint: Default Playlist Data
app.get('/api/playlist', (req, res) => {
    res.json([
        {
            title: "Saaton Janam Main Tere",
            artist: "Kumar Sanu & Alka Yagnik",
            film: "Dilwale (1994)",
            duration: "6:02",
            durationSec: 362,
            art: "assets/album2.png"
        },
        {
            title: "Horn OK Please",
            artist: "Sukhwinder Singh",
            film: "Horn OK Pleassss (2009)",
            duration: "4:35",
            durationSec: 275,
            art: "assets/album1.png"
        },
        {
            title: "Highway Melodies",
            artist: "Altaf Raja",
            film: "Road Trip Anthems",
            duration: "5:12",
            durationSec: 312,
            art: "assets/album_highway.jpg"
        },
        {
            title: "Neele Neele Ambar Par",
            artist: "Kishore Kumar",
            film: "Kalaakaar (1983)",
            duration: "5:45",
            durationSec: 345,
            art: "assets/album4.png"
        },
        {
            title: "Chalte Chalte Mere Yeh Geet",
            artist: "Kishore Kumar",
            film: "Chalte Chalte (1976)",
            duration: "4:58",
            durationSec: 298,
            art: "assets/album5.png"
        }
    ]);
});

// Fallback route for index.html (when running full Node server locally)
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Start Node.js Express Server with Automatic Port Fallback
function startServer(port) {
    const server = app.listen(port, () => {
        console.log(`====================================================`);
        console.log(`🎵 म्यूजिक प्लेयर Node.js Server is running!`);
        console.log(`🌐 Local URL: http://localhost:${port}`);
        console.log(`====================================================`);
    });

    server.on('error', (err) => {
        if (err.code === 'EADDRINUSE') {
            const nextPort = Number(port) + 1;
            console.log(`⚠️ Port ${port} is currently in use. Switching to port ${nextPort}...`);
            startServer(nextPort);
        } else {
            console.error('Server error:', err);
        }
    });
}

// Export for Vercel serverless deployment
module.exports = app;

if (require.main === module) {
    startServer(PORT);
}
