// Initialize Supabase client
const supabaseUrl = 'https://roxwocgknkiqnsgiojgz.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJveHdvY2drbmtpcW5zZ2lvamd6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzA3NjMxMTIsImV4cCI6MjA0NjMzOTExMn0.NbLMZom-gk7XYGdV4MtXYcgR8R1s8xthrIQ0hpQfx9Y';

// Using global Supabase from CDN
const supabase = createClient(supabaseUrl, supabaseKey, {
    auth: {
        persistSession: false
    }
});

// Initialize singleton instance
let leaderboardManagerInstance = null;

class LeaderboardManager {
    constructor() {
        if (leaderboardManagerInstance) {
            return leaderboardManagerInstance;
        }
        leaderboardManagerInstance = this;
        this.loadLeaderboard();
    }

    async loadLeaderboard() {
        try {
            const { data, error } = await supabase
                .from('leaderboard')
                .select('*')
                .order('points', { ascending: false });

            if (error) {
                throw error;
            }
            
            this.leaderboardData = data || [];
            this.displayLeaderboard();
        } catch (error) {
            console.error('Error loading leaderboard:', error);
            // Fallback to localStorage
            const localData = localStorage.getItem('chessLeaderboard');
            this.leaderboardData = localData ? JSON.parse(localData) : [];
            this.displayLeaderboard();
        }
    }

    async updateScore(username, gameResult) {
        if (!username) {
            console.warn('No username provided');
            return;
        }

        console.log(`Updating score for ${username} with result: ${gameResult}`);

        try {
            // Get existing record
            const { data: existingRecord, error: fetchError } = await supabase
                .from('leaderboard')
                .select('*')
                .eq('username', username)
                .single();

            if (fetchError && fetchError.code !== 'PGRST116') {
                console.error('Fetch error:', fetchError);
            }

            let record = existingRecord || {
                username,
                wins: 0,
                losses: 0,
                draws: 0,
                totalGames: 0,
                points: 0
            };

            // Update record
            record.totalGames++;
            switch (gameResult) {
                case 'win':
                    record.wins++;
                    record.points += 3;
                    break;
                case 'loss':
                    record.losses++;
                    break;
                case 'draw':
                    record.draws++;
                    record.points += 1;
                    break;
            }

            // Save to localStorage as backup
            let localLeaderboard = [];
            try {
                const localData = localStorage.getItem('chessLeaderboard');
                localLeaderboard = localData ? JSON.parse(localData) : [];
                const existingIndex = localLeaderboard.findIndex(p => p.username === username);
                if (existingIndex >= 0) {
                    localLeaderboard[existingIndex] = record;
                } else {
                    localLeaderboard.push(record);
                }
                localStorage.setItem('chessLeaderboard', JSON.stringify(localLeaderboard));
            } catch (e) {
                console.error('Error updating localStorage:', e);
            }

            // Update Supabase
            const { error: upsertError } = await supabase
                .from('leaderboard')
                .upsert(record);

            if (upsertError) {
                console.error('Upsert error:', upsertError);
            }

            // Reload leaderboard
            await this.loadLeaderboard();
            
        } catch (error) {
            console.error('Error updating score:', error);
        }
    }

    async getTopPlayers(limit = 10) {
        try {
            const { data, error } = await supabase
                .from('leaderboard')
                .select('*')
                .order('points', { ascending: false })
                .limit(limit);

            if (error) throw error;
            return data || [];
        } catch (error) {
            console.error('Error getting top players:', error);
            // Return localStorage data as fallback
            const localData = localStorage.getItem('chessLeaderboard');
            return localData ? JSON.parse(localData) : [];
        }
    }

    async displayLeaderboard() {
        const tbody = document.getElementById('leaderboard-body');
        if (!tbody) return;

        try {
            const topPlayers = await this.getTopPlayers();
            tbody.innerHTML = topPlayers.map((player, index) => `
                <tr>
                    <td>${index + 1}</td>
                    <td>${player.username}</td>
                    <td>${player.points}</td>
                    <td>${player.wins}/${player.losses}/${player.draws}</td>
                    <td>${player.totalGames}</td>
                </tr>
            `).join('');
        } catch (error) {
            console.error('Error displaying leaderboard:', error);
        }
    }
}

// Add styles
const styleSheet = document.createElement('style');
styleSheet.textContent = `
    .leaderboard-section {
        margin: 20px auto;
        padding: 20px;
        background: rgba(0, 0, 0, 0.7);
        border-radius: 8px;
        border: 1px solid rgba(50, 205, 50, 0.3);
        color: white;
        max-width: 800px;
    }

    .leaderboard-container {
        width: 100%;
        margin: 0 auto;
    }

    .leaderboard-title {
        color: #ff0000;
        text-shadow: 0 0 5px #32CD32,
                     0 0 10px #32CD32,
                     0 0 15px #32CD32;
        margin-bottom: 20px;
        font-size: 2em;
    }

    .username-input {
        margin-bottom: 20px;
    }

    .username-input input {
        padding: 8px 12px;
        border: 1px solid rgba(50, 205, 50, 0.3);
        background: rgba(0, 0, 0, 0.5);
        color: white;
        border-radius: 4px;
        margin-right: 10px;
        width: 200px;
    }

    .username-input button {
        background: rgba(50, 205, 50, 0.2);
        color: white;
        border: 1px solid rgba(50, 205, 50, 0.3);
        padding: 8px 16px;
        border-radius: 4px;
        cursor: pointer;
    }

    .leaderboard-table {
        overflow-x: auto;
    }

    .leaderboard-table table {
        width: 100%;
        border-collapse: collapse;
        color: white;
    }

    .leaderboard-table th,
    .leaderboard-table td {
        padding: 10px;
        text-align: center;
        border: 1px solid rgba(50, 205, 50, 0.2);
    }

    .leaderboard-table th {
        background: rgba(50, 205, 50, 0.2);
    }

    .leaderboard-table tr:nth-child(even) {
        background: rgba(50, 205, 50, 0.1);
    }
`;
document.head.appendChild(styleSheet);

// Create and add leaderboard UI components
function initializeLeaderboard() {
    // Create leaderboard container
    const leaderboardSection = document.createElement('div');
    leaderboardSection.className = 'leaderboard-section';
    leaderboardSection.innerHTML = `
        <div class="leaderboard-container">
            <h2 class="leaderboard-title">Top Players</h2>
            <div class="username-input">
                <input type="text" id="username-input" placeholder="Enter your username" maxlength="20">
                <button id="username-submit" class="difficulty-btn">Set Username</button>
            </div>
            <div class="leaderboard-table">
                <table>
                    <thead>
                        <tr>
                            <th>Rank</th>
                            <th>Player</th>
                            <th>Points</th>
                            <th>W/L/D</th>
                            <th>Games</th>
                        </tr>
                    </thead>
                    <tbody id="leaderboard-body">
                    </tbody>
                </table>
            </div>
        </div>
    `;

    // Add leaderboard to the game section
    const gameSection = document.querySelector('.game-section');
    if (gameSection) {
        gameSection.insertBefore(leaderboardSection, gameSection.firstChild);
    }
}

// Initialize username handling
function initializeUsernameHandling() {
    const usernameInput = document.getElementById('username-input');
    const usernameSubmit = document.getElementById('username-submit');
    const difficultyScreen = document.getElementById('difficulty-screen');
    
    // Hide difficulty screen initially
    if (difficultyScreen) {
        difficultyScreen.style.display = 'none';
    }

    // Load existing username if available
    const savedUsername = localStorage.getItem('currentPlayer');
    if (savedUsername && usernameInput) {
        usernameInput.value = savedUsername;
        usernameInput.disabled = true;
        if (usernameSubmit) {
            usernameSubmit.disabled = true;
        }
        if (difficultyScreen) {
            difficultyScreen.style.display = 'flex';
        }
    }

    // Handle username submission
    if (usernameSubmit) {
        usernameSubmit.addEventListener('click', () => {
            const username = usernameInput.value.trim();
            if (username) {
                localStorage.setItem('currentPlayer', username);
                usernameInput.disabled = true;
                usernameSubmit.disabled = true;
                
                // Show difficulty screen after username is set
                if (difficultyScreen) {
                    difficultyScreen.style.display = 'flex';
                }
            }
        });
    }
}

// Update game result and leaderboard
function updateGameResult(winner) {
    const currentPlayer = localStorage.getItem('currentPlayer');
    if (!currentPlayer) {
        console.warn('No player username found');
        return;
    }

    console.log(`Game ended with winner: ${winner}, current player: ${currentPlayer}`);

    const manager = new LeaderboardManager();
    if (winner === 'draw') {
        manager.updateScore(currentPlayer, 'draw');
    } else if (winner === 'blue') {
        manager.updateScore(currentPlayer, 'win');
    } else {
        manager.updateScore(currentPlayer, 'loss');
    }
}

// Initialize everything when DOM is loaded
document.addEventListener('DOMContentLoaded', async () => {
    initializeLeaderboard();
    initializeUsernameHandling();
    
    // Ensure leaderboard is loaded
    const manager = new LeaderboardManager();
    await manager.loadLeaderboard();
});

export {
    updateGameResult,
    LeaderboardManager
};
