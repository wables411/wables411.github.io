class ChessBetting {
    constructor() {
        this.config = window.BETTING_CONFIG;
        this.solanaConfig = window.SOLANA_CONFIG;
        this.supabase = window.gameDatabase;
        this.connection = null;
        
        // Initialize token program and mint correctly
        this.tokenProgram = this.config.TOKEN_PROGRAM_ID;
        this.lawbMint = this.config.LAWB_TOKEN.MINT;
        
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

        this.init();
        this.initializeUI();
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

        // Set up multiplayer mode button handler
        const multiplayerBtn = document.getElementById('multiplayer-mode');
        if (multiplayerBtn) {
            const originalClick = multiplayerBtn.onclick;
            multiplayerBtn.onclick = (e) => {
                if (originalClick) originalClick.call(multiplayerBtn, e);
                const bettingContainer = document.getElementById('betting-container');
                if (bettingContainer) {
                    console.log('Showing betting container');
                    bettingContainer.style.display = 'block';
                }
            };
        }

        // Set up AI mode button handler
        const aiModeBtn = document.getElementById('ai-mode');
        if (aiModeBtn) {
            aiModeBtn.addEventListener('click', () => {
                const bettingContainer = document.getElementById('betting-container');
                if (bettingContainer) {
                    bettingContainer.style.display = 'none';
                }
            });
        }

        console.log('UI handlers initialized');
    }

    async init() {
        try {
            console.log('Initializing betting system...');
            this.connection = await this.solanaConfig.createConnection();
            
            // Verify setup
            await this.verifySetup();
            console.log('Betting system initialized successfully');
            
            // Initialize balance checking
            await this.initializeBalanceChecking();
            
            // Force show betting UI if in multiplayer mode
            if (document.getElementById('multiplayer-mode')?.classList.contains('selected')) {
                const bettingContainer = document.getElementById('betting-container');
                if (bettingContainer) {
                    console.log('Showing betting container (init)');
                    bettingContainer.style.display = 'block';
                }
            }
            
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

            // Verify LAWB token existence
            const tokenInfo = await this.connection.getParsedAccountInfo(this.lawbMint);
            if (!tokenInfo.value) {
                console.warn('Could not verify LAWB token, but continuing...');
            } else {
                console.log('LAWB token verified');
            }

            await this.initializeSubscriptions();
            return true;
        } catch (error) {
            console.warn('Setup verification warning:', error);
            // Continue anyway since we have fallback connections
            return true;
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

        } catch (error) {
            console.error('Error initializing subscriptions:', error);
        }
    }

    async handleBetUpdate(payload) {
        try {
            const { new: newBet, old: oldBet, eventType } = payload;
            
            // Only handle updates for current bet
            if (this.currentBet.betId && newBet.id === this.currentBet.betId) {
                if (newBet.status !== oldBet?.status) {
                    await this.handleBetStatusChange(newBet);
                }
                
                if (newBet.red_player && !oldBet?.red_player) {
                    await this.handleBetMatched(newBet);
                }
            }
        } catch (error) {
            console.error('Error handling bet update:', error);
        }
    }

    async handleGameUpdate(payload) {
        try {
            const { new: newGame, old: oldGame, eventType } = payload;
            
            // Only handle updates for current game
            if (this.currentBet.gameId && newGame.game_id === this.currentBet.gameId) {
                if (newGame.game_state !== oldGame?.game_state) {
                    await this.handleGameStateChange(newGame);
                }
                
                if (newGame.winner && !oldGame?.winner) {
                    await this.handleGameWinner(newGame);
                }
            }
        } catch (error) {
            console.error('Error handling game update:', error);
        }
    }

    async handleBetStatusChange(bet) {
        try {
            this.currentBet.status = bet.status;
            
            switch (bet.status) {
                case 'matched':
                    this.updateBetStatus('Bet matched! Game starting...', 'success');
                    break;
                case 'completed':
                    this.updateBetStatus('Bet completed! Processing payout...', 'success');
                    break;
                case 'cancelled':
                    this.updateBetStatus('Bet cancelled', 'info');
                    this.resetBetState();
                    break;
            }
        } catch (error) {
            console.error('Error handling bet status change:', error);
        }
    }

    async handleGameStateChange(game) {
        try {
            if (!this.currentBet.gameId) return;

            switch (game.game_state) {
                case 'active':
                    await this.updateBetStatus('Game started!', 'success');
                    break;
                case 'completed':
                    // Winner handling is done in handleGameWinner
                    break;
                case 'cancelled':
                    await this.handleGameCancelled(game);
                    break;
            }
        } catch (error) {
            console.error('Error handling game state change:', error);
        }
    }

    async handleGameWinner(game) {
        try {
            if (!this.currentBet.isActive || !game.winner) return;

            // Update bet record first
            await this.supabase
                .from('chess_bets')
                .update({
                    winner: game.winner,
                    status: 'completed'
                })
                .eq('game_id', game.game_id);

            // Process payout
            await this.processWinner(game.winner);

        } catch (error) {
            console.error('Error handling game winner:', error);
            this.updateBetStatus('Error processing winner payout', 'error');
        }
    }

    async handleGameCancelled(game) {
        try {
            if (this.currentBet.isActive && this.currentBet.matched) {
                // Return funds to players
                await this.processDraw();
            } else if (this.currentBet.isActive) {
                // Return funds to creator
                await this.processRefund();
            }

            await this.supabase
                .from('chess_bets')
                .update({ status: 'cancelled' })
                .eq('game_id', game.game_id);

            this.resetBetState();
            this.updateBetStatus('Game cancelled - funds returned', 'info');

        } catch (error) {
            console.error('Error handling game cancellation:', error);
            this.updateBetStatus('Error processing refund', 'error');
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
            
            // Generate game ID
            const gameId = Math.random().toString(36).substring(2, 8).toUpperCase();
            const playerPubKey = new solanaWeb3.PublicKey(wallet.publicKey);

            // Create escrow account
            const { escrowPDA, escrowATA } = await this.createEscrowAccounts(gameId);
            
            // Transfer funds to escrow
            await this.transferToEscrow(playerPubKey, escrowPDA, escrowATA, amount);

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

            this.updateBetStatus(`Game created! Click code to copy`, 'success');
            this.disableBetting();

        } catch (error) {
            console.error('Error creating game with bet:', error);
            this.updateBetStatus('Failed to create game: ' + error.message, 'error');
            this.resetBetState();
        }
    }

    async createEscrowAccounts(gameId) {
        try {
            const escrowPDA = await this.config.findEscrowPDA(gameId);
            const escrowATA = await this.config.findAssociatedTokenAddress(
                escrowPDA,
                this.lawbMint
            );

            return { escrowPDA, escrowATA };
        } catch (error) {
            console.error('Error creating escrow accounts:', error);
            throw error;
        }
    }

    async checkAndCreateTokenAccount(ownerPubKey) {
        try {
            // Get the ATA address
            const ata = await this.config.findAssociatedTokenAddress(
                ownerPubKey,
                this.lawbMint
            );

            try {
                // Check if account exists
                const account = await this.connection.getAccountInfo(ata);
                if (account) {
                    console.log('Token account exists');
                    return ata;
                }
            } catch (e) {
                console.log('Token account does not exist, creating...');
            }

            // Create ATA instruction
            const createAtaInstruction = 
                splToken.createAssociatedTokenAccountInstruction(
                    ownerPubKey, // payer
                    ata, // ata
                    ownerPubKey, // owner
                    this.lawbMint // mint
                );

            const transaction = new solanaWeb3.Transaction().add(createAtaInstruction);
            
            // Send and confirm transaction
            await this.sendAndConfirmTransaction(transaction);
            console.log('Token account created');
            
            return ata;
        } catch (error) {
            console.error('Error checking/creating token account:', error);
            throw error;
        }
    }

    async sendAndConfirmTransaction(transaction) {
        try {
            const wallet = this.getConnectedWallet();
            if (!wallet) throw new Error('No wallet connected');

            console.log('Getting latest blockhash...');
            const { blockhash, lastValidBlockHeight } = 
                await this.connection.getLatestBlockhash('confirmed');
            
            transaction.recentBlockhash = blockhash;
            transaction.feePayer = wallet.publicKey;

            console.log('Signing transaction...');
            const signed = await wallet.signTransaction(transaction);
            
            console.log('Sending transaction...');
            const signature = await this.connection.sendRawTransaction(
                signed.serialize(),
                this.transactionOptions
            );

            console.log('Confirming transaction...');
            const confirmation = await this.connection.confirmTransaction({
                signature,
                blockhash,
                lastValidBlockHeight
            });

            if (confirmation.value.err) {
                throw new Error('Transaction failed to confirm');
            }

            console.log('Transaction confirmed:', signature);
            return signature;
        } catch (error) {
            console.error('Transaction failed:', error);
            throw error;
        }
    }

    async createTokenAccountInstructions(owner, mint) {
        try {
            const ata = await this.config.findAssociatedTokenAddress(owner, mint);
            
            // Get minimum lamports needed for account rent exemption
            const rent = await this.connection.getMinimumBalanceForRentExemption(
                splToken.AccountLayout.span
            );

            // Create instructions
            const createAcctInstruction = splToken.createAssociatedTokenAccountInstruction(
                owner, // payer
                ata,  // associatedToken
                owner, // owner
                mint  // mint
            );

            return {
                ata,
                instructions: [createAcctInstruction],
                rent
            };
        } catch (error) {
            console.error('Error creating token account instructions:', error);
            throw error;
        }
    }

    async initializeBalanceChecking() {
        try {
            const wallet = this.getConnectedWallet();
            if (wallet?.publicKey) {
                // Get or create the token account
                await this.checkAndCreateTokenAccount(wallet.publicKey);
                
                // Set up subscription for balance changes
                const ata = await this.config.findAssociatedTokenAddress(
                    wallet.publicKey,
                    this.lawbMint
                );

                this.subscriptions.balance = this.connection.onAccountChange(
                    ata,
                    (accountInfo) => {
                        this.handleBalanceUpdate(accountInfo);
                    },
                    'confirmed'
                );
            }
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

    async ensureAssociatedTokenAccount(owner, mint) {
        try {
            const ata = await this.config.findAssociatedTokenAddress(owner, mint);
            
            // Check if account exists
            const account = await this.connection.getAccountInfo(ata);
            
            if (!account) {
                console.log('Creating new ATA for owner:', owner.toString());
                
                const transaction = new solanaWeb3.Transaction().add(
                    splToken.createAssociatedTokenAccountInstruction(
                        owner,                // payer
                        ata,                  // ata
                        owner,                // owner
                        mint,                 // mint
                        splToken.TOKEN_PROGRAM_ID,
                        splToken.ASSOCIATED_TOKEN_PROGRAM_ID
                    )
                );

                await this.sendAndConfirmTransaction(transaction);
                console.log('ATA created:', ata.toString());
            } else {
                console.log('ATA already exists:', ata.toString());
            }

            return ata;
        } catch (error) {
            console.error('Error ensuring ATA:', error);
            throw error;
        }
    }

    async ensureEscrowAccount(gameId) {
        try {
            const escrowPDA = await this.config.findEscrowPDA(gameId);
            console.log('Ensuring escrow account for game:', gameId);
            
            // Create escrow token account if it doesn't exist
            const escrowATA = await this.ensureAssociatedTokenAccount(
                escrowPDA,
                this.lawbMint
            );

            return { escrowPDA, escrowATA };
        } catch (error) {
            console.error('Error ensuring escrow account:', error);
            throw error;
        }
    }

    async getOrCreateTokenAccount(owner) {
        try {
            console.log('Getting or creating token account for:', owner.toString());
            
            // First try to find existing account
            const ata = await this.config.findAssociatedTokenAddress(
                owner,
                this.lawbMint
            );

            try {
                const accountInfo = await this.connection.getAccountInfo(ata);
                if (accountInfo) {
                    console.log('Found existing token account');
                    return ata;
                }
            } catch (e) {
                console.log('Token account not found, creating new one');
            }

            // Create new account if not found
            await this.ensureAssociatedTokenAccount(owner, this.lawbMint);
            return ata;
        } catch (error) {
            console.error('Error in getOrCreateTokenAccount:', error);
            throw error;
        }
    }

    async createEscrowInstructions(gameId, amount) {
        try {
            const wallet = this.getConnectedWallet();
            if (!wallet?.publicKey) throw new Error('Wallet not connected');

            // Generate escrow PDA
            const escrowPDA = await this.config.findEscrowPDA(gameId);
            console.log('Escrow PDA:', escrowPDA.toString());

            // Create instructions for token accounts
            const playerTokenAccount = await this.checkAndCreateTokenAccount(wallet.publicKey);
            const escrowTokenAccount = await this.checkAndCreateTokenAccount(escrowPDA);

            // Create transfer instruction
            const transferInstruction = this.config.createTransferInstruction(
                playerTokenAccount,
                escrowTokenAccount,
                wallet.publicKey,
                amount * Math.pow(10, this.config.LAWB_TOKEN.DECIMALS)
            );

            return {
                escrowPDA,
                escrowTokenAccount,
                instructions: [transferInstruction]
            };
        } catch (error) {
            console.error('Error creating escrow instructions:', error);
            throw error;
        }
    }

    async setupEscrowForGame(gameId, amount) {
        try {
            console.log('Setting up escrow for game:', gameId);
            
            // Get escrow instructions
            const { escrowPDA, escrowTokenAccount, instructions } = 
                await this.createEscrowInstructions(gameId, amount);

            // Create and send transaction
            const transaction = new solanaWeb3.Transaction();
            instructions.forEach(ix => transaction.add(ix));

            const signature = await this.sendAndConfirmTransaction(transaction);
            console.log('Escrow setup complete, signature:', signature);

            return {
                escrowPDA,
                escrowTokenAccount,
                signature
            };
        } catch (error) {
            console.error('Error setting up escrow:', error);
            throw error;
        }
    }

    async initiateEscrowRefund(escrowPDA, amount) {
        try {
            const wallet = this.getConnectedWallet();
            if (!wallet?.publicKey) throw new Error('Wallet not connected');

            const playerTokenAccount = await this.checkAndCreateTokenAccount(wallet.publicKey);
            const escrowTokenAccount = await this.checkAndCreateTokenAccount(escrowPDA);

            const transaction = new solanaWeb3.Transaction();
            transaction.add(
                this.config.createTransferInstruction(
                    escrowTokenAccount,
                    playerTokenAccount,
                    escrowPDA,
                    amount * Math.pow(10, this.config.LAWB_TOKEN.DECIMALS)
                )
            );

            return await this.sendAndConfirmTransaction(transaction);
        } catch (error) {
            console.error('Error initiating escrow refund:', error);
            throw error;
        }
    }

    async transferToEscrow(playerPubKey, escrowPDA, escrowATA, amount) {
        try {
            // Get or create player's token account
            console.log('Checking/creating player token account...');
            const playerATA = await this.checkAndCreateTokenAccount(playerPubKey);
            
            // Create escrow token account if it doesn't exist
            console.log('Checking/creating escrow token account...');
            const escrowTokenAccount = await this.checkAndCreateTokenAccount(escrowPDA);

            // Check balance
            console.log('Checking player balance...');
            try {
                const balance = await this.connection.getTokenAccountBalance(playerATA);
                const requiredAmount = amount * Math.pow(10, this.config.LAWB_TOKEN.DECIMALS);
                
                if (Number(balance.value.amount) < requiredAmount) {
                    throw new Error(`Insufficient $LAWB balance. Required: ${requiredAmount / Math.pow(10, this.config.LAWB_TOKEN.DECIMALS)} $LAWB`);
                }
                
                console.log(`Player balance: ${balance.value.amount}, Required: ${requiredAmount}`);

                // Create and execute transfer transaction
                console.log('Creating transfer transaction...');
                const transaction = new solanaWeb3.Transaction();
                transaction.add(
                    this.config.createTransferInstruction(
                        playerATA,
                        escrowTokenAccount,
                        playerPubKey,
                        requiredAmount
                    )
                );

                console.log('Sending transfer transaction...');
                await this.sendAndConfirmTransaction(transaction);
                console.log('Transfer completed successfully');

            } catch (balanceError) {
                if (balanceError.message.includes('could not find account')) {
                    throw new Error('No $LAWB tokens found in wallet');
                }
                throw balanceError;
            }
        } catch (error) {
            console.error('Error transferring to escrow:', error);
            throw error;
        }
    }

    async createBetRecord(gameId, playerAddress, amount, escrowAccount) {
        try {
            const { data, error } = await this.supabase
                .from('chess_bets')
                .insert([{
                    game_id: gameId,
                    bet_amount: amount,
                    blue_player: playerAddress,
                    escrow_account: escrowAccount.toString(),
                    status: 'pending'
                }])
                .select()
                .single();

            if (error) throw error;
            return data;
        } catch (error) {
            console.error('Error creating bet record:', error);
            throw error;
        }
    }

    async handleJoinGame() {
        const gameCode = document.getElementById('game-code-input')?.value?.trim();
        if (!gameCode) {
            this.updateBetStatus('Please enter a game code', 'error');
            return;
        }

        try {
            this.updateBetStatus('Joining game...', 'processing');
            
            const wallet = this.getConnectedWallet();
            if (!wallet || !wallet.publicKey) {
                this.updateBetStatus('Please connect your wallet first', 'error');
                return;
            }

            // Get both game and bet details
            const [gameResult, betResult] = await Promise.all([
                this.supabase
                    .from('chess_games')
                    .select('*')
                    .eq('game_id', gameCode.toUpperCase())
                    .single(),
                this.supabase
                    .from('chess_bets')
                    .select('*')
                    .eq('game_id', gameCode.toUpperCase())
                    .single()
            ]);

            const game = gameResult.data;
            const bet = betResult.data;

            if (!game) {
                this.updateBetStatus('Game not found', 'error');
                return;
            }

            // Validate game state
            if (!await this.validateGameJoin(game, wallet.publicKey.toString())) {
                return;
            }

            // Handle bet if exists
            if (bet && game.bet_amount > 0) {
                await this.handleBetJoin(game, bet, wallet.publicKey);
            }

            // Update records
            await this.updateGameAndBetRecords(gameCode.toUpperCase(), wallet.publicKey.toString(), bet?.id);
            
            this.updateBetStatus('Successfully joined game!', 'success');
            
            // Update UI to show game is starting
            const multiplayerMenu = document.querySelector('.multiplayer-menu');
            const chessGame = document.getElementById('chess-game');
            if (multiplayerMenu && chessGame) {
                multiplayerMenu.style.display = 'none';
                chessGame.style.display = 'block';
            }

        } catch (error) {
            console.error('Error joining game:', error);
            this.updateBetStatus('Failed to join game: ' + error.message, 'error');
        }
    }

    async validateGameJoin(game, playerAddress) {
        if (game.game_state !== 'waiting') {
            this.updateBetStatus('Game is no longer available', 'error');
            return false;
        }

        if (game.blue_player === playerAddress) {
            this.updateBetStatus('Cannot join your own game', 'error');
            return false;
        }

        return true;
    }

    async handleBetJoin(game, bet, playerPubKey) {
        try {
            // Verify player has enough tokens
            const playerATA = await this.config.findAssociatedTokenAddress(
                playerPubKey,
                this.lawbMint
            );

            const balance = await this.connection.getTokenAccountBalance(playerATA);
            const requiredAmount = game.bet_amount * Math.pow(10, this.config.LAWB_TOKEN.DECIMALS);
            
            if (Number(balance.value.amount) < requiredAmount) {
                throw new Error(`Insufficient $LAWB balance`);
            }

            // Get escrow accounts
            const escrowPDA = new solanaWeb3.PublicKey(bet.escrow_account);
            const escrowATA = await this.config.findAssociatedTokenAddress(
                escrowPDA,
                this.lawbMint
            );

            // Create and execute transfer transaction
            const transaction = new solanaWeb3.Transaction();
            transaction.add(
                this.config.createTransferInstruction(
                    playerATA,
                    escrowATA,
                    playerPubKey,
                    requiredAmount
                )
            );

            await this.sendAndConfirmTransaction(transaction);

        } catch (error) {
            console.error('Error handling bet join:', error);
            throw error;
        }
    }

    async updateGameAndBetRecords(gameId, redPlayer, betId) {
        try {
            // Update in parallel
            await Promise.all([
                // Update game record
                this.supabase
                    .from('chess_games')
                    .update({
                        red_player: redPlayer,
                        game_state: 'active'
                    })
                    .eq('game_id', gameId),

                // Update bet record if exists
                betId ? 
                    this.supabase
                        .from('chess_bets')
                        .update({
                            red_player: redPlayer,
                            status: 'matched'
                        })
                        .eq('id', betId) : 
                    Promise.resolve()
            ]);
        } catch (error) {
            console.error('Error updating game and bet records:', error);
            throw error;
        }
    }

    async processWinner(winner) {
        if (!this.currentBet.isActive || !this.currentBet.amount) return;

        try {
            this.updateBetStatus('Processing payout...', 'processing');

            const result = winner === 'draw' ? 
                await this.processDraw() :
                await this.processWinnerPayout(
                    winner === 'blue' ? this.currentBet.bluePlayer : this.currentBet.redPlayer
                );

            await this.finalizeBet(winner);
            this.updateBetStatus('Payout complete!', 'success');
            this.resetBetState();
            
            return result;
        } catch (error) {
            console.error('Error processing winner:', error);
            this.updateBetStatus('Error processing payout: ' + error.message, 'error');
            throw error;
        }
    }

    async processDraw() {
        if (!this.currentBet.escrowAccount) {
            throw new Error('No escrow account found for this game');
        }

        try {
            const playerAmount = this.currentBet.amount;
            const feePercentage = this.config.HOUSE_FEE_PERCENTAGE / 2;
            const refundAmount = Math.floor(playerAmount * (1 - feePercentage / 100)) * Math.pow(10, this.config.LAWB_TOKEN.DECIMALS);
            const houseFee = Math.floor(playerAmount * feePercentage / 100) * Math.pow(10, this.config.LAWB_TOKEN.DECIMALS);

            const transaction = new solanaWeb3.Transaction();
            
            // Get all token accounts
            const [escrowATA, player1ATA, player2ATA, houseATA] = await Promise.all([
                this.config.findAssociatedTokenAddress(
                    this.currentBet.escrowAccount,
                    this.lawbMint
                ),
                this.config.findAssociatedTokenAddress(
                    new solanaWeb3.PublicKey(this.currentBet.bluePlayer),
                    this.lawbMint
                ),
                this.config.findAssociatedTokenAddress(
                    new solanaWeb3.PublicKey(this.currentBet.redPlayer),
                    this.lawbMint
                ),
                this.config.findAssociatedTokenAddress(
                    this.config.HOUSE_WALLET,
                    this.lawbMint
                )
            ]);

            // Add all transfer instructions
            transaction.add(
                this.config.createTransferInstruction(
                    escrowATA,
                    player1ATA,
                    this.currentBet.escrowAccount,
                    refundAmount
                ),
                this.config.createTransferInstruction(
                    escrowATA,
                    player2ATA,
                    this.currentBet.escrowAccount,
                    refundAmount
                ),
                this.config.createTransferInstruction(
                    escrowATA,
                    houseATA,
                    this.currentBet.escrowAccount,
                    houseFee * 2
                )
            );

            return await this.sendAndConfirmTransaction(transaction);
        } catch (error) {
            console.error('Error processing draw:', error);
            throw error;
        }
    }

    async processWinnerPayout(winnerAddress) {
        if (!this.currentBet.escrowAccount) {
            throw new Error('No escrow account found for this game');
        }

        try {
            const totalAmount = this.currentBet.amount * 2;
            const houseFee = Math.floor(totalAmount * this.config.HOUSE_FEE_PERCENTAGE / 100);
            const winnerAmount = Math.floor(totalAmount - houseFee) * Math.pow(10, this.config.LAWB_TOKEN.DECIMALS);
            const houseFeeAmount = Math.floor(houseFee) * Math.pow(10, this.config.LAWB_TOKEN.DECIMALS);

            const transaction = new solanaWeb3.Transaction();
            
            // Get token accounts
            const [escrowATA, winnerATA, houseATA] = await Promise.all([
                this.config.findAssociatedTokenAddress(
                    this.currentBet.escrowAccount,
                    this.lawbMint
                ),
                this.config.findAssociatedTokenAddress(
                    new solanaWeb3.PublicKey(winnerAddress),
                    this.lawbMint
                ),
                this.config.findAssociatedTokenAddress(
                    this.config.HOUSE_WALLET,
                    this.lawbMint
                )
            ]);

            // Add transfer instructions
            transaction.add(
                this.config.createTransferInstruction(
                    escrowATA,
                    winnerATA,
                    this.currentBet.escrowAccount,
                    winnerAmount
                ),
                this.config.createTransferInstruction(
                    escrowATA,
                    houseATA,
                    this.currentBet.escrowAccount,
                    houseFeeAmount
                )
            );

            return await this.sendAndConfirmTransaction(transaction);
        } catch (error) {
            console.error('Error processing winner payout:', error);
            throw error;
        }
    }

    async processRefund() {
        if (!this.currentBet.escrowAccount || !this.currentBet.bluePlayer) {
            throw new Error('Invalid bet state for refund');
        }

        try {
            const transaction = new solanaWeb3.Transaction();
            
            const [escrowATA, playerATA] = await Promise.all([
                this.config.findAssociatedTokenAddress(
                    this.currentBet.escrowAccount,
                    this.lawbMint
                ),
                this.config.findAssociatedTokenAddress(
                    new solanaWeb3.PublicKey(this.currentBet.bluePlayer),
                    this.lawbMint
                )
            ]);

            const refundAmount = this.currentBet.amount * Math.pow(10, this.config.LAWB_TOKEN.DECIMALS);

            transaction.add(
                this.config.createTransferInstruction(
                    escrowATA,
                    playerATA,
                    this.currentBet.escrowAccount,
                    refundAmount
                )
            );

            return await this.sendAndConfirmTransaction(transaction);
        } catch (error) {
            console.error('Error processing refund:', error);
            throw error;
        }
    }

    async finalizeBet(winner) {
        try {
            await this.supabase
                .from('chess_bets')
                .update({
                    status: 'completed',
                    winner: winner,
                    processed_at: new Date().toISOString()
                })
                .eq('id', this.currentBet.betId);
        } catch (error) {
            console.error('Error finalizing bet:', error);
            throw error;
        }
    }

    cleanup() {
        // Unsubscribe from all subscriptions
        Object.values(this.subscriptions).forEach(subscription => {
            if (subscription) {
                subscription.unsubscribe();
            }
        });

        // Clear current bet state
        this.resetBetState();
    }

    // Updated utility methods with better error handling
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

    getConnectedWallet() {
        const wallet = window.solflare?.isConnected ? window.solflare : 
                      window.solana?.isConnected ? window.solana : null;
                      
        if (!wallet) {
            this.updateBetStatus('No wallet connected', 'error');
        }
        return wallet;
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

        // Reset UI
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