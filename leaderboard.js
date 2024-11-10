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

    async updateScore(walletAddress, gameResult) {
        if (!walletAddress) {
            console.error('Invalid wallet address');
            return;
        }

        console.log(`Updating score for ${walletAddress} with result: ${gameResult}`);

        try {
            // First try to get existing record
            const { data: existingRecord, error: fetchError } = await supabase
                .from('leaderboard')
                .select('*')
                .eq('username', walletAddress)
                .single();
                
            if (fetchError && fetchError.code !== 'PGRST116') {
                throw fetchError;
            }

            // Prepare the record
            const record = {
                username: walletAddress,
                wins: (existingRecord?.wins || 0) + (gameResult === 'win' ? 1 : 0),
                losses: (existingRecord?.losses || 0) + (gameResult === 'loss' ? 1 : 0),
                draws: (existingRecord?.draws || 0) + (gameResult === 'draw' ? 1 : 0),
                totalGames: (existingRecord?.totalGames || 0) + 1,
                points: (existingRecord?.points || 0) + (gameResult === 'win' ? 3 : gameResult === 'draw' ? 1 : 0)
            };

            console.log('Upserting record:', record);

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
                    <td>${this.formatAddress(player.username)}</td>
                    <td>${player.points}</td>
                    <td>${player.wins}/${player.losses}/${player.draws}</td>
                    <td>${player.totalGames}</td>
                </tr>
            `).join('');
        } catch (error) {
            console.error('Error displaying leaderboard:', error);
        }
    }

    formatAddress(address) {
        if (!address) return '';
        return `${address.slice(0, 4)}...${address.slice(-4)}`;
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

// Wallet connection handling
async function connectWallet() {
    try {
        if (!window.solana || !window.solana.isPhantom) {
            alert('Please install Phantom Wallet to play!');
            window.open('https://phantom.app/', '_blank');
            return;
        }

        const response = await window.solana.connect();
        const walletAddress = response.publicKey.toString();
        
        console.log('Connected wallet:', walletAddress);
        localStorage.setItem('currentPlayer', walletAddress);
        
        // Update UI
        document.getElementById('connect-wallet').style.display = 'none';
        const addressDisplay = document.getElementById('wallet-address');
        addressDisplay.style.display = 'block';
        addressDisplay.textContent = `Connected: ${walletAddress.slice(0, 4)}...${walletAddress.slice(-4)}`;
        
        // Show difficulty screen
        const difficultyScreen = document.getElementById('difficulty-screen');
        if (difficultyScreen) {
            difficultyScreen.style.display = 'flex';
        }

        // Update status
        const statusElement = document.getElementById('status');
        if (statusElement) {
            statusElement.textContent = 'Select difficulty to play';
        }

        return walletAddress;
    } catch (error) {
        console.error('Error connecting wallet:', error);
        alert('Failed to connect wallet. Please try again.');
    }
}

// Initialize wallet handling
function initializeWalletConnection() {
    const connectButton = document.getElementById('connect-wallet');
    const difficultyScreen = document.getElementById('difficulty-screen');
    
    if (!connectButton || !difficultyScreen) {
        console.error('Missing required elements for wallet connection');
        return;
    }

    connectButton.onclick = async () => {
        await connectWallet();
        
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
    };
}

// Update game result
window.updateGameResult = function(winner) {
    const currentPlayer = localStorage.getItem('currentPlayer');
    if (!currentPlayer) {
        console.warn('No wallet address found');
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
    console.log('Initializing leaderboard and wallet connection...');
    const manager = new LeaderboardManager();
    await manager.loadLeaderboard();
    initializeWalletConnection();
    
    // Check if wallet is already connected
    const savedAddress = localStorage.getItem('currentPlayer');
    if (savedAddress) {
        document.getElementById('connect-wallet').style.display = 'none';
        const addressDisplay = document.getElementById('wallet-address');
        addressDisplay.style.display = 'block';
        addressDisplay.textContent = `Connected: ${savedAddress.slice(0, 4)}...${savedAddress.slice(-4)}`;
        
        const difficultyScreen = document.getElementById('difficulty-screen');
        if (difficultyScreen) {
            difficultyScreen.style.display = 'flex';
        }
    }
});
