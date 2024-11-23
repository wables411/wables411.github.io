class ChessBetting {
    constructor() {
        if (ChessBetting.instance) {
            return ChessBetting.instance;
        }
        ChessBetting.instance = this;

        this.config = window.BETTING_CONFIG;
        this.solanaConfig = window.SOLANA_CONFIG;
        this.supabase = window.gameDatabase;
        this.connection = null;
        this.initQueue = window.bettingInitQueue;
        
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

        this.initialized = false;
        this.initializing = false;
        this.connectionErrorCount = 0;
        this.maxConnectionErrors = 3;
    }

    // Utility Functions
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

    showCopyNotification() {
        const notification = document.getElementById('copyNotification');
        if (notification) {
            notification.style.display = 'block';
            setTimeout(() => {
                notification.style.display = 'none';
            }, 2000);
        }
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

    // Transaction Helper
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
            }, this.transactionOptions.commitment);

            if (confirmation.value.err) {
                throw new Error('Transaction failed to confirm');
            }

            return signature;
        } catch (error) {
            console.error('Transaction failed:', error);
            throw error;
        }
    }

    async init() {
        if (this.initialized) {
            console.log('Betting system already initialized');
            return true;
        }

        if (this.initializing) {
            console.log('Initialization already in progress');
            return new Promise((resolve) => {
                const checkInit = setInterval(() => {
                    if (this.initialized) {
                        clearInterval(checkInit);
                        resolve(true);
                    }
                }, 100);
            });
        }

        this.initializing = true;
    
        try {
            console.log('Initializing betting system...');
            
            // Get wallet
            const wallet = this.getConnectedWallet();
            if (!wallet) {
                throw new Error('No wallet connected');
            }
    
            // Add connection establishment to queue
            await this.initQueue.add(async () => {
                this.connection = await this.solanaConfig.createConnection();
                if (!this.connection) {
                    throw new Error('Failed to establish connection');
                }
                return true;
            });
            
            // Verify setup
            await this.verifySetup();
            
            // Initialize UI
            this.initializeUI();
            
            // Initialize balance checking
            await this.initializeBalanceChecking();
            
            this.initialized = true;
            this.initializing = false;
            console.log('Betting system initialized successfully');
            
            return true;
        } catch (error) {
            console.error('Failed to initialize betting system:', error);
            this.updateBetStatus(`Initialization failed: ${error.message}`, 'error');
            this.initialized = false;
            this.initializing = false;
            
            // Retry initialization if appropriate
            if (this.connectionErrorCount < this.maxConnectionErrors) {
                this.connectionErrorCount++;
                console.log(`Retrying initialization (${this.connectionErrorCount}/${this.maxConnectionErrors})`);
                return await this.init();
            }
            
            throw error;
        }
    }

    async verifySetup() {
        try {
            console.log('Verifying setup...');
            
            if (!this.connection) {
                throw new Error('No connection established');
            }

            // Test connection
            const version = await this.connection.getVersion();
            console.log('Solana connection verified, version:', version);

            // Verify LAWB token
            const tokenInfo = await this.connection.getParsedAccountInfo(this.lawbMint);
            if (!tokenInfo.value) {
                throw new Error('Could not verify LAWB token');
            }
            console.log('LAWB token verified');

            // Initialize subscriptions
            await this.initializeSubscriptions();
            
            return true;
        } catch (error) {
            console.error('Setup verification failed:', error);
            throw error;
        }
    }

    initializeUI() {
        try {
            console.log('Initializing UI handlers...');
            
            // Set up bet amount input handler
            const betInput = document.getElementById('betAmount');
            if (betInput) {
                betInput.addEventListener('input', () => this.updateBetCalculations());
                betInput.value = this.config.MIN_BET;
                this.updateBetCalculations();
            }

            // Set up game creation buttons
            const createGameWithBetBtn = document.getElementById('create-game-with-bet');
            if (createGameWithBetBtn) {
                createGameWithBetBtn.onclick = () => this.handleCreateGameWithBet();
            }

            // Set up join game handling
            const joinGameBtn = document.getElementById('join-game');
            if (joinGameBtn) {
                joinGameBtn.onclick = () => this.handleJoinGame();
            }

            // Set up game code copy functionality
            const gameCode = document.getElementById('gameCode');
            if (gameCode) {
                gameCode.onclick = () => {
                    navigator.clipboard.writeText(gameCode.textContent)
                        .then(() => this.showCopyNotification())
                        .catch(err => console.error('Failed to copy game code:', err));
                };
            }

            this.updateBetStatus('Ready to place bets', 'success');
            console.log('UI handlers initialized');
        } catch (error) {
            console.error('UI initialization error:', error);
            this.updateBetStatus('UI initialization failed', 'error');
        }
    }

    async initializeBalanceChecking() {
        try {
            const wallet = this.getConnectedWallet();
            if (!wallet?.publicKey) {
                console.log('No wallet for balance checking');
                return;
            }

            // Find token account
            const tokenAccount = await this.config.findAssociatedTokenAddress(
                wallet.publicKey,
                this.lawbMint
            );
            
            console.log('Token account for balance checking:', tokenAccount.toString());

            // Clear any existing subscription
            if (this.subscriptions.balance) {
                this.connection.removeAccountChangeListener(this.subscriptions.balance);
            }

            // Set up subscription for balance changes
            this.subscriptions.balance = this.connection.onAccountChange(
                tokenAccount,
                (accountInfo) => this.handleBalanceUpdate(accountInfo),
                'confirmed'
            );

            // Initial balance check
            await this.checkInitialBalance(tokenAccount);

            console.log('Balance checking initialized');
        } catch (error) {
            console.error('Failed to initialize balance checking:', error);
            throw error;
        }
    }

    async checkInitialBalance(tokenAccount) {
        try {
            const accountInfo = await this.connection.getAccountInfo(tokenAccount);
            if (accountInfo) {
                await this.handleBalanceUpdate(accountInfo);
            } else {
                this.updateBetStatus('No $LAWB token account found', 'error');
                const createGameBtn = document.getElementById('create-game-with-bet');
                if (createGameBtn) createGameBtn.disabled = true;
            }
        } catch (error) {
            console.error('Error checking initial balance:', error);
            throw error;
        }
    }

    async initializeSubscriptions() {
        try {
            // Clear any existing subscriptions
            if (this.subscriptions.betUpdates) {
                this.subscriptions.betUpdates.unsubscribe();
            }
            if (this.subscriptions.gameUpdates) {
                this.subscriptions.gameUpdates.unsubscribe();
            }

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

            console.log('Database subscriptions initialized');
        } catch (error) {
            console.error('Error initializing subscriptions:', error);
            throw error;
        }
    }

    async createBetEscrow(gameId, amount) {
        try {
            console.log('Creating bet escrow for game:', gameId);
            
            const wallet = this.getConnectedWallet();
            if (!wallet) throw new Error('No wallet connected');

            // Ensure connection is ready
            if (!this.connection) {
                await this.init();
                if (!this.connection) {
                    throw new Error('Failed to establish connection');
                }
            }

            // Generate escrow accounts
            const escrowPDA = await this.config.findEscrowPDA(gameId);
            console.log('Escrow PDA:', escrowPDA.toString());

            // Get player and escrow token accounts
            const playerATA = await this.config.findAssociatedTokenAddress(
                wallet.publicKey,
                this.lawbMint
            );

            const escrowATA = await this.config.findAssociatedTokenAddress(
                escrowPDA,
                this.lawbMint
            );

            // Check balance with retry
            let balance;
            for (let i = 0; i < 3; i++) {
                try {
                    balance = await this.connection.getTokenAccountBalance(playerATA);
                    break;
                } catch (error) {
                    if (i === 2) throw error;
                    await new Promise(resolve => setTimeout(resolve, 1000));
                }
            }

            const requiredAmount = amount * Math.pow(10, this.config.LAWB_TOKEN.DECIMALS);
            if (Number(balance.value.amount) < requiredAmount) {
                throw new Error(`Insufficient $LAWB balance`);
            }

            // Check if escrow account exists and create if needed
            const escrowAccount = await this.connection.getAccountInfo(escrowATA);
            if (!escrowAccount) {
                console.log('Creating escrow token account');
                const createATAIx = window.SplToken.createAssociatedTokenAccountInstruction(
                    wallet.publicKey,
                    escrowATA,
                    escrowPDA,
                    this.lawbMint
                );
                
                const tx = new solanaWeb3.Transaction().add(createATAIx);
                await this.sendAndConfirmTransaction(tx);
            }

            // Transfer tokens to escrow
            const transferIx = this.config.createTransferInstruction(
                playerATA,
                escrowATA,
                wallet.publicKey,
                requiredAmount
            );

            const transferTx = new solanaWeb3.Transaction().add(transferIx);
            const signature = await this.sendAndConfirmTransaction(transferTx);

            console.log('Escrow funded:', signature);
            return { escrowPDA, escrowATA, signature };

        } catch (error) {
            console.error('Error creating bet escrow:', error);
            throw error;
        }
    }

    async handleCreateGameWithBet() {
        try {
            if (!this.initialized) {
                await this.init();
            }

            const wallet = this.getConnectedWallet();
            if (!wallet) {
                this.updateBetStatus('Please connect your wallet first', 'error');
                return;
            }

            const amount = Number(document.getElementById('betAmount')?.value);
            if (!this.validateBetAmount(amount)) return;

            this.updateBetStatus('Processing bet...', 'processing');
            
            // Generate game ID and setup escrow
            const gameId = Math.random().toString(36).substring(2, 8).toUpperCase();
            const { escrowPDA, signature } = await this.createBetEscrow(gameId, amount);

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
                escrowAccount: escrowPDA.toString(),
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

            this.updateBetStatus('Game created successfully!', 'success');
            this.disableBetting();

        } catch (error) {
            console.error('Error creating game with bet:', error);
            this.updateBetStatus('Failed to create game: ' + error.message, 'error');
            this.resetBetState();
        }
    }

    async handleJoinGame() {
        try {
            if (!this.initialized) {
                await this.init();
            }

            const wallet = this.getConnectedWallet();
            if (!wallet) {
                this.updateBetStatus('Please connect your wallet first', 'error');
                return;
            }

            const gameCode = document.getElementById('game-code-input')?.value?.trim().toUpperCase();
            if (!gameCode) {
                this.updateBetStatus('Please enter a game code', 'error');
                return;
            }

            this.updateBetStatus('Joining game...', 'processing');

            // Get game details
            const { data: game, error: gameError } = await this.supabase
                .from('chess_games')
                .select('*')
                .eq('game_id', gameCode)
                .eq('game_state', 'waiting')
                .single();

            if (gameError || !game) {
                throw new Error(gameError?.message || 'Game not found or already started');
            }

            if (game.blue_player === wallet.publicKey.toString()) {
                throw new Error('Cannot join your own game');
            }

            // Handle bet matching if necessary
            if (game.bet_amount > 0) {
                await this.matchBet(game);
            }

            // Update game state
            const { error: updateError } = await this.supabase
                .from('chess_games')
                .update({
                    red_player: wallet.publicKey.toString(),
                    game_state: 'active',
                    updated_at: new Date().toISOString()
                })
                .eq('game_id', gameCode);

            if (updateError) throw updateError;

            this.updateBetStatus('Successfully joined game!', 'success');
            
            // Trigger game start in the UI
            if (window.multiplayerManager) {
                window.multiplayerManager.showGame('red');
            }

        } catch (error) {
            console.error('Error joining game:', error);
            this.updateBetStatus('Failed to join game: ' + error.message, 'error');
        }
    }

    async matchBet(game) {
        try {
            const wallet = this.getConnectedWallet();
            if (!wallet) throw new Error('No wallet connected');

            // Create escrow for matching bet
            const { escrowPDA } = await this.createBetEscrow(
                game.game_id,
                game.bet_amount
            );

            // Update bet record
            const { error: betError } = await this.supabase
                .from('chess_bets')
                .update({
                    red_player: wallet.publicKey.toString(),
                    status: 'matched',
                    updated_at: new Date().toISOString()
                })
                .eq('game_id', game.game_id);

            if (betError) throw betError;

            return true;
        } catch (error) {
            console.error('Error matching bet:', error);
            throw error;
        }
    }

    async processWinner(winner) {
        if (!this.currentBet.isActive || !this.initialized) return;

        try {
            const wallet = this.getConnectedWallet();
            if (!wallet) throw new Error('No wallet connected');

            if (!this.connection) {
                await this.init();
            }

            const escrowPDA = new solanaWeb3.PublicKey(this.currentBet.escrowAccount);
            const escrowATA = await this.config.findAssociatedTokenAddress(
                escrowPDA,
                this.lawbMint
            );

            // Calculate payouts
            const totalAmount = this.currentBet.amount * 2;
            const houseFee = Math.floor(totalAmount * this.config.HOUSE_FEE_PERCENTAGE / 100);
            const winnerAmount = totalAmount - houseFee;

            // Get winner's token account
            const winnerPubkey = new solanaWeb3.PublicKey(
                winner === 'blue' ? this.currentBet.bluePlayer : this.currentBet.redPlayer
            );
            const winnerATA = await this.config.findAssociatedTokenAddress(
                winnerPubkey,
                this.lawbMint
            );

            // Get house token account
            const houseATA = await this.config.findAssociatedTokenAddress(
                this.config.HOUSE_WALLET,
                this.lawbMint
            );

            // Process payouts with retry logic
            const processPayout = async (from, to, amount, retries = 3) => {
                for (let i = 0; i < retries; i++) {
                    try {
                        const tx = new solanaWeb3.Transaction().add(
                            this.config.createTransferInstruction(
                                from,
                                to,
                                escrowPDA,
                                amount * Math.pow(10, this.config.LAWB_TOKEN.DECIMALS)
                            )
                        );
                        await this.sendAndConfirmTransaction(tx);
                        return true;
                    } catch (error) {
                        if (i === retries - 1) throw error;
                        await new Promise(resolve => setTimeout(resolve, 1000 * (i + 1)));
                    }
                }
            };

            // Process both payouts
            await Promise.all([
                processPayout(escrowATA, winnerATA, winnerAmount),
                processPayout(escrowATA, houseATA, houseFee)
            ]);

            // Update records
            await Promise.all([
                this.updateGameRecord(this.currentBet.gameId, winner),
                this.updateBetRecord(this.currentBet.betId, winner)
            ]);

            this.updateBetStatus('Bet settled successfully', 'success');
            this.resetBetState();

        } catch (error) {
            console.error('Error processing winner:', error);
            this.updateBetStatus('Failed to process winner: ' + error.message, 'error');
        }
    }

    // Database operations
    async createGameRecord(gameId, playerAddress, amount, escrowPDA) {
        try {
            const record = {
                game_id: gameId,
                blue_player: playerAddress,
                bet_amount: amount,
                escrow_account: escrowPDA.toString(),
                game_state: 'waiting',
                current_player: 'blue',
                board: {
                    positions: JSON.parse(JSON.stringify(window.initialBoard)),
                    pieceState: {}
                },
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
            };

            const { data, error } = await this.supabase
                .from('chess_games')
                .insert([record])
                .select()
                .single();

            if (error) throw error;
            return data;
        } catch (error) {
            console.error('Error creating game record:', error);
            throw error;
        }
    }

    async createBetRecord(gameId, playerAddress, amount, escrowPDA) {
        try {
            const record = {
                game_id: gameId,
                bet_amount: amount,
                blue_player: playerAddress,
                escrow_account: escrowPDA.toString(),
                status: 'pending',
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
            };

            const { data, error } = await this.supabase
                .from('chess_bets')
                .insert([record])
                .select()
                .single();

            if (error) throw error;
            return data;
        } catch (error) {
            console.error('Error creating bet record:', error);
            throw error;
        }
    }

    // Cleanup function
    cleanup() {
        // Clear all subscriptions
        Object.values(this.subscriptions).forEach(subscription => {
            if (subscription) {
                if (typeof subscription.unsubscribe === 'function') {
                    subscription.unsubscribe();
                } else if (typeof subscription === 'number') {
                    this.connection?.removeAccountChangeListener(subscription);
                }
            }
        });

        this.initialized = false;
        this.initQueue.clear();
        this.resetBetState();
    }
}

// Create singleton instance
window.chessBetting = new ChessBetting();

// Add cleanup on page unload
window.addEventListener('beforeunload', () => {
    if (window.chessBetting) {
        window.chessBetting.cleanup();
    }
});