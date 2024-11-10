const supabase = window.gameDatabase;

let leaderboardManagerInstance = null;

// Function to check if a string is a valid Solana wallet address
function isValidSolanaAddress(address) {
    // Solana addresses are 44 characters long and base58 encoded
    return /^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(address);
}

class WalletConnector {
    constructor() {
        this.supportedWallets = {
            phantom: window.solana,
            solflare: window.solflare,
            magicEden: window.magicEden
        };
    }

    async connectWallet(walletType) {
        try {
            const wallet = this.supportedWallets[walletType];
            
            if (!wallet) {
                const walletUrls = {
                    phantom: 'https://phantom.app/',
                    solflare: 'https://solflare.com/',
                    magicEden: 'https://magiceden.io/'
                };
                
                window.open(walletUrls[walletType], '_blank');
                throw new Error(`Please install ${walletType} wallet`);
            }

            let response;
            if (walletType === 'solflare') {
                if (!wallet.isConnected) {
                    response = await wallet.connect();
                }
                response = { publicKey: wallet.publicKey };
            } else {
                response = await wallet.connect();
            }

            const walletAddress = response.publicKey.toString();
            console.log(`Connected ${walletType} wallet:`, walletAddress);
            
            // Save wallet info
            localStorage.setItem('currentPlayer', walletAddress);
            localStorage.setItem('walletType', walletType);
            
            // Update UI
            this.updateWalletUI(walletAddress);
            
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
            console.error(`Error connecting ${walletType} wallet:`, error);
            alert(`Failed to connect ${walletType} wallet. Please try again.`);
            throw error;
        }
    }

    updateWalletUI(walletAddress) {
        // Hide all connect buttons
        document.querySelectorAll('.wallet-btn').forEach(btn => {
            btn.style.display = 'none';
        });
        
        // Show wallet address
        const addressDisplay = document.getElementById('wallet-address');
        if (addressDisplay) {
            addressDisplay.style.display = 'block';
            addressDisplay.textContent = `Connected: ${walletAddress.slice(0, 4)}...${walletAddress.slice(-4)}`;
        }
    }

    async reconnectWallet() {
        const savedWalletType = localStorage.getItem('walletType');
        const savedAddress = localStorage.getItem('currentPlayer');
        
        if (savedWalletType && savedAddress) {
            const wallet = this.supportedWallets[savedWalletType];
            if (wallet) {
                try {
                    if (savedWalletType === 'solflare') {
                        if (!wallet.isConnected) {
                            await wallet.connect();
                        }
                    }
                    this.updateWalletUI(savedAddress);
                    return true;
                } catch (error) {
                    console.error('Error reconnecting wallet:', error);
                    localStorage.removeItem('currentPlayer');
                    localStorage.removeItem('walletType');
                }
            }
        }
        return false;
    }
}

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
        if (!walletAddress || !isValidSolanaAddress(walletAddress)) {
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
            
            // Filter wallet addresses on the client side instead
            const validData = data ? data.filter(player => 
                isValidSolanaAddress(player.username)
            ) : [];
            
            return validData;
        } catch (error) {
            console.error('Error getting top players:', error);
            return [];
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
}

// Initialize wallet connector
const walletConnector = new WalletConnector();

function adjustColor(color, percent) {
    const num = parseInt(color.replace('#', ''), 16);
    const amt = Math.round(2.55 * percent);
    const R = (num >> 16) + amt;
    const G = (num >> 8 & 0x00FF) + amt;
    const B = (num & 0x0000FF) + amt;
    return '#' + (
        0x1000000 +
        (R < 255 ? R < 1 ? 0 : R : 255) * 0x10000 +
        (G < 255 ? G < 1 ? 0 : G : 255) * 0x100 +
        (B < 255 ? B < 1 ? 0 : B : 255)
    ).toString(16).slice(1);
}

function initializeWalletConnection() {
    // Create wallet buttons container
    const walletButtons = document.createElement('div');
    walletButtons.className = 'wallet-buttons';

    // Create buttons for each wallet
    const wallets = [
        { name: 'Phantom', type: 'phantom', color: '#AB9FF2' },
        { name: 'Solflare', type: 'solflare', color: '#FC822B' },
        { name: 'Magic Eden', type: 'magicEden', color: '#E42575' }
    ];

    wallets.forEach(wallet => {
        const button = document.createElement('button');
        button.className = 'wallet-btn';
        button.textContent = `Connect ${wallet.name}`;
        button.style.background = `linear-gradient(45deg, ${wallet.color}, ${adjustColor(wallet.color, 20)})`;
        button.onclick = () => walletConnector.connectWallet(wallet.type);
        walletButtons.appendChild(button);
    });

    // Add wallet address display
    const addressDisplay = document.createElement('div');
    addressDisplay.id = 'wallet-address';
    addressDisplay.className = 'wallet-address';
    addressDisplay.style.display = 'none';

    // Replace old wallet connection UI
    const walletConnection = document.querySelector('.wallet-connection');
    if (walletConnection) {
        walletConnection.innerHTML = '';
        walletConnection.appendChild(walletButtons);
        walletConnection.appendChild(addressDisplay);
    }

    // Try to reconnect existing wallet
    walletConnector.reconnectWallet();
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
});
