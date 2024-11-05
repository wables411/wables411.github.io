import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client
const supabaseUrl = 'https://roxwocgknkiqnsgiojgz.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJveHdvY2drbmtpcW5zZ2lvamd6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzA3NjMxMTIsImV4cCI6MjA0NjMzOTExMn0.NbLMZom-gk7XYGdV4MtXYcgR8R1s8xthrIQ0hpQfx9Y';
const supabase = createClient(supabaseUrl, supabaseKey);

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
                console.error('Error fetching record:', fetchError);
                return;
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
            try {
                let localLeaderboard = JSON.parse(localStorage.getItem('chessLeaderboard') || '[]');
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
                console.error('Error upserting record:', upsertError);
                return;
            }

            await this.loadLeaderboard();
        } catch (error) {
            console.error('Error updating score:', error);
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
            const localData = localStorage.getItem('chessLeaderboard');
            return localData ? JSON.parse(localData).slice(0, limit) : [];
        }
    }
}

function initializeUserHandling() {
    const usernameInput = document.getElementById('username-input');
    const usernameSubmit = document.getElementById('username-submit');
    const difficultyScreen = document.getElementById('difficulty-screen');

    // Hide difficulty screen initially if no username is set
    if (difficultyScreen) {
        const savedUsername = localStorage.getItem('currentPlayer');
        difficultyScreen.style.display = savedUsername ? 'flex' : 'none';
    }

    // Load existing username if available
    if (usernameInput) {
        const savedUsername = localStorage.getItem('currentPlayer');
        if (savedUsername) {
            usernameInput.value = savedUsername;
            usernameInput.disabled = true;
            if (usernameSubmit) {
                usernameSubmit.disabled = true;
            }
        }
    }

    // Handle username submission
    if (usernameSubmit) {
        usernameSubmit.addEventListener('click', () => {
            const username = usernameInput?.value.trim();
            if (username) {
                localStorage.setItem('currentPlayer', username);
                usernameInput.disabled = true;
                usernameSubmit.disabled = true;

                if (difficultyScreen) {
                    difficultyScreen.style.display = 'flex';
                }
            }
        });
    }
}

// Update game result
function updateGameResult(winner) {
    const currentPlayer = localStorage.getItem('currentPlayer');
    if (!currentPlayer) {
        console.warn('No player username found');
        return;
    }

    console.log(`Game ended with winner: ${winner}, current player: ${currentPlayer}`);

    if (leaderboardManagerInstance) {
        if (winner === 'draw') {
            leaderboardManagerInstance.updateScore(currentPlayer, 'draw');
        } else if (winner === 'blue') {
            leaderboardManagerInstance.updateScore(currentPlayer, 'win');
        } else {
            leaderboardManagerInstance.updateScore(currentPlayer, 'loss');
        }
    }
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', async () => {
    const manager = new LeaderboardManager();
    await manager.loadLeaderboard();
    initializeUserHandling();
});

export {
    updateGameResult,
    LeaderboardManager
};
