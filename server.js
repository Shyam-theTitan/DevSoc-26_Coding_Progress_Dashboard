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

// Codeforces API endpoint
app.get('/api/codeforces/:handle', async (req, res) => {
    const { handle } = req.params;
    console.log('Codeforces API called for:', handle);
    try {
        const response = await fetch(`https://codeforces.com/api/user.status?handle=${handle}&from=1&count=1000`);
        const data = await response.json();

        if (data.status !== 'OK') {
            throw new Error(data.comment || 'Codeforces API error');
        }

        console.log('Codeforces response received');
        res.json(data);
    } catch (error) {
        console.error('Codeforces API Error:', error);
        res.status(500).json({ error: 'Failed to fetch from Codeforces', message: error.message });
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
                system_prompt: `You are a Senior Technical Auditor and Career Coach. Your first task is to determine the user's "Mastery Tier" based on their Total Solved Problems (TSP):

TIER 0 (0-100): Novice. Focus on consistency and syntax.

TIER 1 (101-500): Practitioner. Focus on data structures.

TIER 2 (501-1500): Specialist. Focus on pattern recognition and Mediums.

TIER 3 (1501-4000): Expert. Focus on optimization and Hard problems.

TIER 4 (4001+): Elite. Focus on niche algorithms and contest performance.

MANDATORY RULES:

SCALE YOUR FEEDBACK: A Tier 1 user should be praised for 200 problems. A Tier 3 user should be told 200 problems is a "slow week."

RELATIVE FOCUS: Analyze the ratio of Easy:Medium:Hard. If a Tier 3 user has 90% Easy problems, call it "statistically insignificant growth."

NO BLUNDERS: Acknowledge the exact numbers provided in the user data.

Response Format (Strict JSON):

"tier_assessment": A 1-sentence classification (e.g., "User is a Tier 3 Expert with high GFG volume").

"summary": 3-6 sentences. Be brutally honest relative to their Tier.

"strengths": Array of 3 points.

"improvements": Array of 4 critical weaknesses.

"suggestions": Array of 4 tier-appropriate actionable steps.

"roadmap": An object with keys week1, week2, week3, week4, and monthly_target. Each week should have three string properties:
  - focus: The topic to focus on (e.g. "Arrays", "Dynamic Programming", "Graph BFS/DFS")
  - problems: Number and type of problems to solve (e.g. "15 Medium array problems")
  - goal: Specific milestone to achieve (e.g. "Master two-pointer technique")
  
The monthly_target should be a string describing the overall goal for the month.

The roadmap must be SPECIFIC to their tier and current stats.

Output valid JSON only.`
            });
            assistantId = assistant.assistantId;
            console.log('Created assistant:', assistantId);
        }

        // Create a new thread for this analysis
        const thread = await backboardClient.createThread(assistantId);
        threadId = thread.threadId;
        console.log('Created thread:', threadId);

        // Build the analysis prompt dynamically based on available platforms
        let platformStats = [];
        if (stats.leetcode > 0) platformStats.push(`- LeetCode Problems: ${stats.leetcode}`);
        if (stats.gfg > 0) platformStats.push(`- GeeksforGeeks Problems: ${stats.gfg}`);
        if (stats.codeforces > 0) platformStats.push(`- Codeforces Problems: ${stats.codeforces}`);

        const platformsUsed = [];
        if (stats.leetcode > 0) platformsUsed.push('LeetCode');
        if (stats.gfg > 0) platformsUsed.push('GFG');
        if (stats.codeforces > 0) platformsUsed.push('Codeforces');

        const analysisPrompt = `Analyze this coder's performance and give brutally honest feedback:

PLATFORMS USED: ${platformsUsed.length > 0 ? platformsUsed.join(', ') : 'None'}

STATS:
- Total Problems Solved: ${stats.totalSolved}
${platformStats.join('\n')}
- Languages Used: ${stats.languages}
- Recent Submissions: ${stats.recentSubmissions}

Based on these numbers, identify their weaknesses, what topics they're likely struggling with, and what topics they NEED to focus on. Don't be nice - be HELPFUL by being HONEST.

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
            console.log('Parsed analysis - roadmap present:', !!analysis.roadmap);
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

        // Ensure roadmap exists - provide default if AI didn't generate one
        if (!analysis.roadmap) {
            console.log('No roadmap in AI response, adding default roadmap');
            analysis.roadmap = {
                week1: { focus: 'Arrays & Strings', problems: '10-15 Easy problems', goal: 'Build consistency with daily practice' },
                week2: { focus: 'Hash Maps & Sets', problems: '10-12 Easy/Medium problems', goal: 'Master hash-based solutions' },
                week3: { focus: 'Two Pointers & Sliding Window', problems: '10-15 Medium problems', goal: 'Learn pattern recognition' },
                week4: { focus: 'Review & Mixed Practice', problems: '15-20 Mixed difficulty', goal: 'Consolidate all learned patterns' },
                monthly_target: 'Complete 50+ problems and solidify fundamental problem-solving patterns'
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
