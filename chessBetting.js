// Initialize all constants and settings first
const TRANSACTION_RETRY_DELAY = 2000; // Base delay in ms
const MAX_TRANSACTION_RETRIES = 3;
const TRANSACTION_TIMEOUT = 30000; // 30 seconds
const TOKEN_TRANSFER_INSTRUCTION = 3;

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
            status: 'pending',
            escrowBump: null // Added for escrow PDA handling
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
            
            console.log('Generated escrow PDA:', {
                pda: pda.toString(),
                bump,
                gameId
            });
            
            return { pda, bump };
        } catch (error) {
            console.error('Error finding escrow PDA with bump:', error);
            throw new Error(`Failed to generate escrow PDA: ${error.message}`);
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
            
            const wallet = this.getConnectedWallet();
            if (!wallet) {
                throw new Error('No wallet connected');
            }
    
            await this.establishConnection();
            
            if (!this.connection) {
                throw new Error('Failed to establish connection after retries');
            }

            // Version check to ensure connection is working
            const version = await this.connection.getVersion();
            console.log('Connected to Solana, version:', version);
    
            // Initialize core components
            await Promise.all([
                this.verifySetup(),
                this.checkForActiveBets(),
                this.initializeBalanceChecking(),
                this.initializeSubscriptions()
            ]);

            this.initializeUI();
            
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
                await new Promise(resolve => setTimeout(resolve, 1000 * this.initRetryCount));
                return await this.init();
            }
            
            return false;
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

    async createBetEscrow(gameId, amount) {
        try {
            const wallet = this.getConnectedWallet();
            if (!wallet) throw new Error('No wallet connected');
    
            // Generate escrow PDA
            const { pda: escrowPDA, bump } = await this.findEscrowPDAWithBump(gameId);
            
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
                transaction.add(
                    window.SplToken.createAssociatedTokenAccountInstruction(
                        wallet.publicKey,  // Payer
                        escrowATA,         // Associated token account
                        escrowPDA,         // Token account owner
                        this.lawbMint      // Token mint
                    )
                );
            }
    
            // Add token transfer instruction with proper authority
            const nativeAmount = this.config.LAWB_TOKEN.convertToNative(amount);
            const transferIx = new solanaWeb3.TransactionInstruction({
                keys: [
                    { pubkey: playerATA, isSigner: false, isWritable: true },
                    { pubkey: escrowATA, isSigner: false, isWritable: true },
                    { pubkey: wallet.publicKey, isSigner: true, isWritable: false },
                    { pubkey: window.SplToken.TOKEN_PROGRAM_ID, isSigner: false, isWritable: false }
                ],
                programId: this.tokenProgram,
                data: Buffer.from([
                    TOKEN_TRANSFER_INSTRUCTION,
                    ...new solanaWeb3.BN(nativeAmount.toString()).toArray('le', 8)
                ])
            });
            transaction.add(transferIx);
    
            // Send and confirm transaction
            const signature = await this.sendAndConfirmTransaction(transaction);
    
            // Verify the transfer was successful
            const escrowBalance = await this.connection.getTokenAccountBalance(escrowATA);
            if (BigInt(escrowBalance.value.amount) !== BigInt(nativeAmount.toString())) {
                throw new Error('Escrow balance verification failed');
            }
    
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
            throw new Error(`Failed to create bet escrow: ${error.message}`);
        }
    }

    async processPayout(escrowPDA, escrowATA, winnerATA, houseATA, winnerAmount, houseFee, escrowBump) {
        let attempts = 0;
        
        while (attempts < MAX_TRANSACTION_RETRIES) {
            try {
                const wallet = this.getConnectedWallet();
                if (!wallet) throw new Error('No wallet connected');
    
                // Verify escrow balance first
                const escrowBalance = await this.connection.getTokenAccountBalance(escrowATA);
                const totalRequired = BigInt(winnerAmount) + BigInt(houseFee);
                
                console.log('Verifying escrow balance:', {
                    available: escrowBalance.value.amount,
                    required: totalRequired.toString()
                });
                
                if (BigInt(escrowBalance.value.amount) < totalRequired) {
                    throw new Error('Insufficient escrow balance');
                }
    
                // Create transaction with proper authorities
                const transaction = new solanaWeb3.Transaction();
    
                // Winner payout instruction
                const winnerPayoutIx = new solanaWeb3.TransactionInstruction({
                    keys: [
                        { pubkey: escrowATA, isSigner: false, isWritable: true },
                        { pubkey: winnerATA, isSigner: false, isWritable: true },
                        { pubkey: escrowPDA, isSigner: false, isWritable: false },
                        { pubkey: wallet.publicKey, isSigner: true, isWritable: false },
                        { pubkey: window.SplToken.TOKEN_PROGRAM_ID, isSigner: false, isWritable: false }
                    ],
                    programId: this.tokenProgram,
                    data: Buffer.from([
                        TOKEN_TRANSFER_INSTRUCTION,
                        ...new solanaWeb3.BN(winnerAmount.toString()).toArray('le', 8)
                    ])
                });
    
                // House fee instruction
                const houseFeeIx = new solanaWeb3.TransactionInstruction({
                    keys: [
                        { pubkey: escrowATA, isSigner: false, isWritable: true },
                        { pubkey: houseATA, isSigner: false, isWritable: true },
                        { pubkey: escrowPDA, isSigner: false, isWritable: false },
                        { pubkey: wallet.publicKey, isSigner: true, isWritable: false },
                        { pubkey: window.SplToken.TOKEN_PROGRAM_ID, isSigner: false, isWritable: false }
                    ],
                    programId: this.tokenProgram,
                    data: Buffer.from([
                        TOKEN_TRANSFER_INSTRUCTION,
                        ...new solanaWeb3.BN(houseFee.toString()).toArray('le', 8)
                    ])
                });
    
                transaction.add(winnerPayoutIx, houseFeeIx);
    
                // Send transaction with timeout
                const signature = await Promise.race([
                    this.sendAndConfirmTransaction(transaction),
                    new Promise((_, reject) => 
                        setTimeout(() => reject(new Error('Transaction timeout')), TRANSACTION_TIMEOUT)
                    )
                ]);
    
                // Verify final balance
                const finalBalance = await this.connection.getTokenAccountBalance(escrowATA);
                if (BigInt(finalBalance.value.amount) !== BigInt(0)) {
                    throw new Error('Escrow not fully paid out');
                }
    
                console.log('Payout successful:', {
                    signature,
                    winnerAmount: winnerAmount.toString(),
                    houseFee: houseFee.toString()
                });
    
                return signature;
    
            } catch (error) {
                console.error(`Payout attempt ${attempts + 1} failed:`, error);
                attempts++;
                
                if (attempts === MAX_TRANSACTION_RETRIES) {
                    throw new Error(`Payout failed after ${MAX_TRANSACTION_RETRIES} attempts: ${error.message}`);
                }
                
                // Exponential backoff
                await new Promise(resolve => setTimeout(resolve, TRANSACTION_RETRY_DELAY * Math.pow(2, attempts)));
            }
        }
    }

    async processWinner(winner, isRecoveryAttempt = false) {
        if (!this.currentBet.isActive && !isRecoveryAttempt) {
            console.log('No active bet to process');
            return;
        }
    
        try {
            const wallet = this.getConnectedWallet();
            if (!wallet) throw new Error('No wallet connected');
    
            // Lock the game state first to prevent double processing
            await this.updateTransactionState(this.currentBet.gameId, 'processing', {
                winner,
                processing_started: new Date().toISOString(),
                processor: wallet.publicKey.toString()
            });
    
            // Verify current state
            const { game, bet } = await this.syncBetWithGameState(this.currentBet.gameId);
            
            // Only process if bet hasn't been completed
            if (bet.status === 'completed') {
                console.log('Bet already processed');
                return;
            }
    
            // Setup escrow and token accounts
            const { pda: escrowPDA, bump: escrowBump } = await this.findEscrowPDAWithBump(this.currentBet.gameId);
            const escrowATA = await this.config.findAssociatedTokenAddress(
                escrowPDA,
                this.lawbMint
            );
    
            // Verify escrow exists and has funds
            const escrowInfo = await this.connection.getAccountInfo(escrowATA);
            if (!escrowInfo) {
                throw new Error('Escrow account not found');
            }
    
            // Calculate payout amounts
            const totalAmount = this.currentBet.amount * 2;
            const houseFee = Math.floor(totalAmount * this.config.HOUSE_FEE_PERCENTAGE / 100);
            const winnerAmount = totalAmount - houseFee;
    
            // Convert to native token amounts
            const nativeWinnerAmount = this.config.LAWB_TOKEN.convertToNative(winnerAmount);
            const nativeHouseFee = this.config.LAWB_TOKEN.convertToNative(houseFee);
    
            // Get recipient token accounts
            const winnerPubkey = new solanaWeb3.PublicKey(
                winner === 'blue' ? this.currentBet.bluePlayer : this.currentBet.redPlayer
            );
            const winnerATA = await this.config.findAssociatedTokenAddress(
                winnerPubkey,
                this.lawbMint
            );
            const houseATA = await this.config.findAssociatedTokenAddress(
                this.config.HOUSE_WALLET,
                this.lawbMint
            );
    
            // Process blockchain transaction
            console.log('Processing payout transaction...');
            const signature = await this.processPayout(
                escrowPDA,
                escrowATA,
                winnerATA,
                houseATA,
                nativeWinnerAmount,
                nativeHouseFee,
                escrowBump
            );
    
            // Only update final state after successful payout
            await this.updateTransactionState(this.currentBet.gameId, 'completed', {
                winner,
                processed_at: new Date().toISOString(),
                transaction_signature: signature,
                winning_amount: winnerAmount,
                house_fee: houseFee,
                processor: wallet.publicKey.toString()
            });
    
            // Final verification
            await this.verifyGameCompletion(this.currentBet.gameId);
    
            console.log('Winner processed successfully:', {
                winner,
                amount: winnerAmount,
                signature,
                gameId: this.currentBet.gameId
            });
    
            this.updateBetStatus(`Winner paid out successfully! Amount: ${winnerAmount} $LAWB`, 'success');
            this.resetBetState();
    
            return signature;
    
        } catch (error) {
            console.error('Error processing winner:', error);
            this.updateBetStatus('Failed to process winner: ' + error.message, 'error');
            
            // Only trigger recovery if not already in recovery
            if (!isRecoveryAttempt) {
                try {
                    await this.triggerRecoveryProcess(this.currentBet.gameId);
                } catch (recoveryError) {
                    console.error('Recovery process failed:', recoveryError);
                    throw recoveryError;
                }
            }
            
            throw error;
        }
    }

    async updateTransactionState(gameId, state, data = {}) {
        try {
            // Add timestamp and ensure state is valid
            const timestamp = new Date().toISOString();
            const validStates = ['pending', 'processing', 'completed', 'cancelled', 'failed'];
            
            if (!validStates.includes(state)) {
                throw new Error('Invalid state transition');
            }

            // Update both game and bet records atomically
            await Promise.all([
                this.supabase
                    .from('chess_games')
                    .update({
                        game_state: state,
                        ...data,
                        updated_at: timestamp,
                        last_state_change: timestamp
                    })
                    .eq('game_id', gameId),
    
                this.supabase
                    .from('chess_bets')
                    .update({
                        status: state,
                        ...data,
                        updated_at: timestamp,
                        last_state_change: timestamp
                    })
                    .eq('game_id', gameId)
            ]);

            console.log(`State updated to ${state} for game ${gameId}`);

        } catch (error) {
            console.error('Failed to update transaction state:', error);
            throw new Error(`State update failed: ${error.message}`);
        }
    }

    async verifyGameCompletion(gameId) {
        try {
            console.log('Verifying game completion:', gameId);
            
            const { data: game } = await this.supabase
                .from('chess_games')
                .select('*')
                .eq('game_id', gameId)
                .single();

            const { data: bet } = await this.supabase
                .from('chess_bets')
                .select('*')
                .eq('game_id', gameId)
                .single();

            if (!game || !bet) {
                throw new Error('Game or bet record not found');
            }

            // Verify all states match
            if (game.game_state !== 'completed' || bet.status !== 'completed') {
                throw new Error('Game completion state mismatch');
            }

            // Verify winner matches
            if (game.winner !== bet.winner) {
                throw new Error('Winner state mismatch between game and bet');
            }

            // Verify escrow is empty
            const { pda: escrowPDA } = await this.findEscrowPDAWithBump(gameId);
            const escrowATA = await this.config.findAssociatedTokenAddress(
                escrowPDA,
                this.lawbMint
            );
            
            const balance = await this.connection.getTokenAccountBalance(escrowATA);
            if (BigInt(balance.value.amount) !== BigInt(0)) {
                throw new Error('Escrow not fully paid out');
            }

            console.log('Game completion verified successfully');
            return true;
        } catch (error) {
            console.error('Game completion verification failed:', error);
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
                throw new Error('Game not found');
            }
    
            const { data: bet } = await this.supabase
                .from('chess_bets')
                .select('*')
                .eq('game_id', gameId)
                .single();
    
            if (!bet) {
                throw new Error('Bet not found');
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

    async triggerRecoveryProcess(gameId) {
        try {
            console.log('Triggering recovery process for game:', gameId);
            
            const { data: game } = await this.supabase
                .from('chess_games')
                .select('*')
                .eq('game_id', gameId)
                .single();

            const { data: bet } = await this.supabase
                .from('chess_bets')
                .select('*')
                .eq('game_id', gameId)
                .single();

            if (!game || !bet) {
                throw new Error('Game or bet record not found');
            }

            const { pda: escrowPDA } = await this.findEscrowPDAWithBump(gameId);
            const escrowATA = await this.config.findAssociatedTokenAddress(
                escrowPDA,
                this.lawbMint
            );
            
            const escrowBalance = await this.connection.getTokenAccountBalance(escrowATA);

            // If there are funds but game is complete, retry payout
            if (BigInt(escrowBalance.value.amount) > BigInt(0)) {
                if (game.game_state === 'completed' && bet.status !== 'completed') {
                    console.log('Retrying payout for completed game');
                    await this.processWinner(game.winner, true);
                    return;
                }

                // If game is in ambiguous state, cancel and refund
                if (game.game_state !== 'completed' && game.game_state !== 'cancelled') {
                    console.log('Game in ambiguous state, initiating cancellation');
                    await this.cancelGameAndRefund(gameId);
                    return;
                }

                // Process refunds for cancelled games
                if (game.game_state === 'cancelled') {
                    await this.processRefunds(bet);
                    return;
                }
            }

            console.log('Recovery process completed');
        } catch (error) {
            console.error('Recovery process failed:', error);
            this.updateBetStatus('Recovery failed - please contact support', 'error');
            throw error;
        }
    }

    async processPlayerRefund(escrowPDA, escrowATA, playerAddress, refundAmount, gameId, escrowBump) {
        try {
            const wallet = this.getConnectedWallet();
            if (!wallet) throw new Error('No wallet connected');

            const playerATA = await this.config.findAssociatedTokenAddress(
                new solanaWeb3.PublicKey(playerAddress),
                this.lawbMint
            );

            const transaction = new solanaWeb3.Transaction();

            // Create refund instruction with proper authorities
            const refundIx = new solanaWeb3.TransactionInstruction({
                keys: [
                    { pubkey: escrowATA, isSigner: false, isWritable: true },
                    { pubkey: playerATA, isSigner: false, isWritable: true },
                    { pubkey: escrowPDA, isSigner: false, isWritable: false },
                    { pubkey: wallet.publicKey, isSigner: true, isWritable: false },
                    { pubkey: window.SplToken.TOKEN_PROGRAM_ID, isSigner: false, isWritable: false }
                ],
                programId: this.tokenProgram,
                data: Buffer.from([
                    TOKEN_TRANSFER_INSTRUCTION,
                    ...new solanaWeb3.BN(refundAmount.toString()).toArray('le', 8)
                ])
            });

            transaction.add(refundIx);
            
            const signature = await this.sendAndConfirmTransaction(transaction);

            // Verify refund
            const playerBalance = await this.connection.getTokenAccountBalance(playerATA);
            console.log(`Refund processed for ${playerAddress}:`, signature);

            return signature;

        } catch (error) {
            console.error('Refund failed:', error);
            throw new Error(`Refund failed: ${error.message}`);
        }
    }

    async processRefunds(bet) {
        try {
            console.log('Starting refund process for game:', bet.game_id);
            
            const { pda: escrowPDA, bump: escrowBump } = await this.findEscrowPDAWithBump(bet.game_id);
            
            const escrowATA = await this.config.findAssociatedTokenAddress(
                escrowPDA,
                this.lawbMint
            );

            const escrowBalance = await this.connection.getTokenAccountBalance(escrowATA);
            if (BigInt(escrowBalance.value.amount) === BigInt(0)) {
                console.log('Escrow already empty, no refunds needed');
                return true;
            }

            const refundAmount = this.config.LAWB_TOKEN.convertToNative(bet.bet_amount);

            // Refund blue player
            if (bet.blue_player) {
                await this.processPlayerRefund(
                    escrowPDA, 
                    escrowATA, 
                    bet.blue_player, 
                    refundAmount, 
                    bet.game_id, 
                    escrowBump
                );
            }

            // Refund red player if matched
            if (bet.red_player && bet.status === 'matched') {
                await this.processPlayerRefund(
                    escrowPDA, 
                    escrowATA, 
                    bet.red_player, 
                    refundAmount, 
                    bet.game_id, 
                    escrowBump
                );
            }

            // Verify escrow is empty
            const finalBalance = await this.connection.getTokenAccountBalance(escrowATA);
            if (BigInt(finalBalance.value.amount) !== BigInt(0)) {
                throw new Error('Escrow not fully refunded');
            }

            console.log('Refunds processed successfully');
            return true;

        } catch (error) {
            console.error('Error processing refunds:', error);
            throw error;
        }
    }

    async cancelGameAndRefund(gameId) {
        try {
            console.log('Cancellation requested for game:', gameId);
            
            const { data: game } = await this.supabase
                .from('chess_games')
                .select('*')
                .eq('game_id', gameId)
                .single();
    
            if (!game) {
                throw new Error('Game not found');
            }
    
            if (game.game_state !== 'cancelled' && game.game_state !== 'ended') {
                // Update to cancelled state
                await this.updateTransactionState(gameId, 'cancelled', {
                    cancelled_at: new Date().toISOString(),
                    cancelled_by: this.getConnectedWallet()?.publicKey.toString()
                });
    
                // Process refunds
                const { data: bet } = await this.supabase
                    .from('chess_bets')
                    .select('*')
                    .eq('game_id', gameId)
                    .single();
    
                if (bet && bet.status !== 'refunded') {
                    await this.processRefunds(bet);
                }
            }
            
            this.updateBetStatus('Game cancelled and refunds processed', 'success');
            this.resetBetState();
    
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

    async auditAndRecoverFunds() {
        try {
            const wallet = this.getConnectedWallet();
            if (!wallet) return;

            console.log('Starting funds recovery audit...');

            const { data: activeGames } = await this.supabase
                .from('chess_games')
                .select('*')
                .or(`blue_player.eq.${wallet.publicKey.toString()},red_player.eq.${wallet.publicKey.toString()})`)
                .not('game_state', 'in', '(completed,cancelled)');

            if (!activeGames?.length) return;

            for (const game of activeGames) {
                try {
                    console.log(`Auditing game ${game.game_id}`);
                    
                    const escrowPDA = await this.findEscrowPDAWithBump(game.game_id);
                    const escrowATA = await this.config.findAssociatedTokenAddress(
                        escrowPDA.pda,
                        this.lawbMint
                    );

                    const balance = await this.connection.getTokenAccountBalance(escrowATA);
                    
                    if (BigInt(balance.value.amount) > BigInt(0)) {
                        await this.triggerRecoveryProcess(game.game_id);
                    }
                } catch (error) {
                    console.error(`Error processing game ${game.game_id}:`, error);
                }
            }

        } catch (error) {
            console.error('Recovery audit failed:', error);
            throw error;
        }
    }

    async sendAndConfirmTransaction(transaction) {
        let attempts = 0;
        const maxAttempts = 3;
        
        while (attempts < maxAttempts) {
            try {
                const wallet = this.getConnectedWallet();
                if (!wallet) throw new Error('No wallet connected');
        
                // Get fresh blockhash
                const { blockhash, lastValidBlockHeight } = 
                    await this.connection.getLatestBlockhash('confirmed');
                
                transaction.recentBlockhash = blockhash;
                transaction.feePayer = wallet.publicKey;
        
                console.log('Sending transaction with blockhash:', blockhash);
                
                // Sign and send immediately
                const signed = await wallet.signTransaction(transaction);
                const signature = await this.connection.sendRawTransaction(
                    signed.serialize(),
                    {
                        skipPreflight: false,
                        preflightCommitment: 'confirmed',
                        maxRetries: 5
                    }
                );
        
                console.log('Awaiting confirmation for:', signature);
        
                // Wait for confirmation with timeout
                const confirmation = await Promise.race([
                    this.connection.confirmTransaction({
                        signature,
                        blockhash,
                        lastValidBlockHeight
                    }, 'confirmed'),
                    new Promise((_, reject) => 
                        setTimeout(() => reject(new Error('Confirmation timeout')), TRANSACTION_TIMEOUT)
                    )
                ]);
        
                if (confirmation?.value?.err) {
                    throw new Error(`Transaction failed: ${confirmation.value.err}`);
                }
        
                return signature;
        
            } catch (error) {
                attempts++;
                console.error(`Transaction attempt ${attempts} failed:`, error);
                
                if (attempts === maxAttempts) {
                    throw new Error(`Transaction failed after ${maxAttempts} attempts: ${error.message}`);
                }
                
                // Exponential backoff
                await new Promise(resolve => 
                    setTimeout(resolve, TRANSACTION_RETRY_DELAY * Math.pow(2, attempts))
                );
            }
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

    async handleBalanceUpdate(accountInfo) {
        try {
            const wallet = this.getConnectedWallet();
            if (!wallet?.publicKey) return;

            const balance = await this.parseTokenAccountBalance(accountInfo);
            
            const betInput = document.getElementById('betAmount');
            const createGameBtn = document.getElementById('create-game-with-bet');
            
            if (betInput && createGameBtn) {
                const currentBet = Number(betInput.value);
                const hasMinimumBalance = balance >= this.config.MIN_BET;
                
                createGameBtn.disabled = !hasMinimumBalance || balance < currentBet;
                
                if (!hasMinimumBalance) {
                    this.updateBetStatus(`Minimum balance required: ${this.config.MIN_BET} $LAWB`, 'error');
                } else if (balance < currentBet) {
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
            status: 'pending',
            escrowBump: null
        };
        
        this.enableBetting();

        const gameCodeDisplay = document.getElementById('gameCodeDisplay');
        if (gameCodeDisplay) {
            gameCodeDisplay.style.display = 'none';
        }
    }

    cleanup() {
        console.log('Cleanup called:', {
            isInitialized: this.initialized,
            currentBet: this.currentBet
        });
    
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

    disableBetting() {
        const createGameBtn = document.getElementById('create-game-with-bet');
        const betInput = document.getElementById('betAmount');
        if (createGameBtn) createGameBtn.disabled = true;
        if (betInput) betInput.disabled = true;
    }

    enableBetting() {
        const createGameBtn = document.getElementById('create-game-with-bet');
        const betInput = document.getElementById('betAmount');
        if (createGameBtn) createGameBtn.disabled = false;
        if (betInput) betInput.disabled = false;
    }
}

// Create singleton instance
window.chessBetting = new ChessBetting();