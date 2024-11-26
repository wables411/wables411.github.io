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
        this.connectionRetryCount = 0;
        this.maxConnectionRetries = 3;
        
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
        this.initRetryCount = 0;
    }

    async init() {
        if (this.initialized) {
            console.log('Betting system already initialized');
            return true;
        }

        if (this.initializing) {
            console.log('Initialization already in progress');
            return false;
        }

        this.initializing = true;
    
        try {
            console.log('Initializing betting system...');
            
            // Get wallet
            const wallet = this.getConnectedWallet();
            if (!wallet) {
                console.log('No wallet for initialization');
                return false;
            }
    
            // Establish connection with retry logic
            await this.establishConnection();
            
            if (!this.connection) {
                throw new Error('Failed to establish connection after retries');
            }

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
            this.initRetryCount++;
            
            if (this.initRetryCount < 3) {
                console.log(`Retrying initialization (${this.initRetryCount}/3)`);
                return await this.init();
            }
            
            return false;
        }
    }

    async handleBalanceUpdate(accountInfo) {
        try {
            const wallet = this.getConnectedWallet();
            if (!wallet?.publicKey) return;

            const balance = await this.parseTokenAccountBalance(accountInfo);
            
            // Update UI elements
            const betInput = document.getElementById('betAmount');
            const createGameBtn = document.getElementById('create-game-with-bet');
            
            if (betInput && createGameBtn) {
                const currentBet = Number(betInput.value);
                createGameBtn.disabled = balance < currentBet;
                
                if (balance < currentBet) {
                    this.updateBetStatus(`Insufficient balance: ${balance.toFixed(2)} $LAWB`, 'error');
                } else {
                    this.updateBetStatus('', 'info');
                }
            }

            return balance;
        } catch (error) {
            console.error('Error handling balance update:', error);
            return 0;
        }
    }

    updateBetCalculations() {
        const betInput = document.getElementById('betAmount');
        const feeDisplay = document.getElementById('feeAmount');
        const winDisplay = document.getElementById('potentialWin');
        
        if (betInput && feeDisplay && winDisplay) {
            const amount = Number(betInput.value);
            if (this.validateBetAmount(amount, false)) {
                const fee = (amount * this.config.HOUSE_FEE_PERCENTAGE / 100).toFixed(2);
                const potentialWin = (amount * 2 * (1 - this.config.HOUSE_FEE_PERCENTAGE / 100)).toFixed(2);
                
                feeDisplay.textContent = fee;
                winDisplay.textContent = potentialWin;
            }
        }
    }

    parseTokenAccountBalance(accountInfo) {
        const data = accountInfo.data || accountInfo;
        if (!data) return 0;
        
        try {
            const amount = data.parsed ? 
                data.parsed.info.tokenAmount.uiAmount :
                data.amount / Math.pow(10, this.config.LAWB_TOKEN.DECIMALS);
            
            return Number(amount);
        } catch (error) {
            console.error('Error parsing token balance:', error);
            return 0;
        }
    }

    async establishConnection() {
        while (this.connectionRetryCount < this.maxConnectionRetries) {
            try {
                this.connection = await this.solanaConfig.createConnection();
                if (this.connection) {
                    console.log('Connection established successfully');
                    return true;
                }
            } catch (error) {
                console.warn(`Connection attempt ${this.connectionRetryCount + 1} failed:`, error);
                this.connectionRetryCount++;
                await new Promise(resolve => setTimeout(resolve, 1000 * this.connectionRetryCount));
            }
        }
        throw new Error('Failed to establish connection after maximum retries');
    }

    async verifySetup() {
        try {
            console.log('Verifying setup...');
            
            // Basic connection test
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

            // Initialize bet calculations
            this.updateBetCalculations();

            console.log('UI handlers initialized');
        } catch (error) {
            console.error('UI initialization error:', error);
            throw error;
        }
    }

    async initializeBalanceChecking() {
        try {
            const wallet = this.getConnectedWallet();
            if (!wallet?.publicKey) {
                console.log('No wallet for balance checking');
                return;
            }

            const tokenAccount = await this.config.findAssociatedTokenAddress(
                wallet.publicKey,
                this.lawbMint
            );
            
            console.log('Token account for balance checking:', tokenAccount.toString());

            // Set up subscription for balance changes
            if (this.subscriptions.balance) {
                this.connection.removeAccountChangeListener(this.subscriptions.balance);
            }

            this.subscriptions.balance = this.connection.onAccountChange(
                tokenAccount,
                (accountInfo) => this.handleBalanceUpdate(accountInfo),
                'confirmed'
            );

            // Initial balance check
            const accountInfo = await this.connection.getAccountInfo(tokenAccount);
            if (accountInfo) {
                await this.handleBalanceUpdate(accountInfo);
            }

            console.log('Balance checking initialized');
        } catch (error) {
            console.error('Failed to initialize balance checking:', error);
            throw error;
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

            // Check player's token balance
            const balance = await this.connection.getTokenAccountBalance(playerATA);
            const requiredAmount = amount * Math.pow(10, this.config.LAWB_TOKEN.DECIMALS);
            
            if (Number(balance.value.amount) < requiredAmount) {
                throw new Error(`Insufficient $LAWB balance`);
            }

            // Create escrow ATA if it doesn't exist
            const escrowAccount = await this.connection.getAccountInfo(escrowATA);
            if (!escrowAccount) {
                console.log('Creating escrow token account');
                const createATAIx = window.SplToken.createAssociatedTokenAccountInstruction(
                    wallet.publicKey,
                    escrowATA,
                    escrowPDA,
                    this.lawbMint,
                    this.tokenProgram,
                    this.associatedTokenProgram
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
            const wallet = this.getConnectedWallet();
            if (!wallet) {
                this.updateBetStatus('Please connect your wallet first', 'error');
                return;
            }

            const betInput = document.getElementById('betAmount');
            const amount = betInput ? Number(betInput.value) : 0;
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
            const { data: game } = await this.supabase
                .from('chess_games')
                .select('*')
                .eq('game_id', gameCode)
                .eq('game_state', 'waiting')
                .single();
    
            if (!game) {
                throw new Error('Game not found or already started');
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
                    game_state: 'active'
                })
                .eq('game_id', gameCode);
    
            if (updateError) throw updateError;
    
            this.updateBetStatus('Successfully joined game!', 'success');
            
            // Initialize game UI for red player (joiner)
            if (window.multiplayerManager) {
                window.multiplayerManager.gameId = gameCode;
                window.multiplayerManager.playerColor = 'red';
                window.multiplayerManager.subscribeToGame();
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
            const { escrowPDA } = await this.createBetEscrow(game.game_id, game.bet_amount);

            // Update bet record
            const { error: betError } = await this.supabase
                .from('chess_bets')
                .update({
                    red_player: wallet.publicKey.toString(),
                    status: 'matched'
                })
                .eq('game_id', game.game_id);

            if (betError) throw betError;

            return true;
        } catch (error) {
            console.error('Error matching bet:', error);
            throw error;
        }
    }

    async createGameRecord(gameId, playerAddress, amount, escrowPDA) {
        try {
            // Get initial board state from the chess game
            const initialBoardState = {
                positions: [
                    ['R', 'N', 'B', 'Q', 'K', 'B', 'N', 'R'],
                    ['P', 'P', 'P', 'P', 'P', 'P', 'P', 'P'],
                    [null, null, null, null, null, null, null, null],
                    [null, null, null, null, null, null, null, null],
                    [null, null, null, null, null, null, null, null],
                    [null, null, null, null, null, null, null, null],
                    ['p', 'p', 'p', 'p', 'p', 'p', 'p', 'p'],
                    ['r', 'n', 'b', 'q', 'k', 'b', 'n', 'r']
                ],
                pieceState: {}
            };
    
            const record = {
                game_id: gameId,
                blue_player: playerAddress,
                bet_amount: amount,
                escrow_account: escrowPDA.toString(),
                game_state: 'waiting',
                current_player: 'blue',
                board: initialBoardState,
                piece_state: {}
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
                status: 'pending'
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

    handleBetUpdate(payload) {
        try {
            const bet = payload.new;
            if (!bet || !this.currentBet.isActive) return;
    
            if (bet.game_id === this.currentBet.gameId) {
                if (bet.status === 'matched' && bet.red_player) {
                    this.currentBet.matched = true;
                    this.currentBet.redPlayer = bet.red_player;
                    this.updateBetStatus('Bet matched! Game starting...', 'success');
                    
                    // Initialize game for blue player (creator)
                    if (window.multiplayerManager) {
                        window.multiplayerManager.showGame('blue');
                        window.multiplayerManager.gameId = bet.game_id;
                        window.multiplayerManager.playerColor = 'blue';
                        window.multiplayerManager.subscribeToGame();
                    }
                }
            }
        } catch (error) {
            console.error('Error handling bet update:', error);
        }
    }

    handleGameUpdate(payload) {
        try {
            const game = payload.new;
            if (!game || !this.currentBet.isActive) return;

            if (game.game_id === this.currentBet.gameId) {
                if (game.game_state === 'completed' && game.winner) {
                    this.processWinner(game.winner);
                }
            }
        } catch (error) {
            console.error('Error handling game update:', error);
        }
    }

    async processWinner(winner) {
        if (!this.currentBet.isActive) return;

        try {
            const wallet = this.getConnectedWallet();
            if (!wallet) throw new Error('No wallet connected');

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

            // Process payouts
            await Promise.all([
                // Winner payout
                this.sendAndConfirmTransaction(
                    new solanaWeb3.Transaction().add(
                        this.config.createTransferInstruction(
                            escrowATA,
                            winnerATA,
                            escrowPDA,
                            winnerAmount * Math.pow(10, this.config.LAWB_TOKEN.DECIMALS)
                        )
                    )
                ),
                // House fee
                this.sendAndConfirmTransaction(
                    new solanaWeb3.Transaction().add(
                        this.config.createTransferInstruction(
                            escrowATA,
                            houseATA,
                            escrowPDA,
                            houseFee * Math.pow(10, this.config.LAWB_TOKEN.DECIMALS)
                        )
                    )
                )
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

    async updateGameRecord(gameId, winner) {
        try {
            const { error } = await this.supabase
                .from('chess_games')
                .update({
                    game_state: 'completed',
                    winner: winner,
                    updated_at: new Date().toISOString()
                })
                .eq('game_id', gameId);

            if (error) throw error;
        } catch (error) {
            console.error('Error updating game record:', error);
            throw error;
        }
    }

    async updateBetRecord(betId, winner) {
        try {
            const { error } = await this.supabase
                .from('chess_bets')
                .update({
                    status: 'completed',
                    winner: winner,
                    processed_at: new Date().toISOString()
                })
                .eq('id', betId);

            if (error) throw error;
        } catch (error) {
            console.error('Error updating bet record:', error);
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

    getConnectedWallet() {
        const wallet = window.solflare?.isConnected ? window.solflare : 
                      window.solana?.isConnected ? window.solana : null;
                      
        if (!wallet) {
            this.updateBetStatus('No wallet connected', 'error');
        }
        return wallet;
    }

    updateBetStatus(message, type = 'info') {
        const statusElement = document.getElementById('betStatus');
        if (statusElement) {
            statusElement.textContent = message;
            statusElement.className = `bet-status ${type}`;
        }
        console.log(`Bet status: ${message}`);
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

    showCopyNotification() {
        const notification = document.getElementById('copyNotification');
        if (notification) {
            notification.style.display = 'block';
            setTimeout(() => {
                notification.style.display = 'none';
            }, 2000);
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