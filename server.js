const express = require('express');
const http = require('https');
const path = require('path');
const app = express();
const PORT = 3000;

app.use(express.static(path.join(__dirname, 'public')));

// Proxy to avoid CORS issues with Deezer API
app.get('/api/search', (req, res) => {
    const query = req.query.q;
    if (!query) return res.json({ data: [] });
    
    const url = `https://api.deezer.com/search?q=${encodeURIComponent(query)}`;
    
    http.get(url, (apiRes) => {
        let data = '';
        apiRes.on('data', (chunk) => { data += chunk; });
        apiRes.on('end', () => {
            try {
                res.json(JSON.parse(data));
            } catch (e) {
                res.status(500).json({ error: "Invalid JSON from Deezer" });
            }
        });
    }).on('error', (err) => {
        res.status(500).json({ error: err.message });
    });
});

app.listen(PORT, () => {
    console.log(`Servidor DJ Mixer corriendo en http://localhost:${PORT}`);
});
