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

    async checkForActiveBets() {
        try {
            const wallet = this.getConnectedWallet();
            if (!wallet) return;
    
            const { data: activeBets } = await this.supabase
                .from('chess_bets')
                .select('*')
                .eq('blue_player', wallet.publicKey.toString())  // Only check user's bets
                .not('status', 'eq', 'cancelled')
                .not('status', 'eq', 'completed');
    
            if (activeBets?.length > 0) {
                console.log('Found user active bets:', activeBets);
                // Only cancel incomplete bets from this user
                for (const bet of activeBets) {
                    if (bet.status === 'pending' || !bet.red_player) {
                        await this.cancelGameAndRefund(bet.game_id);
                    }
                }
            }
        } catch (error) {
            console.error('Error checking active bets:', error);
            // Don't throw error, just log it
            console.warn('Continuing initialization despite active bet check error');
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
            
            // Test Supabase connection first
            console.log('Testing Supabase connection...');
            const supabaseOk = await window.SUPABASE_CHECK.testConnection();
            if (!supabaseOk) {
                console.warn('Supabase connection test failed - continuing anyway');
            }
            
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
            // Add first log right at the start of the function
            console.log('LAWB Token config:', {
                decimals: this.config.LAWB_TOKEN.DECIMALS,
                minBet: this.config.MIN_BET,
                maxBet: this.config.MAX_BET
            });
    
            console.log('Creating bet escrow for game:', gameId, 'UI amount:', amount);
            
            const wallet = this.getConnectedWallet();
            if (!wallet) throw new Error('No wallet connected');
    
            // Convert UI amount to native units
            const nativeAmount = this.config.LAWB_TOKEN.convertToNative(amount);
            
            // Add detailed transfer log right here
            console.log('Transfer details:', {
                rawAmount: amount,
                nativeAmount: nativeAmount,
                nativeAmountString: nativeAmount.toString(),
                decimals: this.config.LAWB_TOKEN.DECIMALS,
                calculation: `${amount} * (10 ^ ${this.config.LAWB_TOKEN.DECIMALS})`,
                actualCalculation: amount * Math.pow(10, this.config.LAWB_TOKEN.DECIMALS)
            });
            
            console.log('Amount conversion:', {
                uiAmount: amount,
                nativeAmount: nativeAmount,
                decimals: this.config.LAWB_TOKEN.DECIMALS
            });
    
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
            console.log('Current balance:', balance.value.amount, 'Required:', nativeAmount);
            
            if (BigInt(balance.value.amount) < BigInt(nativeAmount)) {
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
    
            // Transfer tokens to escrow using the native amount
            const transferIx = this.config.createTransferInstruction(
                playerATA,
                escrowATA,
                wallet.publicKey,
                nativeAmount.toString() // Convert to string to handle large numbers safely
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
            const rawAmount = betInput ? Number(betInput.value) : 0;
            if (!this.validateBetAmount(rawAmount)) return;
    
            console.log('Creating bet:', {
                rawAmount,
                decimals: this.config.LAWB_TOKEN.DECIMALS
            });
    
            console.log('Creating bet for', rawAmount, '$LAWB');
            this.updateBetStatus(`Creating bet for ${rawAmount} $LAWB...`, 'processing');
            
            // Generate game ID and setup escrow
            const gameId = Math.random().toString(36).substring(2, 8).toUpperCase();
            console.log('Generated game ID:', gameId);
    
            // Create escrow
            this.updateBetStatus('Creating escrow account...', 'processing');
            const { escrowPDA, signature } = await this.createBetEscrow(gameId, rawAmount);
    
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
            
            // More detailed error message
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
    
            // Get game without filters first
            const { data: game } = await this.supabase
                .from('chess_games')
                .select('*')
                .eq('game_id', gameCode)
                .maybeSingle();
    
            console.log('Game lookup result:', game);
    
            if (!game) {
                throw new Error('Game not found');
            }
    
            // Validate game state
            if (game.game_state !== 'waiting') {
                throw new Error(`Game is ${game.game_state}`);
            }
    
            if (game.red_player) {
                throw new Error('Game already has a player 2');
            }
    
            if (game.blue_player === wallet.publicKey.toString()) {
                throw new Error('Cannot join your own game');
            }
    
            // Check if there's an active bet
            const { data: activeBet } = await this.supabase
                .from('chess_bets')
                .select('*')
                .eq('game_id', gameCode)
                .eq('status', 'pending')
                .maybeSingle();
    
            console.log('Found valid game to join:', {
                gameId: game.game_id,
                state: game.game_state,
                betAmount: game.bet_amount,
                activeBet
            });
    
            // Handle bet matching if needed
            if (game.bet_amount > 0) {
                if (!activeBet) {
                    throw new Error('Bet not found for this game');
                }
                console.log('Matching bet amount:', game.bet_amount);
                await this.matchBet(game);
            }
    
            // Update game state
            console.log('Updating game state for player 2');
            const { data: updateData, error: updateError } = await this.supabase
                .from('chess_games')
                .update({
                    red_player: wallet.publicKey.toString(),
                    game_state: 'active',
                    updated_at: new Date().toISOString()
                })
                .eq('game_id', gameCode)
                .eq('game_state', 'waiting')  // Extra safety check
                .select()
                .single();
    
            if (updateError || !updateData) {
                throw new Error('Failed to update game state. Game may no longer be available.');
            }
    
            console.log('Game state updated:', updateData);
    
            this.updateBetStatus('Successfully joined game!', 'success');
            
            // Initialize game UI
            if (window.multiplayerManager) {
                console.log('Initializing multiplayer game for player 2');
                
                const mm = window.multiplayerManager;
                mm.gameId = gameCode;
                mm.playerColor = 'red';
                
                console.log('Setting up game state:', {
                    gameId: mm.gameId,
                    playerColor: mm.playerColor,
                    gameState: updateData
                });
                
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

    handleBetUpdate(payload) {
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
                        console.log('Setting up multiplayer game for player 1:', {
                            gameId: bet.game_id,
                            playerColor: 'blue'
                        });
                        
                        // Set game properties
                        mm.gameId = bet.game_id;
                        mm.playerColor = 'blue';
                        
                        // Subscribe to updates
                        console.log('Subscribing to game updates for player 1');
                        mm.subscribeToGame();
                        
                        // Show game board
                        console.log('Showing game board for player 1');
                        mm.showGame('blue');
                        
                        // Verify game state
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
        if (!this.currentBet.isActive) return;
    
        try {
            const wallet = this.getConnectedWallet();
            if (!wallet) throw new Error('No wallet connected');
    
            // Get the escrow PDA and bump
            const [escrowPDA, escrowBump] = await solanaWeb3.PublicKey.findProgramAddress(
                [Buffer.from(this.currentBet.gameId)],
                this.tokenProgram
            );
    
            const escrowATA = await this.config.findAssociatedTokenAddress(
                escrowPDA,
                this.lawbMint
            );
    
            // Calculate payouts
            const totalAmount = this.currentBet.amount * 2; // Both players' bets
            const houseFee = Math.floor(totalAmount * this.config.HOUSE_FEE_PERCENTAGE / 100);
            const winnerAmount = totalAmount - houseFee;
    
            // Convert to native amounts
            const nativeWinnerAmount = this.config.LAWB_TOKEN.convertToNative(winnerAmount);
            const nativeHouseFee = this.config.LAWB_TOKEN.convertToNative(houseFee);
    
            console.log('Processing winner payout:', {
                totalAmount,
                houseFee,
                winnerAmount,
                nativeWinnerAmount: nativeWinnerAmount.toString(),
                nativeHouseFee: nativeHouseFee.toString()
            });
    
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
    
            // Create the PDA signer seeds
            const signerSeeds = [
                Buffer.from(this.currentBet.gameId),
                Buffer.from([escrowBump])
            ];
    
            // Winner payout transaction
            const winnerPayoutIx = this.config.createTransferInstruction(
                escrowATA,
                winnerATA,
                escrowPDA,
                nativeWinnerAmount.toString()
            );
    
            // House fee transaction
            const houseFeeIx = this.config.createTransferInstruction(
                escrowATA,
                houseATA,
                escrowPDA,
                nativeHouseFee.toString()
            );
    
            // Combine into single transaction
            const transaction = new solanaWeb3.Transaction()
                .add(winnerPayoutIx)
                .add(houseFeeIx);
    
            transaction.feePayer = wallet.publicKey;
            
            // Get recent blockhash
            const { blockhash } = await this.connection.getLatestBlockhash();
            transaction.recentBlockhash = blockhash;
    
            // Partial sign with wallet
            const signedTx = await wallet.signTransaction(transaction);
    
            // Send and confirm with PDA signing
            const signature = await solanaWeb3.sendAndConfirmTransaction(
                this.connection,
                signedTx,
                [
                    {
                        publicKey: escrowPDA,
                        secretKey: null,
                        seeds: signerSeeds
                    }
                ],
                {
                    skipPreflight: false,
                    commitment: 'confirmed',
                    preflightCommitment: 'confirmed'
                }
            );
    
            console.log('Payout transaction confirmed:', signature);
    
            // Update records
            await Promise.all([
                this.updateGameRecord(this.currentBet.gameId, winner),
                this.updateBetRecord(this.currentBet.betId, winner)
            ]);
    
            this.updateBetStatus(`Winner paid out successfully! Amount: ${winnerAmount} $LAWB`, 'success');
            this.resetBetState();
    
        } catch (error) {
            console.error('Error processing winner:', error);
            this.updateBetStatus('Failed to process winner: ' + error.message, 'error');
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
    
            // Update database records first
            const [gamesResult, betsResult] = await Promise.all([
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
    
            console.log('Cancel database updates:', {
                gamesResult,
                betsResult
            });
    
            // Get bet details
            const { data: bet } = await this.supabase
                .from('chess_bets')
                .select('*')
                .eq('game_id', gameId)
                .single();
    
            if (!bet) {
                throw new Error('Bet not found');
            }
    
            // Process refunds
            await this.processRefunds(bet);
            
            // Update UI
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
                const bluePlayerATA = await this.config.findAssociatedTokenAddress(
                    new solanaWeb3.PublicKey(bet.blue_player),
                    this.lawbMint
                );
    
                const blueRefundIx = this.config.createTransferInstruction(
                    escrowATA,
                    bluePlayerATA,
                    escrowPDA,
                    refundAmount.toString()
                );
    
                // Create the PDA signer seeds
                const signerSeeds = [
                    Buffer.from(bet.game_id),
                    Buffer.from([escrowBump])
                ];
    
                // Add PDA as signer
                const blueTx = new solanaWeb3.Transaction().add(blueRefundIx);
                blueTx.feePayer = this.getConnectedWallet().publicKey;
                
                // Partial sign with wallet
                const signedTx = await this.getConnectedWallet().signTransaction(blueTx);
    
                // Sign with PDA using seeds
                await solanaWeb3.sendAndConfirmTransaction(
                    this.connection,
                    signedTx,
                    [
                        {
                            publicKey: escrowPDA,
                            secretKey: null,
                            seeds: signerSeeds
                        }
                    ],
                    {
                        skipPreflight: false,
                        commitment: 'confirmed',
                        preflightCommitment: 'confirmed'
                    }
                );
    
                refundPromises.push(blueTx);
            }
    
            // Refund red player if matched
            if (bet.red_player) {
                const redPlayerATA = await this.config.findAssociatedTokenAddress(
                    new solanaWeb3.PublicKey(bet.red_player),
                    this.lawbMint
                );
    
                const redRefundIx = this.config.createTransferInstruction(
                    escrowATA,
                    redPlayerATA,
                    escrowPDA,
                    refundAmount.toString()
                );
    
                // Create the PDA signer seeds
                const signerSeeds = [
                    Buffer.from(bet.game_id),
                    Buffer.from([escrowBump])
                ];
    
                // Add PDA as signer
                const redTx = new solanaWeb3.Transaction().add(redRefundIx);
                redTx.feePayer = this.getConnectedWallet().publicKey;
                
                // Partial sign with wallet
                const signedTx = await this.getConnectedWallet().signTransaction(redTx);
    
                // Sign with PDA using seeds
                await solanaWeb3.sendAndConfirmTransaction(
                    this.connection,
                    signedTx,
                    [
                        {
                            publicKey: escrowPDA,
                            secretKey: null,
                            seeds: signerSeeds
                        }
                    ],
                    {
                        skipPreflight: false,
                        commitment: 'confirmed',
                        preflightCommitment: 'confirmed'
                    }
                );
    
                refundPromises.push(redTx);
            }
    
            // Wait for all refunds to complete
            await Promise.all(refundPromises);
            
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
}

// Create singleton instance
window.chessBetting = new ChessBetting();