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

    async transferToEscrow(playerPubKey, escrowPDA, escrowATA, amount) {
        try {
            // Get player's token account
            const playerATA = await this.config.findAssociatedTokenAddress(
                playerPubKey,
                this.lawbMint
            );

            // Check balance
            const balance = await this.connection.getTokenAccountBalance(playerATA);
            const requiredAmount = amount * Math.pow(10, this.config.LAWB_TOKEN.DECIMALS);
            
            if (Number(balance.value.amount) < requiredAmount) {
                throw new Error(`Insufficient $LAWB balance`);
            }

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