// Part 1: Core Setup and Constants

// Initialize core Supabase reference
let leaderboardManagerInstance = null;

// Constants 
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

// Helper function for button color gradient
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

// Part 2: LeaderboardManager Class

class LeaderboardManager {
    constructor() {
        console.log('Initializing LeaderboardManager...');
        if (leaderboardManagerInstance) {
            console.log('Returning existing LeaderboardManager instance');
            return leaderboardManagerInstance;
        }
        leaderboardManagerInstance = this;
        
        // Initialize properties
        this.leaderboardData = [];
        this.subscription = null;
        
        // Ensure we have the database connection
        if (!window.gameDatabase) {
            console.error('Error: gameDatabase not initialized');
            return;
        }
        
        // Load initial data and setup subscription
        this.loadLeaderboard();
        this.setupRealtimeSubscription();
        console.log('LeaderboardManager initialization complete');
    }

    setupRealtimeSubscription() {
        try {
            console.log('Setting up realtime subscription...');
            if (!window.gameDatabase) {
                throw new Error('Database not initialized');
            }
            
            this.subscription = window.gameDatabase
                .channel('public:leaderboard')
                .on('postgres_changes', 
                    { event: '*', schema: 'public', table: 'leaderboard' },
                    (payload) => {
                        console.log('Received leaderboard update:', payload);
                        this.loadLeaderboard();
                    }
                )
                .subscribe((status) => {
                    console.log('Subscription status:', status);
                });
                
            console.log('Realtime subscription setup complete');
        } catch (error) {
            console.error('Error setting up subscription:', error);
        }
    }

    async loadLeaderboard() {
        try {
            console.log('Loading leaderboard data...');
            if (!window.gameDatabase) {
                throw new Error('Database not initialized');
            }

            const { data, error } = await window.gameDatabase
                .from('leaderboard')
                .select('*')
                .order('points', { ascending: false });

            if (error) {
                throw error;
            }
            
            console.log('Leaderboard data loaded:', data);
            this.leaderboardData = data || [];
            await this.displayLeaderboard();

        } catch (error) {
            console.error('Error loading leaderboard:', error);
            const tbody = document.getElementById('leaderboard-body');
            if (tbody) {
                tbody.innerHTML = `<tr><td colspan="5">Error loading leaderboard: ${error.message}</td></tr>`;
            }
        }
    }

    async displayLeaderboard() {
        try {
            console.log('Displaying leaderboard...');
            const tbody = document.getElementById('leaderboard-body');
            if (!tbody) {
                throw new Error('Leaderboard tbody element not found');
            }

            if (!this.leaderboardData) {
                throw new Error('No leaderboard data available');
            }

            console.log('Generating leaderboard HTML for', this.leaderboardData.length, 'entries');
            tbody.innerHTML = this.leaderboardData.map((player, index) => {
                const chainIndicator = player.chain_type === 'evm' ? '[DMT]' : '[SOL]';
                const username = this.formatAddress(player.username);
                    
                return `
                    <tr>
                        <td>${index + 1}</td>
                        <td>${chainIndicator} ${username}</td>
                        <td>${player.points}</td>
                        <td>${player.wins}/${player.losses}/${player.draws}</td>
                        <td>${player.total_games}</td>
                    </tr>
                `;
            }).join('');

            console.log('Leaderboard displayed successfully');
        } catch (error) {
            console.error('Error displaying leaderboard:', error);
            const tbody = document.getElementById('leaderboard-body');
            if (tbody) {
                tbody.innerHTML = `<tr><td colspan="5">Error displaying leaderboard: ${error.message}</td></tr>`;
            }
        }
    }

    async updateScore(walletAddress, gameResult) {
        if (!walletAddress) {
            console.error('No wallet address provided');
            return;
        }

        const chainType = localStorage.getItem('chainType') || 'evm';
        
        try {
            console.log('Updating score for:', {
                walletAddress,
                chainType,
                gameResult
            });

            // First get existing record
            const { data: existingRecord } = await window.gameDatabase
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
                chain_type: chainType,
                wins,
                losses,
                draws,
                total_games,
                points,
                updated_at: new Date().toISOString()
            };

            console.log('Upserting record:', record);

            const { error: upsertError } = await window.gameDatabase
                .from('leaderboard')
                .upsert(record, {
                    onConflict: 'username'
                });

            if (upsertError) throw upsertError;

            console.log('Successfully updated leaderboard');
            await this.loadLeaderboard();

        } catch (error) {
            console.error('Error updating score:', error);
        }
    }

    formatAddress(address) {
        if (!address) return '';
        return `${address.slice(0, 4)}...${address.slice(-4)}`;
    }
}

// Part 3: WalletConnector Class

class WalletConnector {
    constructor() {
        console.log('Initializing WalletConnector...');
        this.supportedWallets = {
            phantom: window.solana,
            solflare: window.solflare,
            magicEden: window.magicEden
        };
        // Handle EVM provider separately
        this.evmProvider = window.ethereum;
    }

    async connectWallet(walletType) {
        console.log(`Attempting to connect ${walletType} wallet...`);
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
        console.log('Connecting EVM wallet...');
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

            console.log('EVM wallet connected successfully:', walletAddress);
            return walletAddress;
        } catch (error) {
            console.error('EVM wallet connection error:', error);
            throw error;
        }
    }

    async connectSolanaWallet(walletType) {
        console.log(`Connecting Solana wallet: ${walletType}...`);
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

        try {
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
            
            console.log('Solana wallet connected successfully:', walletAddress);
            return walletAddress;
        } catch (error) {
            console.error('Solana wallet connection error:', error);
            throw error;
        }
    }

    setupEVMEventListeners() {
        if (!this.evmProvider) return;

        this.evmProvider.on('accountsChanged', (accounts) => {
            console.log('EVM accounts changed:', accounts);
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
            console.log('EVM chain changed:', chainId);
            if (chainId !== SANKO_CHAIN_ID) {
                this.disconnectWallet();
                alert('Please switch to Sanko network');
            }
        });
    }

    updateWalletUI(walletAddress, walletType) {
        console.log('Updating wallet UI:', { walletAddress, walletType });
        
        // Hide all connect buttons
        const walletButtons = document.querySelectorAll('.wallet-btn');
        walletButtons.forEach(btn => {
            btn.style.cssText = 'display: none !important;';
        });
        
        // Show wallet address with chain indicator
        const addressDisplay = document.getElementById('wallet-address');
        if (addressDisplay) {
            addressDisplay.style.cssText = 'display: block !important;';
            const chainIndicator = walletType === 'sanko' ? '[DMT]' : '[SOL]';
            addressDisplay.textContent = `Connected ${chainIndicator}: ${this.formatAddress(walletAddress)}`;
        }

        // Show difficulty screen
        const difficultyScreen = document.getElementById('difficulty-screen');
        if (difficultyScreen) {
            difficultyScreen.style.cssText = 'display: flex !important;';
        }

        // Update status
        const statusElement = document.getElementById('status');
        if (statusElement) {
            statusElement.textContent = 'Select difficulty to play';
        }
    }

    disconnectWallet() {
        console.log('Disconnecting wallet...');
        localStorage.removeItem('currentPlayer');
        localStorage.removeItem('walletType');
        localStorage.removeItem('chainType');
        
        // Show all wallet buttons
        const walletButtons = document.querySelectorAll('.wallet-btn');
        walletButtons.forEach(btn => {
            btn.style.cssText = 'display: block !important;';
        });
        
        // Hide wallet address
        const addressDisplay = document.getElementById('wallet-address');
        if (addressDisplay) {
            addressDisplay.style.cssText = 'display: none !important;';
        }

        // Hide difficulty screen
        const difficultyScreen = document.getElementById('difficulty-screen');
        if (difficultyScreen) {
            difficultyScreen.style.cssText = 'display: none !important;';
        }

        // Update status
        const statusElement = document.getElementById('status');
        if (statusElement) {
            statusElement.textContent = 'Connect to play';
        }
        
        console.log('Wallet disconnected successfully');
    }

    formatAddress(address) {
        if (!address) return '';
        return `${address.slice(0, 4)}...${address.slice(-4)}`;
    }

    async reconnectWallet() {
        const savedWalletType = localStorage.getItem('walletType');
        const savedAddress = localStorage.getItem('currentPlayer');
        
        if (!savedWalletType || !savedAddress) return false;

        console.log('Attempting to reconnect wallet:', { savedWalletType, savedAddress });

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

// Part 4: Initialization and Setup

// Initialize wallet connector globally
let walletConnector = null;

function initializeWalletUI() {
    console.log('Starting wallet UI initialization...');
    
    function attemptInitialization(attempt = 1) {
        console.log(`Wallet initialization attempt ${attempt}, document.readyState:`, document.readyState);
        
        const walletConnection = document.querySelector('.wallet-connection');
        if (!walletConnection) {
            console.log('Wallet connection div not found, retrying...');
            if (attempt < 10) {
                setTimeout(() => attemptInitialization(attempt + 1), 1000);
                return;
            } else {
                console.error('Failed to find wallet connection after 10 attempts');
                return;
            }
        }

        console.log('Found wallet connection div, creating buttons...');

        // Initialize wallet connector if not already done
        if (!walletConnector) {
            walletConnector = new WalletConnector();
            window.walletConnector = walletConnector;
        }
        
        // Create wallet buttons container
        const walletButtons = document.createElement('div');
        walletButtons.className = 'wallet-buttons';
        walletButtons.style.cssText = `
            display: flex !important;
            flex-wrap: wrap;
            gap: 10px;
            justify-content: center;
            margin-bottom: 15px;
            opacity: 1 !important;
            visibility: visible !important;
        `;

        // Define wallets
        const wallets = [
            { name: 'Phantom', type: 'phantom', color: '#AB9FF2' },
            { name: 'Solflare', type: 'solflare', color: '#FC822B' },
            { name: 'M.E.', type: 'magicEden', color: '#E42575' },
            { name: 'Sanko', type: 'sanko', color: '#4CAF50' }
        ];

        // Create buttons for each wallet
        wallets.forEach(wallet => {
            const button = document.createElement('button');
            button.className = 'wallet-btn';
            button.innerHTML = `Connect ${wallet.name}`;
            button.style.cssText = `
                display: block !important;
                padding: 10px 20px;
                margin: 5px;
                border-radius: 5px;
                cursor: pointer;
                font-family: Impact, sans-serif;
                border: none;
                color: white;
                min-width: 180px;
                background: linear-gradient(45deg, ${wallet.color}, ${adjustColor(wallet.color, 20)});
                opacity: 1 !important;
                visibility: visible !important;
                z-index: 1000;
                position: relative;
            `;
            
            button.addEventListener('click', async (e) => {
                e.preventDefault();
                e.stopPropagation();
                try {
                    await walletConnector.connectWallet(wallet.type);
                } catch (error) {
                    console.error(`Failed to connect ${wallet.name}:`, error);
                }
            });
            
            walletButtons.appendChild(button);
            console.log(`Created button for ${wallet.name}`);
        });

        // Create address display
        const addressDisplay = document.createElement('div');
        addressDisplay.id = 'wallet-address';
        addressDisplay.className = 'wallet-address';
        addressDisplay.style.cssText = 'display: none !important;';

        // Update wallet connection div
        walletConnection.innerHTML = '';
        walletConnection.style.cssText = 'display: block !important;';
        walletConnection.appendChild(walletButtons);
        walletConnection.appendChild(addressDisplay);

        console.log('Wallet UI initialization complete');

        // Try to reconnect existing wallet
        walletConnector.reconnectWallet();
    }

    // Start initialization attempts
    attemptInitialization();
}

// Update game result handling
window.updateGameResult = async function(winner) {
    const currentPlayer = localStorage.getItem('currentPlayer');
    if (!currentPlayer) {
        console.warn('No wallet address found for game result update');
        return;
    }

    console.log(`Game ended. Winner: ${winner}, Current player: ${currentPlayer}`);

    if (leaderboardManagerInstance) {
        if (winner === 'draw') {
            await leaderboardManagerInstance.updateScore(currentPlayer, 'draw');
        } else if (winner === 'blue') {
            await leaderboardManagerInstance.updateScore(currentPlayer, 'win');
        } else {
            await leaderboardManagerInstance.updateScore(currentPlayer, 'loss');
        }
    } else {
        console.error('LeaderboardManager instance not found for game result update');
    }
};

// Component initialization
function initializeComponents() {
    console.log('Initializing all components...');
    
    // Initialize LeaderboardManager if not already done
    if (!window.leaderboardManager) {
        console.log('Creating new LeaderboardManager...');
        window.leaderboardManager = new LeaderboardManager();
    }

    // Initialize wallet UI
    initializeWalletUI();

    // Add CSS to ensure wallet buttons are visible
    const style = document.createElement('style');
    style.textContent = `
        .wallet-connection {
            display: block !important;
            opacity: 1 !important;
            visibility: visible !important;
        }
        .wallet-buttons {
            display: flex !important;
            opacity: 1 !important;
            visibility: visible !important;
        }
        .wallet-btn {
            display: block !important;
            opacity: 1 !important;
            visibility: visible !important;
        }
    `;
    document.head.appendChild(style);
}

// Setup initialization triggers
document.addEventListener('DOMContentLoaded', initializeComponents);

// Backup initialization if DOMContentLoaded already fired
if (document.readyState === 'complete' || document.readyState === 'interactive') {
    console.log('Document already loaded, running initialization...');
    initializeComponents();
}