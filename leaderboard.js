const supabase = window.gameDatabase;

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
        if (!username || username === '0') {
            console.error('Invalid username');
            return;
        }

        console.log(`Updating score for ${username} with result: ${gameResult}`);

        try {
            // First try to get existing record
            const { data: existingRecord, error: fetchError } = await supabase
                .from('leaderboard')
                .select('*')
                .eq('username', username)
                .single();
                
            if (fetchError && fetchError.code !== 'PGRST116') {
                throw fetchError;
            }

            // Prepare the record
            const record = {
                username,
                wins: (existingRecord?.wins || 0) + (gameResult === 'win' ? 1 : 0),
                losses: (existingRecord?.losses || 0) + (gameResult === 'loss' ? 1 : 0),
                draws: (existingRecord?.draws || 0) + (gameResult === 'draw' ? 1 : 0),
                totalGames: (existingRecord?.totalGames || 0) + 1,
                points: (existingRecord?.points || 0) + (gameResult === 'win' ? 3 : gameResult === 'draw' ? 1 : 0)
            };

            console.log('Upserting record:', record);

            // Upsert the record
            const { error: upsertError } = await supabase
                .from('leaderboard')
                .upsert(record, { 
                    onConflict: 'username',
                    returning: 'minimal'
                });

            if (upsertError) throw upsertError;

            console.log('Successfully updated leaderboard');
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

    usernameSubmit.onclick = () => {
        const username = usernameInput.value.trim();
        if (username && username.length >= 2) {
            console.log(`Setting username: ${username}`);
            localStorage.setItem('currentPlayer', username);
            usernameInput.disabled = true;
            usernameSubmit.disabled = true;
            // Show difficulty screen after username is set
            difficultyScreen.style.display = 'flex';
            const easyBtn = document.getElementById('easy-mode');
            const hardBtn = document.getElementById('hard-mode');
            const startBtn = document.getElementById('start-game');
            if (easyBtn && hardBtn && startBtn) {
                easyBtn.addEventListener('click', () => {
                    easyBtn.classList.add('selected');
                    hardBtn.classList.remove('selected');
                    startBtn.disabled = false;
                    window.gameDifficulty = 'easy';
                });
                hardBtn.addEventListener('click', () => {
                    hardBtn.classList.add('selected');
                    easyBtn.classList.remove('selected');
                    startBtn.disabled = false;
                    window.gameDifficulty = 'hard';
                });
            }
        } else {
            alert('Please enter a username with at least 2 characters');
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
