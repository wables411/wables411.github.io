class ChessBetting {
    constructor() {
        this.config = window.BETTING_CONFIG;
        this.solanaConfig = window.SOLANA_CONFIG;
        this.supabase = window.gameDatabase;
        this.connection = null;
        
        // Initialize token program and mint
        this.tokenProgram = window.SplToken.TOKEN_PROGRAM_ID;
        this.associatedTokenProgram = window.SplToken.ASSOCIATED_TOKEN_PROGRAM_ID;
        this.lawbMint = new solanaWeb3.PublicKey('65GVcFcSqQcaMNeBkYcen4ozeT83tr13CeDLU4sUUdV6');
        
        this.currentBet = {
            amount: 0,
            bluePlayer: null,
            redPlayer: null,
            gameId: null,
            isActive: false,
            escrowAccount: null,
            matched: false,
            betId: null,
            status: 'pending'
        };

        this.transactionOptions = {
            skipPreflight: false,
            preflightCommitment: 'confirmed',
            commitment: 'confirmed',
            maxRetries: 3
        };

        this.subscriptions = {
            betUpdates: null,
            gameUpdates: null,
            balance: null
        };

        // Don't auto-initialize
        this.initialized = false;
    }

    async init() {
        if (this.initialized) {
            console.log('Betting system already initialized');
            return true;
        }

        try {
            console.log('Initializing betting system...');
            
            // Get wallet
            const wallet = this.getConnectedWallet();
            if (!wallet) {
                console.log('No wallet connected, waiting for wallet...');
                return false;
            }

            // Wait for connection to be established
            this.connection = await this.solanaConfig.createConnection();
            console.log('Connection established');

            // Verify setup
            await this.verifySetup();
            console.log('Setup verified');
            
            // Initialize UI
            this.initializeUI();
            console.log('UI initialized');
            
            // Initialize balance checking
            await this.initializeBalanceChecking();
            console.log('Balance checking initialized');
            
            this.initialized = true;
            console.log('Betting system initialized successfully');
            
            return true;
        } catch (error) {
            console.error('Failed to initialize betting system:', error);
            this.updateBetStatus('Failed to initialize betting system', 'error');
            return false;
        }
    }

    async verifySetup() {
        try {
            console.log('Verifying setup...');
            
            // Basic connection test
            const version = await this.connection.getVersion();
            console.log('Solana connection verified, version:', version);

            // Verify LAWB token
            try {
                const tokenInfo = await this.connection.getParsedAccountInfo(this.lawbMint);
                if (tokenInfo.value) {
                    console.log('LAWB token verified');
                } else {
                    console.warn('Could not verify LAWB token, but continuing...');
                }
            } catch (tokenError) {
                console.warn('Token verification failed, but continuing:', tokenError);
            }

            // Initialize subscriptions
            await this.initializeSubscriptions();
            
            return true;
        } catch (error) {
            console.warn('Setup verification warning:', error);
            return true; // Continue anyway since we have fallbacks
        }
    }

    initializeUI() {
        console.log('Initializing UI handlers...');
        
        // Set up bet amount input handler
        const betInput = document.getElementById('betAmount');
        if (betInput) {
            betInput.addEventListener('input', () => this.updateBetCalculations());
        }

        // Set up game creation buttons
        const createGameWithBetBtn = document.getElementById('create-game-with-bet');
        if (createGameWithBetBtn) {
            createGameWithBetBtn.addEventListener('click', () => this.handleCreateGameWithBet());
        }

        const createGameNoBtn = document.getElementById('create-game-no-bet');
        if (createGameNoBtn) {
            createGameNoBtn.addEventListener('click', () => this.handleCreateGameNoBet());
        }

        // Set up join game button
        const joinGameBtn = document.getElementById('join-game');
        if (joinGameBtn) {
            joinGameBtn.addEventListener('click', () => this.handleJoinGame());
        }

        console.log('UI handlers initialized');
    }

    updateBetCalculations() {
        const betInput = document.getElementById('betAmount');
        const feeDisplay = document.getElementById('feeAmount');
        const winDisplay = document.getElementById('potentialWin');
        
        if (betInput && feeDisplay && winDisplay) {
            const amount = Number(betInput.value);
            if (this.validateBetAmount(amount, false)) {
                const fee = Math.floor(amount * 2 * this.config.HOUSE_FEE_PERCENTAGE / 100);
                const potentialWin = amount * 2 - fee;
                
                feeDisplay.textContent = fee;
                winDisplay.textContent = potentialWin;
            }
        }
    }

    async initializeSubscriptions() {
        try {
            // Subscribe to bet updates
            this.subscriptions.betUpdates = this.supabase
                .channel('betting_changes')
                .on(
                    'postgres_changes',
                    {
                        event: '*',
                        schema: 'public',
                        table: 'chess_bets'
                    },
                    (payload) => this.handleBetUpdate(payload)
                )
                .subscribe();

            // Subscribe to game updates
            this.subscriptions.gameUpdates = this.supabase
                .channel('game_changes')
                .on(
                    'postgres_changes',
                    {
                        event: '*',
                        schema: 'public',
                        table: 'chess_games'
                    },
                    (payload) => this.handleGameUpdate(payload)
                )
                .subscribe();

            console.log('Subscriptions initialized');
        } catch (error) {
            console.error('Error initializing subscriptions:', error);
        }
    }

    async initializeBalanceChecking() {
        try {
            const wallet = this.getConnectedWallet();
            if (!wallet?.publicKey) {
                console.log('No wallet for balance checking');
                return;
            }

            // Get or create token account
            const tokenAccount = await window.SplToken.getAssociatedTokenAddress(
                this.lawbMint,
                wallet.publicKey,
                false
            );
            
            console.log('Token account for balance checking:', tokenAccount.toString());

            // Set up subscription for balance changes
            this.subscriptions.balance = this.connection.onAccountChange(
                tokenAccount,
                (accountInfo) => {
                    this.handleBalanceUpdate(accountInfo);
                },
                'confirmed'
            );

            console.log('Balance checking initialized');
        } catch (error) {
            console.error('Failed to initialize balance checking:', error);
        }
    }

    async handleBalanceUpdate(accountInfo) {
        try {
            const wallet = this.getConnectedWallet();
            if (!wallet?.publicKey) return;

            const balance = accountInfo.lamports / Math.pow(10, this.config.LAWB_TOKEN.DECIMALS);
            
            // Update UI based on balance
            const betInput = document.getElementById('betAmount');
            const createGameBtn = document.getElementById('create-game-with-bet');
            
            if (betInput && createGameBtn) {
                const currentBet = Number(betInput.value);
                createGameBtn.disabled = balance < currentBet;
                
                if (balance < currentBet) {
                    this.updateBetStatus(`Insufficient balance: ${balance.toFixed(2)} $LAWB`, 'error');
                }
            }
        } catch (error) {
            console.error('Error handling balance update:', error);
        }
    }

    async createEscrowAccounts(gameId) {
        try {
            console.log('Creating escrow accounts for game:', gameId);
            
            // Generate escrow PDA
            const escrowPDA = await this.config.findEscrowPDA(gameId);
            console.log('Escrow PDA:', escrowPDA.toString());

            // Get escrow token account
            const escrowATA = await window.SplToken.getAssociatedTokenAddress(
                this.lawbMint,
                escrowPDA,
                false
            );
            console.log('Escrow ATA:', escrowATA.toString());

            return { escrowPDA, escrowATA };
        } catch (error) {
            console.error('Error creating escrow accounts:', error);
            throw error;
        }
    }

    async handleCreateGameWithBet() {
        try {
            const wallet = this.getConnectedWallet();
            if (!wallet || !wallet.publicKey) {
                this.updateBetStatus('Please connect your wallet first', 'error');
                return;
            }

            const amount = Number(document.getElementById('betAmount')?.value);
            if (!await this.validateBetAmount(amount)) {
                return;
            }

            this.updateBetStatus('Processing bet...', 'processing');
            
            // Generate game ID and setup accounts
            const gameId = Math.random().toString(36).substring(2, 8).toUpperCase();
            const { escrowPDA, escrowATA } = await this.createEscrowAccounts(gameId);
            
            // Create associated token account for escrow if it doesn't exist
            try {
                const escrowAccount = await this.connection.getAccountInfo(escrowATA);
                if (!escrowAccount) {
                    const createATAIx = window.SplToken.createAssociatedTokenAccountInstruction(
                        wallet.publicKey,
                        escrowATA,
                        escrowPDA,
                        this.lawbMint
                    );
                    
                    const transaction = new solanaWeb3.Transaction().add(createATAIx);
                    await this.sendAndConfirmTransaction(transaction);
                }
            } catch (error) {
                console.warn('Error checking/creating escrow ATA:', error);
                // Continue anyway as the account might exist
            }

            // Transfer funds to escrow
            await this.transferToEscrow(wallet.publicKey, escrowPDA, escrowATA, amount);

            // Create game and bet records
            const [gameRecord, betRecord] = await Promise.all([
                this.createGameRecord(gameId, wallet.publicKey.toString(), amount, escrowPDA),
                this.createBetRecord(gameId, wallet.publicKey.toString(), amount, escrowPDA)
            ]);

            this.currentBet = {
                amount,
                bluePlayer: wallet.publicKey.toString(),
                gameId,
                betId: betRecord.id,
                isActive: true,
                escrowAccount: escrowPDA,
                matched: false,
                status: 'pending'
            };

            // Show game code
            const gameCodeDisplay = document.getElementById('gameCodeDisplay');
            const gameCode = document.getElementById('gameCode');
            if (gameCodeDisplay && gameCode) {
                gameCode.textContent = gameId;
                gameCodeDisplay.style.display = 'block';
            }

            this.updateBetStatus(`Game created! Share code: ${gameId}`, 'success');
            this.disableBetting();

        } catch (error) {
            console.error('Error creating game with bet:', error);
            this.updateBetStatus('Failed to create game: ' + error.message, 'error');
            this.resetBetState();
        }
    }

    async transferToEscrow(playerPubKey, escrowPDA, escrowATA, amount) {
        try {
            // Get player's token account
            const playerATA = await window.SplToken.getAssociatedTokenAddress(
                this.lawbMint,
                playerPubKey,
                false
            );

            // Check balance
            const balance = await this.connection.getTokenAccountBalance(playerATA);
            const requiredAmount = amount * Math.pow(10, this.config.LAWB_TOKEN.DECIMALS);
            
            if (Number(balance.value.amount) < requiredAmount) {
                throw new Error(`Insufficient $LAWB balance`);
            }

            // Create and send transfer transaction
            const transferIx = window.SplToken.createTransferInstruction(
                playerATA,
                escrowATA,
                playerPubKey,
                requiredAmount,
                [],
                this.tokenProgram
            );

            const transaction = new solanaWeb3.Transaction().add(transferIx);
            await this.sendAndConfirmTransaction(transaction);
            
            console.log('Transfer to escrow completed');
        } catch (error) {
            console.error('Error transferring to escrow:', error);
            throw error;
        }
    }

    async sendAndConfirmTransaction(transaction) {
        try {
            const wallet = this.getConnectedWallet();
            if (!wallet) throw new Error('No wallet connected');

            const { blockhash, lastValidBlockHeight } = 
                await this.connection.getLatestBlockhash('confirmed');
            
            transaction.recentBlockhash = blockhash;
            transaction.feePayer = wallet.publicKey;

            const signed = await wallet.signTransaction(transaction);
            const signature = await this.connection.sendRawTransaction(
                signed.serialize(),
                this.transactionOptions
            );

            const confirmation = await this.connection.confirmTransaction({
                signature,
                blockhash,
                lastValidBlockHeight
            });

            if (confirmation.value.err) {
                throw new Error('Transaction failed to confirm');
            }

            return signature;
        } catch (error) {
            console.error('Transaction failed:', error);
            throw error;
        }
    }

    getConnectedWallet() {
        const wallet = window.solflare?.isConnected ? window.solflare : 
                      window.solana?.isConnected ? window.solana : null;
                      
        if (!wallet) {
            this.updateBetStatus('No wallet connected', 'error');
        }
        return wallet;
    }

    validateBetAmount(amount, showError = true) {
        if (!amount || isNaN(amount)) {
            if (showError) this.updateBetStatus('Invalid bet amount', 'error');
            return false;
        }
        if (amount < this.config.MIN_BET) {
            if (showError) this.updateBetStatus(`Minimum bet is ${this.config.MIN_BET} $LAWB`, 'error');
            return false;
        }
        if (amount > this.config.MAX_BET) {
            if (showError) this.updateBetStatus(`Maximum bet is ${this.config.MAX_BET} $LAWB`, 'error');
            return false;
        }
        return true;
    }

    updateBetStatus(message, type = 'info') {
        const statusElement = document.getElementById('betStatus');
        if (statusElement) {
            statusElement.textContent = message;
            statusElement.className = `bet-status ${type}`;
        }
        console.log(`Bet status: ${message}`);
    }

    resetBetState() {
        this.currentBet = {
            amount: 0,
            bluePlayer: null,
            redPlayer: null,
            gameId: null,
            betId: null,
            isActive: false,
            escrowAccount: null,
            matched: false,
            status: 'pending'
        };
        this.enableBetting();

        const gameCodeDisplay = document.getElementById('gameCodeDisplay');
        if (gameCodeDisplay) {
            gameCodeDisplay.style.display = 'none';
        }
    }

    disableBetting() {
        const createGameWithBetBtn = document.getElementById('create-game-with-bet');
        const betInput = document.getElementById('betAmount');
        if (createGameWithBetBtn) createGameWithBetBtn.disabled = true;
        if (betInput) betInput.disabled = true;
    }

    enableBetting() {
        const createGameWithBetBtn = document.getElementById('create-game-with-bet');
        const betInput = document.getElementById('betAmount');
        if (createGameWithBetBtn) createGameWithBetBtn.disabled = false;
        if (betInput) betInput.disabled = false;
    }
}

// Initialize betting system
window.ChessBetting = ChessBetting;

// Initialize when document is ready and wallet is connected
document.addEventListener('DOMContentLoaded', () => {
    const walletCheckInterval = setInterval(() => {
        const wallet = window.solflare?.isConnected ? window.solflare : 
                      window.solana?.isConnected ? window.solana : null;
        
        if (wallet && !window.chessBetting?.initialized) {
            clearInterval(walletCheckInterval);
            console.log('Wallet detected, initializing betting system');
            window.chessBetting = new ChessBetting();
            window.chessBetting.init().catch(console.error);
        }
    }, 1000);
});