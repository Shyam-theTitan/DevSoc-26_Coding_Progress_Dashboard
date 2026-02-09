const express = require('express');
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = 3000;

app.use(cors());
app.use(express.json());

app.use(express.static(path.join(__dirname)));

app.use((req, res, next) => {
    console.log(`${req.method} ${req.url}`);
    next();
});

app.post('/api/leetcode', async (req, res) => {
    console.log('LeetCode API called with:', req.body);
    try {
        const response = await fetch('https://leetcode.com/graphql/', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Referer': 'https://leetcode.com',
            },
            body: JSON.stringify(req.body)
        });

        const data = await response.json();
        console.log('LeetCode response received');
        res.json(data);
    } catch (error) {
        console.error('LeetCode API Error:', error);
        res.status(500).json({ error: 'Failed to fetch from LeetCode' });
    }
});

app.get('/api/test', (req, res) => {
    res.json({ status: 'ok', message: 'Server is running!' });
});

app.post('/api/gfg', async (req, res) => {
    console.log('GFG API called with:', req.body);
    try {
        const response = await fetch('https://practiceapi.geeksforgeeks.org/api/v1/user/problems/submissions/', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(req.body)
        });

        const data = await response.json();
        console.log('GFG response received');
        res.json(data);
    } catch (error) {
        console.error('GFG API Error:', error);
        res.status(500).json({ error: 'Failed to fetch from GeeksforGeeks' });
    }
});

app.listen(PORT, () => {
    console.log(`🚀 Server running at http://localhost:${PORT}`);
    console.log(`📊 Dashboard available at http://localhost:${PORT}/main.html`);
    console.log(`🧪 Test endpoint: http://localhost:${PORT}/api/test`);
});
