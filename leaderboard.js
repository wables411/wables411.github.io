import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.39.1/+esm'

// Initialize Supabase client
const supabaseUrl = 'https://roxwocgknkiqnsgiojgz.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJveHdvY2drbmtpcW5zZ2lvamd6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzA3NjMxMTIsImV4cCI6MjA0NjMzOTExMn0.NbLMZom-gk7XYGdV4MtXYcgR8R1s8xthrIQ0hpQfx9Y'
const supabase = createClient(supabaseUrl, supabaseKey)

class LeaderboardManager {
    constructor() {
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
            this.leaderboardData = [];
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
            const { data: existingRecord } = await supabase
                .from('leaderboard')
                .select('*')
                .eq('username', username)
                .single();

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

            // Upsert the record
            const { error } = await supabase
                .from('leaderboard')
                .upsert(record, {
                    onConflict: 'username',
                    returning: 'minimal'
                });

            if (error) throw error;
            await this.loadLeaderboard(); // Refresh display
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
            return [];
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

// Initialize leaderboard manager
const leaderboardManager = new LeaderboardManager();

// Update game result and leaderboard
function updateGameResult(winner) {
    const currentPlayer = localStorage.getItem('currentPlayer');
    if (!currentPlayer) {
        console.warn('No player username found');
        return;
    }

    console.log(`Game ended with winner: ${winner}, current player: ${currentPlayer}`);

    if (winner === 'draw') {
        leaderboardManager.updateScore(currentPlayer, 'draw');
    } else if (winner === 'blue') {
        leaderboardManager.updateScore(currentPlayer, 'win');
    } else {
        leaderboardManager.updateScore(currentPlayer, 'loss');
    }
}

// Initialize everything when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    initializeLeaderboard();
    initializeUsernameHandling();
});

export {
    updateGameResult,
    leaderboardManager
};
