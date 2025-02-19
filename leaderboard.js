// Initialize core Supabase reference
const supabase = window.gameDatabase;
let leaderboardManagerInstance = null;

// Validation functions
function isValidSolanaAddress(address) {
    return /^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(address);
}

function isValidEVMAddress(address) {
    return /^0x[a-fA-F0-9]{40}$/.test(address);
}

function isValidWalletAddress(address, chainType) {
    return chainType === 'evm' ? isValidEVMAddress(address) : isValidSolanaAddress(address);
}

const WALLET_CONNECT_TIMEOUT = 30000; // 30 seconds
const SANKO_CHAIN_ID = '0x7CC'; // 1996 in hex
const SANKO_CHAIN_CONFIG = {
    chainId: SANKO_CHAIN_ID,
    chainName: 'Sanko',
    nativeCurrency: {
        name: 'DMT',
        symbol: 'DMT',
        decimals: 18
    },
    rpcUrls: ['https://mainnet.sanko.xyz'],
    blockExplorerUrls: ['https://explorer.sanko.xyz/']
};

class LeaderboardManager {
    constructor() {
        if (leaderboardManagerInstance) {
            return leaderboardManagerInstance;
        }
        leaderboardManagerInstance = this;
        this.loadLeaderboard();
        this.setupRealtimeSubscription();
    }

    setupRealtimeSubscription() {
        this.subscription = supabase
            .channel('public:leaderboard')
            .on('postgres_changes', 
                { event: '*', schema: 'public', table: 'leaderboard' },
                () => this.loadLeaderboard()
            )
            .subscribe();
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
        const chainType = localStorage.getItem('chainType');
        console.log('Attempting to update score:', {
            walletAddress,
            chainType,
            gameResult
        });
    
        if (!walletAddress) {
            console.error('No wallet address provided');
            return;
        }
    
        // Convert EVM addresses to lowercase for consistency
        if (chainType === 'evm') {
            walletAddress = walletAddress.toLowerCase();
        }
    
        try {
            // First get existing record
            const { data: existingRecord } = await supabase
                .from('leaderboard')
                .select('*')
                .eq('username', walletAddress)
                .maybeSingle();
    
            console.log('Existing record:', existingRecord);
    
            // Initialize counts
            const wins = (existingRecord?.wins || 0) + (gameResult === 'win' ? 1 : 0);
            const losses = (existingRecord?.losses || 0) + (gameResult === 'loss' ? 1 : 0);
            const draws = (existingRecord?.draws || 0) + (gameResult === 'draw' ? 1 : 0);
            const total_games = wins + losses + draws;
            const points = (existingRecord?.points || 0) + (
                gameResult === 'win' ? 3 : 
                gameResult === 'draw' ? 1 : 0
            );
    
            // Prepare the record
            const record = {
                username: walletAddress,
                chain_type: chainType || 'evm',
                wins,
                losses, 
                draws,
                total_games,
                points,
                updated_at: new Date().toISOString()
            };
    
            console.log('Upserting record:', record);
    
            const { error: upsertError } = await supabase
                .from('leaderboard')
                .upsert(record, {
                    onConflict: 'username'
                });
    
            if (upsertError) throw upsertError;
    
            console.log('Successfully updated leaderboard');
            await this.loadLeaderboard();
    
        } catch (error) {
            console.error('Error updating score:', error);
            console.error('Error details:', {
                message: error.message,
                details: error.details,
                hint: error.hint
            });
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
            
            // Filter valid addresses for both chains
            const validData = data ? data.filter(player => {
                if (player.chain_type === 'evm') {
                    return isValidEVMAddress(player.username);
                } else {
                    return isValidSolanaAddress(player.username);
                }
            }) : [];
            
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
            
            tbody.innerHTML = topPlayers.map((player, index) => {
                const chainIndicator = player.chain_type === 'evm' ? '[DMT]' : '[SOL]';
                const username = player.chain_type === 'evm' ? 
                    player.username.toLowerCase() : player.username;
                    
                return `
                    <tr>
                        <td>${index + 1}</td>
                        <td>${chainIndicator} ${this.formatAddress(username)}</td>
                        <td>${player.points}</td>
                        <td>${player.wins}/${player.losses}/${player.draws}</td>
                        <td>${player.total_games}</td>
                    </tr>
                `;
            }).join('');
        } catch (error) {
            console.error('Error displaying leaderboard:', error);
        }
    }

    formatAddress(address) {
        if (!address) return '';
        return `${address.slice(0, 4)}...${address.slice(-4)}`;
    }
}

class WalletConnector {
    constructor() {
        this.supportedWallets = {
            phantom: window.solana,
            solflare: window.solflare,
            magicEden: window.magicEden
        };
        // Handle EVM provider separately
        this.evmProvider = window.ethereum;
    }

    async connectWallet(walletType) {
        try {
            if (walletType === 'sanko') {
                return await this.connectEVMWallet();
            } else {
                return await this.connectSolanaWallet(walletType);
            }
        } catch (error) {
            console.error(`Error connecting ${walletType} wallet:`, error);
            alert(`Failed to connect ${walletType} wallet. Please try again.`);
            throw error;
        }
    }

    async connectEVMWallet() {
        if (!this.evmProvider) {
            window.open('https://tools.sanko.xyz/', '_blank');
            throw new Error('Please install a Web3 wallet that supports Sanko chain');
        }

        try {
            // Request account access
            const accounts = await this.evmProvider.request({ 
                method: 'eth_requestAccounts' 
            });

            // Check if we're on the correct chain
            const chainId = await this.evmProvider.request({ 
                method: 'eth_chainId' 
            });

            if (chainId !== SANKO_CHAIN_ID) {
                try {
                    // Try to switch to Sanko network
                    await this.evmProvider.request({
                        method: 'wallet_switchEthereumChain',
                        params: [{ chainId: SANKO_CHAIN_ID }],
                    });
                } catch (switchError) {
                    // If the chain hasn't been added, add it
                    if (switchError.code === 4902) {
                        await this.evmProvider.request({
                            method: 'wallet_addEthereumChain',
                            params: [SANKO_CHAIN_CONFIG],
                        });
                    } else {
                        throw switchError;
                    }
                }
            }

            const walletAddress = accounts[0];
            
            // Save wallet info
            localStorage.setItem('currentPlayer', walletAddress);
            localStorage.setItem('walletType', 'sanko');
            localStorage.setItem('chainType', 'evm');
            
            // Update UI
            this.updateWalletUI(walletAddress, 'sanko');
            
            // Setup EVM event listeners
            this.setupEVMEventListeners();

            return walletAddress;
        } catch (error) {
            console.error('EVM wallet connection error:', error);
            throw error;
        }
    }

    async connectSolanaWallet(walletType) {
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
        
        // Save wallet info
        localStorage.setItem('currentPlayer', walletAddress);
        localStorage.setItem('walletType', walletType);
        localStorage.setItem('chainType', 'solana');
        
        // Update UI
        this.updateWalletUI(walletAddress, walletType);
        
        return walletAddress;
    }

    setupEVMEventListeners() {
        if (!this.evmProvider) return;

        this.evmProvider.on('accountsChanged', (accounts) => {
            if (accounts.length === 0) {
                this.disconnectWallet();
            } else {
                const currentWalletType = localStorage.getItem('walletType');
                if (currentWalletType === 'sanko') {
                    this.updateWalletUI(accounts[0], 'sanko');
                    localStorage.setItem('currentPlayer', accounts[0]);
                }
            }
        });

        this.evmProvider.on('chainChanged', (chainId) => {
            if (chainId !== SANKO_CHAIN_ID) {
                this.disconnectWallet();
                alert('Please switch to Sanko network');
            }
        });
    }

    updateWalletUI(walletAddress, walletType) {
        // Hide all connect buttons
        document.querySelectorAll('.wallet-btn').forEach(btn => {
            btn.style.display = 'none';
        });
        
        // Show wallet address with chain indicator
        const addressDisplay = document.getElementById('wallet-address');
        if (addressDisplay) {
            addressDisplay.style.display = 'block';
            const chainIndicator = walletType === 'sanko' ? '[DMT]' : '[SOL]';
            addressDisplay.textContent = `Connected ${chainIndicator}: ${this.formatAddress(walletAddress)}`;
        }

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
    }

    disconnectWallet() {
        localStorage.removeItem('currentPlayer');
        localStorage.removeItem('walletType');
        localStorage.removeItem('chainType');
        
        // Show all wallet buttons
        document.querySelectorAll('.wallet-btn').forEach(btn => {
            btn.style.display = 'block';
        });
        
        // Hide wallet address
        const addressDisplay = document.getElementById('wallet-address');
        if (addressDisplay) {
            addressDisplay.style.display = 'none';
        }

        // Hide difficulty screen
        const difficultyScreen = document.getElementById('difficulty-screen');
        if (difficultyScreen) {
            difficultyScreen.style.display = 'none';
        }

        // Update status
        const statusElement = document.getElementById('status');
        if (statusElement) {
            statusElement.textContent = 'Connect to play';
        }
    }

    formatAddress(address) {
        if (!address) return '';
        return `${address.slice(0, 4)}...${address.slice(-4)}`;
    }

    async reconnectWallet() {
        const savedWalletType = localStorage.getItem('walletType');
        const savedAddress = localStorage.getItem('currentPlayer');
        
        if (!savedWalletType || !savedAddress) return false;

        try {
            if (savedWalletType === 'sanko') {
                if (!this.evmProvider) return false;
                
                const accounts = await this.evmProvider.request({ 
                    method: 'eth_accounts' 
                });
                
                const chainId = await this.evmProvider.request({ 
                    method: 'eth_chainId' 
                });

                if (accounts.length > 0 && 
                    accounts[0].toLowerCase() === savedAddress.toLowerCase() && 
                    chainId === SANKO_CHAIN_ID) {
                    this.updateWalletUI(savedAddress, 'sanko');
                    this.setupEVMEventListeners();
                    return true;
                }
            } else {
                const wallet = this.supportedWallets[savedWalletType];
                if (!wallet) return false;

                if (savedWalletType === 'solflare') {
                    if (!wallet.isConnected) {
                        await wallet.connect();
                    }
                }
                this.updateWalletUI(savedAddress, savedWalletType);
                return true;
            }
        } catch (error) {
            console.error('Error reconnecting wallet:', error);
            this.disconnectWallet();
        }
        return false;
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
        { name: 'Magic Eden', type: 'magicEden', color: '#E42575' },
        { name: 'Sanko', type: 'sanko', color: '#4CAF50' }
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
    window.leaderboardManager = new LeaderboardManager();
    await window.leaderboardManager.loadLeaderboard();
    initializeWalletConnection();
});