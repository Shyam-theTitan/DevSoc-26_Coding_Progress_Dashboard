import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import { BackboardClient } from 'backboard-sdk';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3000;

// Backboard.io API configuration
const BACKBOARD_API_KEY = 'espr_QtHDNd1DsZIHAp_ocg1PcsPhleib7K2tEdPJgiXW4zg';
const backboardClient = new BackboardClient({ apiKey: BACKBOARD_API_KEY });

// Store assistant and thread IDs for reuse
let assistantId = null;
let threadId = null;

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

// AI Analysis endpoint using Backboard.io with Cohere
app.post('/api/analyze', async (req, res) => {
    console.log('AI Analysis requested with:', req.body);

    try {
        const { stats } = req.body;

        // Create assistant if not exists
        if (!assistantId) {
            const assistant = await backboardClient.createAssistant({
                name: 'Coding Performance Analyst',
                system_prompt: `You are a coding performance analyzer. Analyze user coding statistics and provide feedback in JSON format with these keys:
- "summary": Brief 2-3 sentence assessment of their performance
- "strengths": Array of 3 positive points
- "improvements": Array of 4 areas that need work
- "suggestions": Array of 4 specific actionable recommendations

Always respond with valid JSON only.`
            });
            assistantId = assistant.assistantId;
            console.log('Created assistant:', assistantId);
        }

        // Create a new thread for this analysis
        const thread = await backboardClient.createThread(assistantId);
        threadId = thread.threadId;
        console.log('Created thread:', threadId);

        // Build the analysis prompt
        const analysisPrompt = `Analyze this coder's performance and give brutally honest feedback:

STATS:
- Total Problems Solved: ${stats.totalSolved}
- LeetCode Problems: ${stats.leetcode}
- GeeksforGeeks Problems: ${stats.gfg}
- Languages Used: ${stats.languages}
- Recent Submissions: ${stats.recentSubmissions}

Based on these numbers, identify their weaknesses, what topics they're likely struggling with, and what they NEED to focus on. Don't be nice - be HELPFUL by being HONEST.

Respond ONLY with valid JSON in the format specified.`;

        // Send message and get response - using OpenRouter free model
        const response = await backboardClient.addMessage(threadId, {
            content: analysisPrompt,
            llm_provider: 'openrouter',
            model_name: 'cohere/command-r-08-2024',
            stream: false
        });

        console.log('AI Response received:', response.content);

        // Parse the JSON response
        let analysis;
        try {
            // Extract JSON from the response (handle markdown code blocks)
            let jsonStr = response.content;
            const jsonMatch = jsonStr.match(/```(?:json)?\s*([\s\S]*?)```/);
            if (jsonMatch) {
                jsonStr = jsonMatch[1].trim();
            }
            analysis = JSON.parse(jsonStr);
        } catch (parseError) {
            console.error('Failed to parse AI response as JSON:', parseError);
            // Create a structured response from the text
            analysis = {
                summary: response.content.substring(0, 200),
                strengths: ['Attempting to practice coding'],
                improvements: ['Need more consistent practice', 'Should increase problem count', 'Work on variety of topics'],
                suggestions: ['Solve at least 3 problems daily', 'Focus on Data Structures', 'Practice more Medium difficulty problems', 'Review your weak topics']
            };
        }

        // Clean up - delete thread to save resources
        try {
            await backboardClient.deleteThread(threadId);
        } catch (e) {
            console.log('Thread cleanup failed:', e.message);
        }

        res.json({ success: true, analysis });

    } catch (error) {
        console.error('AI Analysis Error:', error);
        res.status(500).json({
            success: false,
            error: error.message || 'Failed to get AI analysis'
        });
    }
});

app.listen(PORT, () => {
    console.log(`🚀 Server running at http://localhost:${PORT}`);
    console.log(`📊 Dashboard available at http://localhost:${PORT}/main.html`);
    console.log(`🧪 Test endpoint: http://localhost:${PORT}/api/test`);
    console.log(`🤖 AI Analysis endpoint: http://localhost:${PORT}/api/analyze`);
});
