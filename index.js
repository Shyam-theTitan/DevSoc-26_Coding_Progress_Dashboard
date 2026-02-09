// LeetCode GraphQL API - Fetch Recent Accepted Submissions

async function fetchLeetCodeRecentSubmissions(username, limit = 15) {
    // Use full URL for Live Server compatibility
    const endpoint = 'http://localhost:3000/api/leetcode';

    const query = {
        operationName: "recentAcSubmissions",
        variables: {
            username: username,
            limit: limit
        },
        query: `query recentAcSubmissions($username: String!, $limit: Int!) {
            recentAcSubmissionList(username: $username, limit: $limit) {
                id
                title
                titleSlug
                timestamp
                lang
            }
        }`
    };

    try {
        const response = await fetch(endpoint, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(query)
        });

        if (!response.ok) {
            throw new Error(`HTTP error! Status: ${response.status}`);
        }

        const data = await response.json();

        if (data.errors) {
            throw new Error(`GraphQL Error: ${data.errors[0].message}`);
        }

        return data.data.recentAcSubmissionList;
    } catch (error) {
        console.error('Error fetching LeetCode data:', error);
        throw error;
    }
}

// Fetch Skill Stats (Tag-based problem counts)
async function fetchLeetCodeSkillStats(username) {
    const endpoint = 'http://localhost:3000/api/leetcode';

    const query = {
        operationName: "skillStats",
        variables: {
            username: username
        },
        query: `query skillStats($username: String!) {
            matchedUser(username: $username) {
                tagProblemCounts {
                    advanced {
                        tagName
                        tagSlug
                        problemsSolved
                    }
                    intermediate {
                        tagName
                        tagSlug
                        problemsSolved
                    }
                    fundamental {
                        tagName
                        tagSlug
                        problemsSolved
                    }
                }
            }
        }`
    };

    try {
        const response = await fetch(endpoint, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(query)
        });

        if (!response.ok) {
            throw new Error(`HTTP error! Status: ${response.status}`);
        }

        const data = await response.json();

        if (data.errors) {
            throw new Error(`GraphQL Error: ${data.errors[0].message}`);
        }

        return data.data.matchedUser.tagProblemCounts;
    } catch (error) {
        console.error('Error fetching skill stats:', error);
        throw error;
    }
}

// Fetch actual solved count (accurate total)
async function fetchLeetCodeSolvedCount(username) {
    const endpoint = 'http://localhost:3000/api/leetcode';

    const query = {
        operationName: "userProblemsSolved",
        variables: {
            username: username
        },
        query: `query userProblemsSolved($username: String!) {
            matchedUser(username: $username) {
                submitStatsGlobal {
                    acSubmissionNum {
                        difficulty
                        count
                    }
                }
            }
        }`
    };

    try {
        const response = await fetch(endpoint, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(query)
        });

        if (!response.ok) {
            throw new Error(`HTTP error! Status: ${response.status}`);
        }

        const data = await response.json();

        if (data.errors) {
            throw new Error(`GraphQL Error: ${data.errors[0].message}`);
        }

        // Find the "All" difficulty which gives total count
        const stats = data.data.matchedUser.submitStatsGlobal.acSubmissionNum;
        const allStats = stats.find(s => s.difficulty === 'All');
        return allStats ? allStats.count : 0;
    } catch (error) {
        console.error('Error fetching solved count:', error);
        throw error;
    }
}

// Fetch Language Stats (Problems solved per language)
async function fetchLeetCodeLanguageStats(username) {
    const endpoint = 'http://localhost:3000/api/leetcode';

    const query = {
        operationName: "languageStats",
        variables: {
            username: username
        },
        query: `query languageStats($username: String!) {
            matchedUser(username: $username) {
                languageProblemCount {
                    languageName
                    problemsSolved
                }
            }
        }`
    };

    try {
        const response = await fetch(endpoint, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(query)
        });

        if (!response.ok) {
            throw new Error(`HTTP error! Status: ${response.status}`);
        }

        const data = await response.json();

        if (data.errors) {
            throw new Error(`GraphQL Error: ${data.errors[0].message}`);
        }

        return data.data.matchedUser.languageProblemCount;
    } catch (error) {
        console.error('Error fetching language stats:', error);
        throw error;
    }
}

// Fetch GeeksforGeeks Submissions
async function fetchGFGSubmissions(handle) {
    const endpoint = 'http://localhost:3000/api/gfg';

    try {
        const response = await fetch(endpoint, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ handle: handle })
        });

        if (!response.ok) {
            throw new Error(`HTTP error! Status: ${response.status}`);
        }

        const data = await response.json();
        return data;
    } catch (error) {
        console.error('Error fetching GFG submissions:', error);
        throw error;
    }
}

// Example usage
async function displayRecentSubmissions(username) {
    try {
        const submissions = await fetchLeetCodeRecentSubmissions(username, 15);

        console.log(`Recent AC Submissions for ${username}:`);
        console.log('='.repeat(50));

        submissions.forEach((submission, index) => {
            const date = new Date(submission.timestamp * 1000);
            console.log(`${index + 1}. ${submission.title}`);
            console.log(`   Slug: ${submission.titleSlug}`);
            console.log(`   Solved: ${date.toLocaleDateString()} ${date.toLocaleTimeString()}`);
            console.log('-'.repeat(50));
        });

        return submissions;
    } catch (error) {
        console.error('Failed to display submissions:', error);
    }
}

// Call with your username
// displayRecentSubmissions('8UAkiuj84c');
