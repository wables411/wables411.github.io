// Replace your entire leaderboard.js with this updated version
const supabase = window.supabase.createClient(
    'https://roxwocgknkiqnsgiojgz.supabase.co',
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJveHdvY2drbmtpcW5zZ2lvamd6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzA3NjMxMTIsImV4cCI6MjA0NjMzOTExMn0.NbLMZom-gk7XYGdV4MtXYcgR8R1s8xthrIQ0hpQfx9Y'
);

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
            console.log('Loading leaderboard...');
            const { data, error } = await supabase
                .from('leaderboard')
                .select('*')
                .order('points', { ascending: false });

            if (error) {
                console.error('Supabase error loading leaderboard:', error);
                throw error;
            }
            
            console.log('Leaderboard data loaded:', data);
            this.leaderboardData = data || [];
            await this.displayLeaderboard();
        } catch (error) {
            console.error('Error loading leaderboard:', error);
        }
    }

    async updateScore(username, gameResult) {
        if (!username) {
            console.error('No username provided for score update');
            return;
        }

        console.log(`Updating score for ${username} with result: ${gameResult}`);

        try {
            // First fetch existing record
            const { data: existingRecord, error: fetchError } = await supabase
                .from('leaderboard')
                .select('*')
                .eq('username', username)
                .single();

            if (fetchError && fetchError.code !== 'PGRST116') {
                console.error('Error fetching record:', fetchError);
                return;
            }

            // Create or update record
            let record = existingRecord || {
                username,
                wins: 0,
                losses: 0,
                draws: 0,
                totalGames: 0,
                points: 0
            };

            // Update stats
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

            console.log('Upserting record:', record);

            // Upsert the record
            const { data: upsertData, error: upsertError } = await supabase
                .from('leaderboard')
                .upsert(record)
                .select();

            if (upsertError) {
                console.error('Error upserting record:', upsertError);
                return;
            }

            console.log('Successfully upserted record:', upsertData);
            
            // Reload leaderboard
            await this.loadLeaderboard();
            
        } catch (error) {
            console.error('Error updating score:', error);
        }
    }

    async displayLeaderboard() {
        const tbody = document.getElementById('leaderboard-body');
        if (!tbody) {
            console.error('Leaderboard tbody element not found');
            return;
        }

        try {
            const topPlayers = await this.getTopPlayers();
            console.log('Displaying top players:', topPlayers);
            
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

            if (error) {
                console.error('Error getting top players:', error);
                throw error;
            }
            
            return data || [];
        } catch (error) {
            console.error('Error getting top players:', error);
            return [];
        }
    }
}

// Initialize username handling
function initializeUsernameHandling() {
    const usernameInput = document.getElementById('username-input');
    const usernameSubmit = document.getElementById('username-submit');
    const difficultyScreen = document.getElementById('difficulty-screen');
    
    if (!usernameInput || !usernameSubmit || !difficultyScreen) {
        console.error('Missing required elements for username handling');
        return;
    }

    difficultyScreen.style.display = 'none';

    usernameSubmit.onclick = () => {
        const username = usernameInput.value.trim();
        if (username) {
            console.log(`Setting username: ${username}`);
            localStorage.setItem('currentPlayer', username);
            usernameInput.disabled = true;
            usernameSubmit.disabled = true;
            difficultyScreen.style.display = 'flex';
        }
    };
}

// Update game result
window.updateGameResult = function(winner) {
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
    } else {
        console.error('LeaderboardManager instance not found');
    }
};

// Initialize everything when DOM is loaded
document.addEventListener('DOMContentLoaded', async () => {
    console.log('Initializing leaderboard...');
    const manager = new LeaderboardManager();
    await manager.loadLeaderboard();
    initializeUsernameHandling();
});
