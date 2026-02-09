const express = require('express');
const cors = require('cors');
const path = require('path');
const OpenAI = require('openai');

const app = express();
const PORT = 3000;

// Initialize OpenAI client with Backboard.io endpoint
const openai = new OpenAI({
    apiKey: 'espr_7GmeBpBJrbmsUbzfBi1csfeQmEtJpEIeazmP-Buttwk',
    baseURL: 'https://api.backboard.io/v1'
});

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

// AI Analysis endpoint using Backboard.io (OpenAI-compatible)
app.post('/api/analyze', async (req, res) => {
    console.log('AI Analysis called with:', req.body);

    try {
        const { stats } = req.body;

        const prompt = `You are an expert coding coach. Analyze this coder's statistics and provide insights:
        
- Total Problems Solved: ${stats.totalSolved}
- LeetCode Problems: ${stats.leetcode}
- GeeksforGeeks Problems: ${stats.gfg}
- Languages Used: ${stats.languages}
- Recent Submissions: ${stats.recentSubmissions}

Respond ONLY with a valid JSON object (no markdown, no code blocks) in this exact format:
{
    "summary": "A brief 2-3 sentence overview of the coder's performance",
    "strengths": ["strength 1", "strength 2", "strength 3"],
    "improvements": ["area 1", "area 2", "area 3"],
    "suggestions": ["specific actionable suggestion 1", "suggestion 2", "suggestion 3", "suggestion 4"]
}`;

        const completion = await openai.chat.completions.create({
            model: 'gpt-4o-mini',
            messages: [
                {
                    role: 'system',
                    content: 'You are an expert coding coach. Always respond with valid JSON only, no markdown formatting.'
                },
                {
                    role: 'user',
                    content: prompt
                }
            ],
            temperature: 0.7,
            max_tokens: 1000
        });

        const responseText = completion.choices[0].message.content;
        console.log('AI Response:', responseText);

        try {
            // Clean potential markdown code blocks
            let cleanedResponse = responseText;
            if (cleanedResponse.includes('```')) {
                cleanedResponse = cleanedResponse.replace(/```json\n?/g, '').replace(/```\n?/g, '');
            }

            const analysis = JSON.parse(cleanedResponse.trim());
            res.json({ success: true, analysis });
        } catch (parseError) {
            console.error('JSON Parse Error:', parseError);
            // Fallback response if JSON parsing fails
            res.json({
                success: true,
                analysis: {
                    summary: `You've solved ${stats.totalSolved} problems across multiple platforms. Great progress!`,
                    strengths: [
                        'Active on multiple coding platforms',
                        `Solved ${stats.leetcode} LeetCode problems`,
                        `Solved ${stats.gfg} GeeksforGeeks problems`
                    ],
                    improvements: [
                        'Try more diverse problem categories',
                        'Explore different programming languages',
                        'Focus on harder difficulty problems'
                    ],
                    suggestions: [
                        'Set a daily goal of solving at least 2 problems',
                        'Review and optimize your previous solutions',
                        'Practice time-bound problem solving',
                        'Join coding contests for real-world experience'
                    ]
                }
            });
        }

    } catch (error) {
        console.error('AI Analysis Error:', error);
        res.status(500).json({
            success: false,
            error: error.message || 'Failed to analyze data'
        });
    }
});

app.listen(PORT, () => {
    console.log(`🚀 Server running at http://localhost:${PORT}`);
    console.log(`📊 Dashboard available at http://localhost:${PORT}/main.html`);
    console.log(`🧪 Test endpoint: http://localhost:${PORT}/api/test`);
});
