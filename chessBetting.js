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

    async findEscrowPDAWithBump(gameId) {
        try {
            const [pda, bump] = await solanaWeb3.PublicKey.findProgramAddress(
                [Buffer.from(gameId)],
                this.tokenProgram
            );
            return { pda, bump };
        } catch (error) {
            console.error('Error finding escrow PDA with bump:', error);
            throw error;
        }
    }

    async cleanupOldGames() {
        try {
            const wallet = this.getConnectedWallet();
            if (!wallet) return;
    
            const walletAddress = wallet.publicKey.toString();
    
            // Get all games where this wallet is a player
            const { data: activeGames } = await this.supabase
                .from('chess_games')
                .select('*')
                .or(`blue_player.eq.${walletAddress},red_player.eq.${walletAddress}`)
                .in('game_state', ['waiting', 'active']);
    
            if (!activeGames || activeGames.length === 0) return;
    
            // Process each game
            for (const game of activeGames) {
                console.log('Cleaning up old game:', game.game_id);
                await this.cancelGameAndRefund(game.game_id);
            }
        } catch (error) {
            console.error('Error cleaning up old games:', error);
        }
    }

    async checkForActiveBets() {
        try {
            const wallet = this.getConnectedWallet();
            if (!wallet) return;
    
            // First get all non-terminal bets for this player
            const { data: activeBets, error } = await this.supabase
                .from('chess_bets')
                .select('*')
                .eq('blue_player', wallet.publicKey.toString())
                .not('status', 'in', '(cancelled,completed,ended)');
    
            if (error) {
                console.error('Error querying active bets:', error);
                return false;
            }
    
            if (!activeBets?.length) return;
    
            console.log('Found user active bets:', activeBets);
            
            // Process each bet
            for (const bet of activeBets) {
                // Get corresponding game state
                const { data: game } = await this.supabase
                    .from('chess_games')
                    .select('*')
                    .eq('game_id', bet.game_id)
                    .single();
    
                if (!game) continue;
    
                // If game is ended/cancelled, just update bet record to match
                if (game.game_state === 'ended' || game.game_state === 'cancelled') {
                    await this.supabase
                        .from('chess_bets')
                        .update({
                            status: game.game_state === 'ended' ? 'completed' : 'cancelled',
                            processed_at: new Date().toISOString(),
                            winner: game.winner
                        })
                        .eq('game_id', bet.game_id);
                    continue;
                }
    
                // For active games with matched bets, try to recover
                if (bet.status === 'matched' && game.game_state === 'active') {
                    await this.recoverActiveGame(bet).catch(err => {
                        console.error('Failed to recover active game:', err);
                    });
                    return;
                }
    
                // For pending bets in waiting state, keep them
                if (bet.status === 'pending' && game.game_state === 'waiting') {
                    continue;
                }
    
                // Cancel any other pending bets
                if (bet.status === 'pending') {
                    await this.cancelGameAndRefund(bet.game_id).catch(err => {
                        console.error('Failed to cancel pending bet:', err);
                    });
                }
            }
    
            return true;
        } catch (error) {
            console.error('Error checking active bets:', error);
            return false;
        }
    }

    async recoverActiveGame(bet) {
        try {
            console.log('Recovering active game:', bet);
            
            const { data: game } = await this.supabase
                .from('chess_games')
                .select('*')
                .eq('game_id', bet.game_id)
                .single();
                        
            if (!game) {
                console.log('No game found to recover');
                return;
            }
        
            console.log('Found active game:', game);
        
            // If game is ended or cancelled, clean up and return
            if (game.game_state === 'ended' || game.game_state === 'cancelled') {
                console.log(`Game ${game.game_id} is ${game.game_state}, cleaning up...`);
                // Just update bet status if needed
                const { data: activeBet } = await this.supabase
                    .from('chess_bets')
                    .select('status')
                    .eq('game_id', game.game_id)
                    .single();
                        
                if (activeBet && activeBet.status !== 'completed' && activeBet.status !== 'cancelled') {
                    await this.supabase
                        .from('chess_bets')
                        .update({
                            status: game.game_state === 'ended' ? 'completed' : 'cancelled',
                            processed_at: new Date().toISOString(),
                            winner: game.winner
                        })
                        .eq('game_id', game.game_id);
                }
                return;
            }
    
            // Reset game state if needed
            if (game.game_state !== 'active' && game.game_state !== 'waiting') {
                await this.supabase
                    .from('chess_games')
                    .update({
                        game_state: 'active',
                        updated_at: new Date().toISOString()
                    })
                    .eq('game_id', game.game_id);
            }
    
            // Determine player color and set current bet state
            const wallet = this.getConnectedWallet();
            if (!wallet) return;
            
            const playerAddress = wallet.publicKey.toString();
            const isBluePlayer = playerAddress === bet.blue_player;
            const playerColor = isBluePlayer ? 'blue' : 'red';
    
            this.currentBet = {
                amount: bet.bet_amount,
                bluePlayer: bet.blue_player,
                redPlayer: bet.red_player,
                gameId: bet.game_id,
                betId: bet.id,
                isActive: true,
                escrowAccount: bet.escrow_account,
                matched: bet.status === 'matched',
                status: bet.status
            };
    
            // Initialize multiplayer
            if (window.multiplayerManager) {
                const mm = window.multiplayerManager;
                mm.gameId = bet.game_id;
                mm.playerColor = playerColor;
                mm.currentGameState = game;
                
                await mm.subscribeToGame();
                mm.showGame(playerColor);
    
                const gameCodeDisplay = document.getElementById('gameCodeDisplay');
                const gameCode = document.getElementById('gameCode');
                if (gameCodeDisplay && gameCode) {
                    gameCode.textContent = bet.game_id;
                    gameCodeDisplay.style.display = 'block';
                }
    
                this.disableBetting();
                
                console.log('Game recovered successfully:', {
                    gameId: bet.game_id,
                    playerColor,
                    gameState: game
                });
    
                this.updateBetStatus('Rejoined active game', 'success');
            }
        } catch (error) {
            console.error('Error recovering game:', error);
            this.updateBetStatus('Could not recover previous game: ' + error.message, 'error');
        }
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
    
            // Check for and cancel any active bets for this wallet
            await this.checkForActiveBets();
    
            // Rest of initialization code...
            await this.verifySetup();
            this.initializeUI();
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
            
            // Test Supabase connection directly first
            console.log('Testing Supabase connection...');
            try {
                const { data, error } = await this.supabase
                    .from('chess_games')
                    .select('id')
                    .limit(1);
    
                if (error) {
                    console.warn('Supabase connection test warning:', error);
                    // Continue anyway as this isn't critical
                } else {
                    console.log('Supabase connection verified');
                }
            } catch (err) {
                console.warn('Supabase test error - continuing:', err);
                // Continue anyway
            }
    
            // Basic Solana connection test
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

    async syncBetWithGameState(gameId) {
        try {
            // Get current game and bet status
            const { data: game } = await this.supabase
                .from('chess_games')
                .select('*')
                .eq('game_id', gameId)
                .single();
    
            if (!game) {
                console.log('No game found to sync');
                return;
            }
    
            const { data: bet } = await this.supabase
                .from('chess_bets')
                .select('*')
                .eq('game_id', gameId)
                .single();
    
            if (!bet) {
                console.log('No bet found to sync');
                return;
            }
    
            // Update bet status based on game state
            let betStatus = bet.status;
            if (game.game_state === 'completed') {
                betStatus = 'completed';
            } else if (game.game_state === 'cancelled') {
                betStatus = 'cancelled';
            } else if (game.red_player) {
                betStatus = 'matched';
            }
    
            // Update bet if status needs to change
            if (betStatus !== bet.status) {
                await this.supabase
                    .from('chess_bets')
                    .update({
                        status: betStatus,
                        winner: game.winner,
                        processed_at: game.game_state === 'completed' ? new Date().toISOString() : null
                    })
                    .eq('game_id', gameId);
            }
    
            return { game, bet };
        } catch (error) {
            console.error('Error syncing bet state:', error);
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
    
            // Add cancel game button handler
            const cancelGameBtn = document.getElementById('cancel-game-bet');
            if (cancelGameBtn) {
                cancelGameBtn.onclick = async () => {
                    try {
                        if (!this.currentBet.gameId) {
                            this.updateBetStatus('No active game to cancel', 'error');
                            return;
                        }
    
                        this.updateBetStatus('Cancelling game and processing refunds...', 'processing');
                        await this.cancelGameAndRefund(this.currentBet.gameId);
                        this.updateBetStatus('Game cancelled and refunds processed', 'success');
                        this.resetBetState();
                        
                        // Reset UI
                        const gameCodeDisplay = document.getElementById('gameCodeDisplay');
                        if (gameCodeDisplay) gameCodeDisplay.style.display = 'none';
                        
                        if (window.multiplayerManager) {
                            window.multiplayerManager.leaveGame();
                        }
                    } catch (error) {
                        console.error('Error cancelling game:', error);
                        this.updateBetStatus('Failed to cancel game: ' + error.message, 'error');
                    }
                };
            }

            const auditBtn = document.getElementById('audit-bets');
        if (auditBtn) {
            auditBtn.onclick = async () => {
                try {
                    this.updateBetStatus('Auditing bets and recovering funds...', 'processing');
                    await this.auditAndRecoverFunds();
                    this.updateBetStatus('Audit complete', 'success');
                } catch (error) {
                    console.error('Audit failed:', error);
                    this.updateBetStatus('Audit failed: ' + error.message, 'error');
                }
            };
        }
    
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
            const wallet = this.getConnectedWallet();
            if (!wallet) throw new Error('No wallet connected');
    
            // Generate escrow PDA
            const { pda: escrowPDA, bump } = await this.config.findEscrowPDAWithBump(gameId);
            
            console.log('Generated escrow PDA:', {
                address: escrowPDA.toString(),
                bump,
                gameId
            });
    
            // Get token accounts
            const playerATA = await this.config.findAssociatedTokenAddress(
                wallet.publicKey,
                this.lawbMint
            );
    
            const escrowATA = await this.config.findAssociatedTokenAddress(
                escrowPDA,
                this.lawbMint
            );
    
            // Create transaction
            const transaction = new solanaWeb3.Transaction();
    
            // Create escrow ATA if needed
            const escrowATAInfo = await this.connection.getAccountInfo(escrowATA);
            if (!escrowATAInfo) {
                const createATAIx = window.SplToken.createAssociatedTokenAccountInstruction(
                    wallet.publicKey,  // Payer
                    escrowATA,        // Associated token account
                    escrowPDA,        // Token account owner
                    this.lawbMint     // Token mint
                );
                transaction.add(createATAIx);
            }
    
            // Add token transfer instruction
            const nativeAmount = this.config.LAWB_TOKEN.convertToNative(amount);
            const transferIx = window.SplToken.createTransferInstruction(
                playerATA,           // Source
                escrowATA,          // Destination 
                wallet.publicKey,    // Authority
                BigInt(nativeAmount.toString())
            );
            transaction.add(transferIx);
    
            // Get latest blockhash
            const { blockhash } = await this.connection.getLatestBlockhash('confirmed');
            transaction.recentBlockhash = blockhash;
            transaction.feePayer = wallet.publicKey;
    
            // Sign and send transaction
            const signed = await wallet.signTransaction(transaction);
    
            // Send and confirm transaction
            const signature = await this.connection.sendRawTransaction(
                signed.serialize(),
                {
                    skipPreflight: false,
                    preflightCommitment: 'confirmed',
                    maxRetries: 3
                }
            );
    
            await this.connection.confirmTransaction(signature, 'confirmed');
    
            console.log('Escrow setup complete:', {
                signature,
                escrowPDA: escrowPDA.toString(),
                escrowATA: escrowATA.toString(),
                amount: nativeAmount.toString()
            });
    
            return { 
                escrowPDA, 
                escrowATA, 
                signature, 
                escrowBump: bump 
            };
    
        } catch (error) {
            console.error('Error creating bet escrow:', error);
            throw error;
        }
    }

    async handleCreateGameWithBet() {
        let gameId = null;
        let escrowPDA = null;
    
        try {
            const wallet = this.getConnectedWallet();
            if (!wallet) {
                this.updateBetStatus('Please connect your wallet first', 'error');
                return;
            }
    
            await this.cleanupOldGames();
    
            const betInput = document.getElementById('betAmount');
            const rawAmount = betInput ? Number(betInput.value) : 0;
            if (!this.validateBetAmount(rawAmount)) return;
    
            console.log('Creating bet:', {
                rawAmount,
                decimals: this.config.LAWB_TOKEN.DECIMALS
            });
    
            console.log('Creating bet for', rawAmount, '$LAWB');
            this.updateBetStatus(`Creating bet for ${rawAmount} $LAWB...`, 'processing');
            
            // Generate game ID and setup escrow
            gameId = Math.random().toString(36).substring(2, 8).toUpperCase();
            console.log('Generated game ID:', gameId);
    
            // Create escrow
            this.updateBetStatus('Creating escrow account...', 'processing');
            const escrowResult = await this.createBetEscrow(gameId, rawAmount);
            escrowPDA = escrowResult.escrowPDA;
    
            // Create game record first
            this.updateBetStatus('Creating game record...', 'processing');
            const gameRecord = await this.createGameRecord(
                gameId, 
                wallet.publicKey.toString(), 
                rawAmount,
                escrowPDA
            );
    
            // Verify game was created
            const { data: verifyGame } = await this.supabase
                .from('chess_games')
                .select('*')
                .eq('game_id', gameId)
                .single();
    
            if (!verifyGame) {
                throw new Error('Failed to verify game creation');
            }
    
            // Then create bet record
            this.updateBetStatus('Creating bet record...', 'processing');
            const betRecord = await this.createBetRecord(
                gameId,
                wallet.publicKey.toString(),
                rawAmount,
                escrowPDA
            );
    
            this.currentBet = {
                amount: rawAmount,
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
    
            console.log('Game and bet created successfully:', {
                gameId,
                betId: betRecord.id,
                escrowAccount: escrowPDA.toString()
            });
    
            this.updateBetStatus('Game created successfully!', 'success');
            this.disableBetting();
    
        } catch (error) {
            console.error('Error creating game with bet:', error);
            
            const errorMessage = error.message || error.toString();
            const details = error.details || '';
            this.updateBetStatus(`Failed to create game: ${errorMessage} ${details}`, 'error');
            
            // Attempt cleanup if escrow was created but database failed
            try {
                if (gameId && escrowPDA) {
                    await this.cancelGameAndRefund(gameId);
                }
            } catch (cleanupError) {
                console.error('Cleanup failed:', cleanupError);
            }
            
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
    
            console.log('Attempting to join game:', gameCode);
            this.updateBetStatus('Joining game...', 'processing');
    
            // Get game without state filter first
            const { data: games, error: queryError } = await this.supabase
                .from('chess_games')
                .select('*')
                .eq('game_id', gameCode);
    
            if (queryError || !games || games.length === 0) {
                throw new Error('Game not found');
            }
    
            const game = games[0];
            console.log('Found game:', game);
    
            // Check if player is already in the game
            const walletAddress = wallet.publicKey.toString();
            if (game.blue_player === walletAddress || game.red_player === walletAddress) {
                console.log('Player already in game - attempting to rejoin');
                await this.recoverActiveGame(game);
                return;
            }
    
            // Validate game state
            if (game.game_state === 'ended' || game.game_state === 'cancelled') {
                throw new Error(`Game is ${game.game_state}`);
            }
    
            if (game.game_state !== 'waiting' && game.game_state !== 'active') {
                throw new Error(`Cannot join game in ${game.game_state} state`);
            }
    
            if (game.red_player) {
                throw new Error('Game is full');
            }
    
            // Check if there's an active bet
            const { data: activeBet } = await this.supabase
                .from('chess_bets')
                .select('*')
                .eq('game_id', gameCode)
                .eq('status', 'pending')
                .single();
    
            if (!activeBet) {
                throw new Error('Bet not found for this game');
            }
    
            console.log('Matching bet:', activeBet);
    
            // Handle bet matching
            await this.matchBet(game);
    
            // Update game state
            const { data: updateData, error: updateError } = await this.supabase
                .from('chess_games')
                .update({
                    red_player: walletAddress,
                    game_state: 'active',
                    updated_at: new Date().toISOString()
                })
                .eq('game_id', gameCode)
                .select()
                .single();
    
            if (updateError) {
                throw new Error('Failed to update game state');
            }
    
            this.updateBetStatus('Successfully joined game!', 'success');
    
            // Initialize game UI
            if (window.multiplayerManager) {
                const mm = window.multiplayerManager;
                mm.gameId = gameCode;
                mm.playerColor = 'red';
                mm.currentGameState = updateData;
                await mm.subscribeToGame();
                mm.showGame('red');
            } else {
                throw new Error('Game system not ready');
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
            console.log('Creating game record:', {
                gameId,
                playerAddress,
                amount,
                escrowPDA: escrowPDA.toString()
            });
    
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
                piece_state: {},
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
            };
    
            console.log('Inserting game record:', record);
    
            const { data, error } = await this.supabase
                .from('chess_games')
                .insert([record])
                .select()
                .single();
    
            if (error) {
                console.error('Supabase error creating game:', error);
                throw error;
            }
    
            console.log('Game record created successfully:', data);
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

    async handleBetUpdate(payload) {
        try {
            const bet = payload.new;
            console.log('Received bet update:', bet);
            
            if (!bet || !this.currentBet.isActive) {
                console.log('Ignoring bet update - no active bet or invalid update');
                return;
            }
    
            if (bet.game_id === this.currentBet.gameId) {
                console.log('Processing matching bet update:', {
                    status: bet.status,
                    gameId: bet.game_id,
                    currentBet: this.currentBet
                });
                
                if (bet.status === 'matched' && bet.red_player) {
                    console.log('Bet matched, initializing game for player 1');
                    this.currentBet.matched = true;
                    this.currentBet.redPlayer = bet.red_player;
                    this.updateBetStatus('Bet matched! Game starting...', 'success');
                    
                    // Initialize game for blue player (creator)
                    if (window.multiplayerManager) {
                        const mm = window.multiplayerManager;
                        
                        // Get game state before showing game
                        const { data: gameState } = await this.supabase
                            .from('chess_games')
                            .select('*')
                            .eq('game_id', bet.game_id)
                            .single();
                            
                        console.log('Setting up multiplayer game for player 1:', {
                            gameId: bet.game_id,
                            playerColor: 'blue'
                        });
                        
                        mm.gameId = bet.game_id;
                        mm.playerColor = 'blue';
                        mm.currentGameState = gameState;
                        await mm.subscribeToGame();
                        mm.showGame('blue');
                        
                        console.log('Checking game initialization:', {
                            gameId: mm.gameId,
                            playerColor: mm.playerColor,
                            isMultiplayerMode: mm.isMultiplayerMode,
                            gameState: mm.currentGameState
                        });
                    } else {
                        console.error('Multiplayer manager not available for player 1!');
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
        if (!this.currentBet.isActive) {
            console.log('No active bet to process');
            return;
        }
    
        try {
            const wallet = this.getConnectedWallet();
            if (!wallet) throw new Error('No wallet connected');
    
            // Set winner in current bet state
            this.currentBet.winner = winner;
    
            // Sync bet with game state first
            const { game, bet } = await this.syncBetWithGameState(this.currentBet.gameId);
            
            // Only process if bet hasn't been processed yet
            if (bet.status === 'completed') {
                console.log('Bet already processed');
                return;
            }
    
            // Get the escrow PDA and bump
            const { pda: escrowPDA, bump: escrowBump } = await this.config.findEscrowPDAWithBump(this.currentBet.gameId);
    
            const escrowATA = await this.config.findAssociatedTokenAddress(
                escrowPDA,
                this.lawbMint
            );
    
            // Calculate payouts
            const totalAmount = this.currentBet.amount * 2;
            const houseFee = Math.floor(totalAmount * this.config.HOUSE_FEE_PERCENTAGE / 100);
            const winnerAmount = totalAmount - houseFee;
    
            // Convert to native amounts
            const nativeWinnerAmount = this.config.LAWB_TOKEN.convertToNative(winnerAmount);
            const nativeHouseFee = this.config.LAWB_TOKEN.convertToNative(houseFee);
    
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
    
            // Process transactions
            const signature = await this.processPayout(
                escrowPDA,
                escrowATA,
                winnerATA,
                houseATA,
                nativeWinnerAmount,
                nativeHouseFee,
                escrowBump
            );
    
            this.updateBetStatus(`Winner paid out successfully! Amount: ${winnerAmount} $LAWB`, 'success');
            this.resetBetState();
    
            return signature;
    
        } catch (error) {
            console.error('Error processing winner:', error);
            this.updateBetStatus('Failed to process winner: ' + error.message, 'error');
            throw error;
        }
    }
    
    // Add this helper function for the payout transaction
    async processPayout(escrowPDA, escrowATA, winnerATA, houseATA, winnerAmount, houseFee, escrowBump) {
        try {
            const wallet = this.getConnectedWallet();
            if (!wallet) throw new Error('No wallet connected');
    
            console.log('Processing payout:', {
                escrowPDA: escrowPDA.toString(),
                escrowATA: escrowATA.toString(),
                winnerATA: winnerATA.toString(),
                houseATA: houseATA.toString(),
                winnerAmount: winnerAmount.toString(),
                houseFee: houseFee.toString(),
                escrowBump
            });
    
            // Create new transaction
            const transaction = new solanaWeb3.Transaction();
    
            // Add winner payout instruction with PDA as authority
            const winnerPayoutIx = new solanaWeb3.TransactionInstruction({
                keys: [
                    { pubkey: escrowATA, isSigner: false, isWritable: true },
                    { pubkey: winnerATA, isSigner: false, isWritable: true },
                    { pubkey: escrowPDA, isSigner: true, isWritable: false }
                ],
                programId: this.tokenProgram,
                data: Buffer.from([
                    3,  // Transfer instruction
                    ...new solanaWeb3.BN(winnerAmount.toString()).toArray('le', 8)
                ])
            });
            transaction.add(winnerPayoutIx);
    
            // Add house fee instruction with PDA as authority
            const houseFeeIx = new solanaWeb3.TransactionInstruction({
                keys: [
                    { pubkey: escrowATA, isSigner: false, isWritable: true },
                    { pubkey: houseATA, isSigner: false, isWritable: true },
                    { pubkey: escrowPDA, isSigner: true, isWritable: false }
                ],
                programId: this.tokenProgram,
                data: Buffer.from([
                    3,  // Transfer instruction
                    ...new solanaWeb3.BN(houseFee.toString()).toArray('le', 8)
                ])
            });
            transaction.add(houseFeeIx);
    
            // Get latest blockhash
            const { blockhash, lastValidBlockHeight } = await this.connection.getLatestBlockhash('confirmed');
            transaction.recentBlockhash = blockhash;
            transaction.feePayer = wallet.publicKey;
            
            // Sign with PDA using correct seeds
            transaction.partialSign({
                publicKey: escrowPDA,
                secretKey: null,
                sign: () => {},
                seeds: [
                    Buffer.from(this.currentBet.gameId),
                    Buffer.from([escrowBump])
                ]
            });
    
            // Sign with wallet
            const signed = await wallet.signTransaction(transaction);
    
            console.log('Sending payout transaction...');
            const signature = await this.connection.sendRawTransaction(
                signed.serialize(),
                {
                    skipPreflight: false,
                    preflightCommitment: 'confirmed',
                    maxRetries: 3
                }
            );
    
            await this.connection.confirmTransaction({
                signature,
                blockhash,
                lastValidBlockHeight
            }, 'confirmed');
    
            console.log('Payout transaction confirmed:', signature);
    
            // Update database records
            await Promise.all([
                this.supabase
                    .from('chess_games')
                    .update({
                        game_state: 'completed',
                        winner: this.currentBet.winner,
                        processed_at: new Date().toISOString()
                    })
                    .eq('game_id', this.currentBet.gameId),
    
                this.supabase
                    .from('chess_bets')
                    .update({
                        status: 'completed',
                        winner: this.currentBet.winner,
                        processed_at: new Date().toISOString()
                    })
                    .eq('id', this.currentBet.betId)
            ]);
    
            return signature;
    
        } catch (error) {
            console.error('Payout transaction failed:', error);
            throw error;
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
    
            // Get fresh blockhash
            const { blockhash, lastValidBlockHeight } = 
                await this.connection.getLatestBlockhash('confirmed');
            
            transaction.recentBlockhash = blockhash;
            transaction.feePayer = wallet.publicKey;
    
            console.log('Sending transaction with blockhash:', blockhash);
            
            // Sign with wallet immediately after setting blockhash
            const signed = await wallet.signTransaction(transaction);
    
            // Send immediately after signing
            const signature = await this.connection.sendRawTransaction(
                signed.serialize(),
                {
                    skipPreflight: false,
                    preflightCommitment: 'confirmed',
                    maxRetries: 5
                }
            );
    
            console.log('Awaiting confirmation for:', signature);
    
            // More aggressive confirmation check
            const confirmation = await this.connection.confirmTransaction({
                signature,
                blockhash,
                lastValidBlockHeight
            }, 'confirmed');
    
            if (confirmation.value.err) {
                throw new Error('Transaction failed to confirm: ' + confirmation.value.err);
            }
    
            console.log('Transaction confirmed successfully');
            return signature;
    
        } catch (error) {
            // If it's a blockhash error, retry once
            if (error.message.includes('Blockhash not found')) {
                console.log('Blockhash expired, retrying transaction...');
                
                // Get fresh blockhash
                const { blockhash, lastValidBlockHeight } = 
                    await this.connection.getLatestBlockhash('confirmed');
                
                transaction.recentBlockhash = blockhash;
                
                // Try again with new blockhash
                const signed = await wallet.signTransaction(transaction);
                const signature = await this.connection.sendRawTransaction(
                    signed.serialize(),
                    {
                        skipPreflight: false,
                        preflightCommitment: 'confirmed',
                        maxRetries: 5
                    }
                );
    
                console.log('Retried transaction sent:', signature);
    
                const confirmation = await this.connection.confirmTransaction({
                    signature,
                    blockhash,
                    lastValidBlockHeight
                }, 'confirmed');
    
                if (confirmation.value.err) {
                    throw new Error('Retry transaction failed to confirm: ' + confirmation.value.err);
                }
    
                console.log('Retry transaction confirmed successfully');
                return signature;
            }
    
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
        amount = Number(amount);
        if (!Number.isInteger(amount)) {
            if (showError) this.updateBetStatus('Bet amount must be a whole number', 'error');
            return false;
        }
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

    async cancelGameAndRefund(gameId) {
        try {
            console.log('Cancellation requested for game:', gameId);
            
            // Get current game and bet status
            const { data: game } = await this.supabase
                .from('chess_games')
                .select('*')
                .eq('game_id', gameId)
                .single();
    
            if (!game) {
                throw new Error('Game not found');
            }
    
            // Only process cancellation if game isn't already cancelled or ended
            if (game.game_state !== 'cancelled' && game.game_state !== 'ended') {
                // Update database records first
                await Promise.all([
                    this.supabase
                        .from('chess_games')
                        .update({
                            game_state: 'cancelled',
                            updated_at: new Date().toISOString(),
                            current_player: null,
                            winner: null
                        })
                        .eq('game_id', gameId),
                    
                    this.supabase
                        .from('chess_bets')
                        .update({
                            status: 'cancelled',
                            processed_at: new Date().toISOString(),
                            winner: null
                        })
                        .eq('game_id', gameId)
                ]);
    
                // Get bet details and process refunds if needed
                const { data: bet } = await this.supabase
                    .from('chess_bets')
                    .select('*')
                    .eq('game_id', gameId)
                    .single();
    
                if (bet && bet.status !== 'refunded') {
                    await this.processRefunds(bet);
                }
            }
            
            // Update UI and reset state
            this.updateBetStatus('Game cancelled and refunds processed', 'success');
            this.resetBetState();
    
            // Reset multiplayer if active
            if (window.multiplayerManager) {
                window.multiplayerManager.leaveGame();
            }
            
            return true;
        } catch (error) {
            console.error('Error cancelling game:', error);
            this.updateBetStatus('Failed to cancel game: ' + error.message, 'error');
            throw error;
        }
    }
    
    // Add this helper function right after processRefunds
async processPlayerRefund(escrowPDA, escrowATA, playerAddress, refundAmount, gameId, escrowBump) {
    const playerATA = await this.config.findAssociatedTokenAddress(
        new solanaWeb3.PublicKey(playerAddress),
        this.lawbMint
    );

    const refundIx = this.config.createTransferInstruction(
        escrowATA,
        playerATA,
        escrowPDA,
        refundAmount.toString()
    );

    const transaction = new solanaWeb3.Transaction().add(refundIx);
    transaction.feePayer = this.getConnectedWallet().publicKey;
    
    const { blockhash } = await this.connection.getLatestBlockhash();
    transaction.recentBlockhash = blockhash;
    
    const signedTx = await this.getConnectedWallet().signTransaction(transaction);

    return await solanaWeb3.sendAndConfirmTransaction(
        this.connection,
        signedTx,
        [
            {
                publicKey: escrowPDA,
                secretKey: null,
                seeds: [Buffer.from(gameId), Buffer.from([escrowBump])]
            }
        ],
        {
            skipPreflight: false,
            commitment: 'confirmed',
            preflightCommitment: 'confirmed'
        }
    );
}

async processRefunds(bet) {
    try {
        console.log('Starting refund process for game:', bet.game_id);
        
        // Get the escrow PDA and bump
        const [escrowPDA, escrowBump] = await solanaWeb3.PublicKey.findProgramAddress(
            [Buffer.from(bet.game_id)],
            this.tokenProgram
        );
        console.log('Escrow PDA:', escrowPDA.toString());

        const escrowATA = await this.config.findAssociatedTokenAddress(
            escrowPDA,
            this.lawbMint
        );

        // Convert UI amount to native
        const refundAmount = this.config.LAWB_TOKEN.convertToNative(bet.bet_amount);
        console.log('Refund amount:', {ui: bet.bet_amount, native: refundAmount});

        // Process refunds for both players if matched bet
        const refundPromises = [];

        // Refund blue player
        if (bet.blue_player) {
            await this.processPlayerRefund(escrowPDA, escrowATA, bet.blue_player, refundAmount, bet.game_id, escrowBump);
        }

        // Refund red player if matched
        if (bet.red_player && bet.status === 'matched') {
            await this.processPlayerRefund(escrowPDA, escrowATA, bet.red_player, refundAmount, bet.game_id, escrowBump);
        }

        console.log('Refunds processed successfully');
        return true;

    } catch (error) {
        console.error('Error processing refunds:', error);
        throw error;
    }
}

    cleanup() {
        console.log('Cleanup called:', {
            isInitialized: this.initialized,
            currentBet: this.currentBet,
            stack: new Error().stack
        });
    
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
    
        // Only cancel active bets if explicitly requested
        this.initialized = false;
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
    }

    // Add this to chessBetting.js
async auditAndRecoverFunds() {
    try {
        const wallet = this.getConnectedWallet();
        if (!wallet) return;

        console.log('Starting funds recovery audit...');

        // Get all bets for this user
        const { data: allBets } = await this.supabase
            .from('chess_bets')
            .select('*')
            .eq('blue_player', wallet.publicKey.toString());

        if (!allBets?.length) {
            console.log('No bets found for recovery');
            return;
        }

        console.log('Found bets to audit:', allBets);

        for (const bet of allBets) {
            // Get game state
            const { data: game } = await this.supabase
                .from('chess_games')
                .select('*')
                .eq('game_id', bet.game_id)
                .single();

            if (!game) {
                console.log(`No game found for bet ${bet.game_id}`);
                continue;
            }

            console.log(`Auditing game ${bet.game_id}:`, {
                gameState: game.game_state,
                betStatus: bet.status,
                escrowAccount: bet.escrow_account
            });

            // Check escrow account
            const escrowATA = await this.config.findAssociatedTokenAddress(
                new solanaWeb3.PublicKey(bet.escrow_account),
                this.lawbMint
            );

            try {
                const balance = await this.connection.getTokenAccountBalance(escrowATA);
                console.log(`Escrow balance for ${bet.game_id}:`, balance.value.uiAmount);

                // If there are funds but game is ended/cancelled, process refund
                if (balance.value.uiAmount > 0) {
                    if (game.game_state === 'ended') {
                        if (!bet.processed_at) {
                            console.log(`Processing winner payout for ${bet.game_id}`);
                            await this.processWinner(game.winner).catch(console.error);
                        }
                    } else if (game.game_state === 'cancelled' || bet.status === 'cancelled') {
                        console.log(`Processing refund for ${bet.game_id}`);
                        await this.processRefunds(bet).catch(console.error);
                    }
                }
            } catch (error) {
                console.error(`Error checking escrow for ${bet.game_id}:`, error);
            }
        }

    } catch (error) {
        console.error('Recovery audit failed:', error);
    }
}
}

// Create singleton instance
window.chessBetting = new ChessBetting();