class ChessBetting {
    constructor() {
        this.config = window.BETTING_CONFIG;
        this.supabase = window.gameDatabase;
        this.initializeBetting();
        this.setupMultiplayerBetting();
        this.gameStates = new Map();
        this.addDiagnosticsButton();
    }

    async initializeBetting() {
        try {
            console.log('Initializing betting system...');
            
            // Initialize Solana connection
            this.connection = new solanaWeb3.Connection(
                this.config.NETWORK,
                this.config.CONNECTION_CONFIG
            );
            
            // Initialize LAWB token
            this.lawbMint = new solanaWeb3.PublicKey(this.config.LAWB_TOKEN.MINT);
            this.tokenProgram = new solanaWeb3.PublicKey(this.config.LAWB_TOKEN.PROGRAM_ID);
            
            // Initialize bet state
            this.currentBet = {
                amount: 0,
                bluePlayer: null,
                redPlayer: null,
                gameId: null,
                isActive: false,
                escrowAccount: null
            };
            
            this.setupBettingUI();
            
            // Verify connection
            await this.connection.getBlockHeight();
            console.log('Betting system initialized successfully');
            
            return true;
        } catch (error) {
            console.error('Failed to initialize betting system:', error);
            return false;
        }
    }

    async findAssociatedTokenAddress(walletAddress) {
        try {
            const SPL_ASSOCIATED_TOKEN_ACCOUNT_PROGRAM_ID = new solanaWeb3.PublicKey(
                this.config.ASSOCIATED_TOKEN_PROGRAM_ID
            );
            
            const [associatedToken] = await solanaWeb3.PublicKey.findProgramAddress(
                [
                    walletAddress.toBuffer(),
                    this.tokenProgram.toBuffer(),
                    this.lawbMint.toBuffer(),
                ],
                SPL_ASSOCIATED_TOKEN_ACCOUNT_PROGRAM_ID
            );
            
            console.log('Found associated token address:', associatedToken.toString());
            return associatedToken;
        } catch (error) {
            console.error('Error finding associated token address:', error);
            throw error;
        }
    }

    async createBetRecord(betDetails) {
        try {
            const { data, error } = await this.supabase
                .from('chess_bets')
                .insert([{
                    game_id: betDetails.gameId,
                    bet_amount: betDetails.amount,
                    blue_player: betDetails.bluePlayer,
                    red_player: betDetails.redPlayer,
                    status: 'pending',
                    escrow_account: betDetails.escrowAccount
                }])
                .select()
                .single();

            if (error) throw error;
            console.log('Bet record created:', data);
            return data;
        } catch (error) {
            console.error('Error creating bet record:', error);
            throw error;
        }
    }

    async updateBetRecord(gameId, updates) {
        try {
            const { data, error } = await this.supabase
                .from('chess_bets')
                .update(updates)
                .eq('game_id', gameId)
                .select()
                .single();

            if (error) throw error;
            console.log('Bet record updated:', data);
            return data;
        } catch (error) {
            console.error('Error updating bet record:', error);
            throw error;
        }
    }

    // Diagnostic function
    async runDiagnostics() {
        try {
            console.group('🔍 Running Chess Betting Diagnostics');
            
            // Test database connection
            console.log('\n📡 Testing Database Connection...');
            const { data: testQuery, error: dbError } = await this.supabase
                .from('chess_bets')
                .select('id')
                .limit(1);
                
            if (dbError) throw dbError;
            console.log('✅ Database connection successful');

            // Test Solana connection
            console.log('\n🌐 Testing Solana Connection...');
            const blockHeight = await this.connection.getBlockHeight();
            console.log('✅ Solana connection successful. Block height:', blockHeight);

            // Test wallet connection
            console.log('\n👛 Testing Wallet Connection...');
            const wallet = this.getConnectedWallet();
            if (wallet) {
                console.log('✅ Wallet detected:', wallet.publicKey.toString());
            } else {
                console.log('⚠️ No wallet connected');
            }

            console.log('\n✨ All diagnostics completed successfully!');
            console.groupEnd();
            return true;
        } catch (error) {
            console.error('❌ Diagnostic failed:', error);
            console.groupEnd();
            return {
                success: false,
                error: error.message,
                details: error
            };
        }
    }

    addDiagnosticsButton() {
        const gameInfo = document.getElementById('game-info');
        if (!gameInfo) return;

        const testButton = document.createElement('button');
        testButton.textContent = 'Test Betting System';
        testButton.className = 'difficulty-btn';
        testButton.style.marginTop = '10px';
        testButton.onclick = () => this.runDiagnostics();
        
        gameInfo.appendChild(testButton);
    }

    setupBettingUI() {
        const bettingContainer = document.createElement('div');
        bettingContainer.className = 'betting-container';
        bettingContainer.innerHTML = `
            <div class="betting-ui">
                <h3>$LAWB Betting</h3>
                <div class="bet-input">
                    <label>Bet Amount ($LAWB):</label>
                    <input type="number" id="betAmount" min="${this.config.MIN_BET}" max="${this.config.MAX_BET}" step="100" value="${this.config.MIN_BET}">
                    <p class="fee-info">House Fee (${this.config.HOUSE_FEE_PERCENTAGE}%): <span id="feeAmount">0</span> $LAWB</p>
                    <p class="total-info">Total Potential Win: <span id="potentialWin">0</span> $LAWB</p>
                </div>
                <button id="placeBet" class="bet-button">Place Bet</button>
                <div id="betStatus" class="bet-status"></div>
            </div>
        `;

        const chessGame = document.getElementById('chess-game');
        if (chessGame) {
            chessGame.parentNode.insertBefore(bettingContainer, chessGame);
            this.addBettingEventListeners();
        }
    }

    addBettingEventListeners() {
        const betAmountInput = document.getElementById('betAmount');
        const placeBetButton = document.getElementById('placeBet');
        const feeAmountSpan = document.getElementById('feeAmount');
        const potentialWinSpan = document.getElementById('potentialWin');

        betAmountInput?.addEventListener('input', (e) => {
            const amount = Number(e.target.value);
            const fee = (amount * this.config.HOUSE_FEE_PERCENTAGE / 100);
            const totalPot = amount * 2;
            const potentialWin = totalPot - fee;
            
            if (feeAmountSpan) feeAmountSpan.textContent = fee.toFixed(2);
            if (potentialWinSpan) potentialWinSpan.textContent = potentialWin.toFixed(2);
        });

        placeBetButton?.addEventListener('click', () => this.handleBetPlacement());
    }

    async handleBetPlacement() {
        try {
            const wallet = this.getConnectedWallet();
            if (!wallet || !wallet.publicKey) {
                this.updateBetStatus('Please connect your wallet first', 'error');
                return;
            }
    
            const amount = Number(document.getElementById('betAmount')?.value);
            if (!this.validateBetAmount(amount)) {
                return;
            }
    
            this.updateBetStatus('Processing bet...', 'processing');

            // Generate unique game ID if not exists
            const gameId = this.currentBet.gameId || this.generateGameId();
            
            try {
                // Check token balance
                const playerATA = await this.findAssociatedTokenAddress(wallet.publicKey);
                const balance = await this.connection.getTokenAccountBalance(playerATA);
                
                if (Number(balance.value.amount) < amount * Math.pow(10, this.config.LAWB_TOKEN.DECIMALS)) {
                    throw new Error('Insufficient $LAWB balance');
                }

                // Create escrow account
                const escrowAccount = await this.createEscrowAccount(gameId, amount);

                // Create bet record in database
                const betRecord = await this.createBetRecord({
                    gameId,
                    amount,
                    bluePlayer: wallet.publicKey.toString(),
                    status: 'pending',
                    escrowAccount: escrowAccount.pubkey.toString()
                });

                // Create and send transaction
                const transaction = await this.createBetTransaction(
                    wallet.publicKey,
                    amount,
                    escrowAccount.pubkey
                );

                const signature = await this.sendAndConfirmTransaction(transaction);
                console.log('Bet transaction confirmed:', signature);

                // Update bet status in database
                await this.updateBetRecord(gameId, {
                    status: 'active'
                });

                // Update current bet state
                this.currentBet = {
                    amount,
                    bluePlayer: wallet.publicKey.toString(),
                    gameId,
                    isActive: true,
                    escrowAccount
                };

                this.updateBetStatus('Bet placed successfully! Waiting for opponent...', 'success');
                this.disableBetting();

            } catch (error) {
                console.error('Betting error:', error);
                
                // Cleanup if needed
                if (this.currentBet.isActive) {
                    await this.supabase
                        .from('chess_bets')
                        .delete()
                        .match({ game_id: gameId });
                    this.resetBetState();
                }
                throw error;
            }

        } catch (error) {
            console.error('Bet placement error:', error);
            this.updateBetStatus('Failed to place bet: ' + error.message, 'error');
            this.enableBetting();
        }
    }

    getConnectedWallet() {
        return window.solflare?.isConnected ? window.solflare : 
               window.solana?.isConnected ? window.solana : null;
    }

    validateBetAmount(amount) {
        if (amount < this.config.MIN_BET) {
            this.updateBetStatus(`Minimum bet is ${this.config.MIN_BET} $LAWB`, 'error');
            return false;
        }
        if (amount > this.config.MAX_BET) {
            this.updateBetStatus(`Maximum bet is ${this.config.MAX_BET} $LAWB`, 'error');
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

    generateGameId() {
        return 'game_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    }

    async createEscrowAccount(gameId, amount) {
        try {
            console.log('Creating escrow account for game:', gameId);
            
            const [escrowPubkey] = await solanaWeb3.PublicKey.findProgramAddress(
                [
                    Buffer.from(this.config.ESCROW_SEED),
                    Buffer.from(gameId)
                ],
                this.tokenProgram
            );

            const escrowAccount = {
                pubkey: escrowPubkey,
                gameId: gameId,
                amount: amount,
                player1: null,
                player2: null,
                player1Deposited: false,
                player2Deposited: false
            };

            console.log('Escrow account created:', escrowAccount);
            return escrowAccount;

        } catch (error) {
            console.error('Error creating escrow account:', error);
            throw error;
        }
    }

    async createBetTransaction(playerPublicKey, amount, escrowPubkey) {
        try {
            console.log('Creating bet transaction...');
            
            const transaction = new solanaWeb3.Transaction();
            
            // Get player's token account
            const playerATA = await this.findAssociatedTokenAddress(playerPublicKey);
            
            // Get escrow token account
            const escrowATA = await this.findAssociatedTokenAddress(escrowPubkey);
            
            // Check if escrow token account exists
            const escrowAccount = await this.connection.getAccountInfo(escrowATA);
            
            // If escrow token account doesn't exist, create it
            if (!escrowAccount) {
                const createATAIx = new solanaWeb3.TransactionInstruction({
                    programId: new solanaWeb3.PublicKey(this.config.ASSOCIATED_TOKEN_PROGRAM_ID),
                    keys: [
                        { pubkey: playerPublicKey, isSigner: true, isWritable: true },
                        { pubkey: escrowATA, isSigner: false, isWritable: true },
                        { pubkey: escrowPubkey, isSigner: false, isWritable: false },
                        { pubkey: this.lawbMint, isSigner: false, isWritable: false },
                        { pubkey: solanaWeb3.SystemProgram.programId, isSigner: false, isWritable: false },
                        { pubkey: this.tokenProgram, isSigner: false, isWritable: false }
                    ],
                    data: Buffer.from([])
                });
                transaction.add(createATAIx);
            }

            // Convert amount to proper decimals
            const tokenAmount = new BN(amount * Math.pow(10, this.config.LAWB_TOKEN.DECIMALS));

            // Create transfer instruction
            const transferIx = new solanaWeb3.TransactionInstruction({
                programId: this.tokenProgram,
                keys: [
                    { pubkey: playerATA, isSigner: false, isWritable: true },
                    { pubkey: escrowATA, isSigner: false, isWritable: true },
                    { pubkey: playerPublicKey, isSigner: true, isWritable: false },
                    { pubkey: this.lawbMint, isSigner: false, isWritable: false }
                ],
                data: Buffer.from([
                    0x02, // Transfer instruction
                    ...tokenAmount.toArray('le', 8)
                ])
            });
            
            transaction.add(transferIx);

            console.log('Bet transaction created successfully');
            return transaction;

        } catch (error) {
            console.error('Error creating bet transaction:', error);
            throw error;
        }
    }

    async sendAndConfirmTransaction(transaction) {
        try {
            console.log('Sending transaction...');
            
            const wallet = this.getConnectedWallet();
            if (!wallet) throw new Error('No wallet connected');

            // Get latest blockhash and add to transaction
            const { blockhash, lastValidBlockHeight } = await this.connection.getLatestBlockhash('finalized');
            transaction.recentBlockhash = blockhash;
            transaction.feePayer = wallet.publicKey;

            // Sign transaction
            const signed = await wallet.signTransaction(transaction);
            
            // Send transaction
            const signature = await this.connection.sendRawTransaction(signed.serialize(), {
                skipPreflight: false,
                preflightCommitment: 'finalized',
                maxRetries: 3
            });

            console.log('Transaction sent:', signature);

            // Confirm transaction
            const confirmation = await this.connection.confirmTransaction({
                signature,
                blockhash,
                lastValidBlockHeight
            }, 'finalized');

            if (confirmation.value.err) {
                throw new Error('Transaction failed: ' + confirmation.value.err);
            }

            console.log('Transaction confirmed:', signature);
            return signature;

        } catch (error) {
            console.error('Transaction error:', error);
            throw error;
        }
    }

    async createPayoutTransaction(winner, amount) {
        try {
            console.log('Creating payout transaction...');
            
            const transaction = new solanaWeb3.Transaction();
            const winnerPubkey = new solanaWeb3.PublicKey(winner);
            const housePubkey = new solanaWeb3.PublicKey(this.config.HOUSE_WALLET);
            
            // Calculate amounts
            const houseFee = Math.floor(amount * 2 * (this.config.HOUSE_FEE_PERCENTAGE / 100));
            const winnerAmount = (amount * 2) - houseFee;
            
            // Get token accounts
            const escrowATA = await this.findAssociatedTokenAddress(this.currentBet.escrowAccount.pubkey);
            const winnerATA = await this.findAssociatedTokenAddress(winnerPubkey);
            const houseATA = await this.findAssociatedTokenAddress(housePubkey);
            
            // Create winner payout instruction
            const winnerPayoutIx = new solanaWeb3.TransactionInstruction({
                programId: this.tokenProgram,
                keys: [
                    { pubkey: escrowATA, isSigner: false, isWritable: true },
                    { pubkey: winnerATA, isSigner: false, isWritable: true },
                    { pubkey: housePubkey, isSigner: true, isWritable: false }
                ],
                data: Buffer.from([
                    3, // Transfer instruction
                    ...new BN(winnerAmount).toArray('le', 8)
                ])
            });
            
            // Create house fee instruction
            const houseFeeIx = new solanaWeb3.TransactionInstruction({
                programId: this.tokenProgram,
                keys: [
                    { pubkey: escrowATA, isSigner: false, isWritable: true },
                    { pubkey: houseATA, isSigner: false, isWritable: true },
                    { pubkey: housePubkey, isSigner: true, isWritable: false }
                ],
                data: Buffer.from([
                    3, // Transfer instruction
                    ...new BN(houseFee).toArray('le', 8)
                ])
            });
            
            transaction.add(winnerPayoutIx);
            transaction.add(houseFeeIx);
            
            console.log('Payout transaction created successfully');
            return transaction;

        } catch (error) {
            console.error('Error creating payout transaction:', error);
            throw error;
        }
    }

    // Helper function to validate transaction inputs
    validateTransactionInputs(gameId, amount, playerAddress) {
        if (!gameId || typeof gameId !== 'string') {
            throw new Error('Invalid game ID');
        }
        if (!amount || amount <= 0) {
            throw new Error('Invalid amount');
        }
        try {
            new solanaWeb3.PublicKey(playerAddress);
        } catch {
            throw new Error('Invalid player address');
        }
        return true;
    }

    async processWinner(winner) {
        try {
            if (!this.currentBet.isActive) {
                console.log('No active bet found');
                return;
            }

            console.log('Processing winner:', winner);
            
            // Update bet status to processing
            await this.updateBetRecord(this.currentBet.gameId, {
                status: 'processing',
                winner: winner
            });

            this.updateBetStatus('Processing winner payout...', 'processing');

            if (winner === 'draw') {
                await this.processDrawPayout();
                return;
            }

            // Get winner address based on color
            const winnerAddress = winner === 'blue' ? 
                this.currentBet.bluePlayer : 
                this.currentBet.redPlayer;

            if (!winnerAddress) {
                throw new Error('Winner address not found');
            }

            // Create and send payout transaction
            const payoutTx = await this.createPayoutTransaction(
                winnerAddress, 
                this.currentBet.amount
            );
            
            const signature = await this.sendAndConfirmTransaction(payoutTx);
            console.log('Payout transaction confirmed:', signature);

            // Update bet record
            await this.updateBetRecord(this.currentBet.gameId, {
                status: 'completed',
                processed_at: new Date().toISOString()
            });

            // Calculate payout amount
            const totalPot = this.currentBet.amount * 2;
            const houseFee = totalPot * (this.config.HOUSE_FEE_PERCENTAGE / 100);
            const payoutAmount = totalPot - houseFee;

            this.updateBetStatus(
                `Game ended! Winner payout of ${payoutAmount} $LAWB processed`, 
                'success'
            );

            // Reset bet state
            this.resetBetState();

        } catch (error) {
            console.error('Payout processing error:', error);
            this.updateBetStatus('Failed to process winner payout: ' + error.message, 'error');
            
            // Update bet record with error status
            await this.updateBetRecord(this.currentBet.gameId, {
                status: 'failed',
                processed_at: new Date().toISOString()
            });
        }
    }

    async processDrawPayout() {
        try {
            console.log('Processing draw payout...');
            const amount = this.currentBet.amount;
            
            // Return original bets to both players
            for (const player of [this.currentBet.bluePlayer, this.currentBet.redPlayer]) {
                if (!player) continue;
                
                const refundTx = await this.createRefundTransaction(
                    new solanaWeb3.PublicKey(player),
                    amount
                );
                
                const signature = await this.sendAndConfirmTransaction(refundTx);
                console.log(`Refund processed for ${player}:`, signature);
            }

            await this.updateBetRecord(this.currentBet.gameId, {
                status: 'completed',
                winner: 'draw',
                processed_at: new Date().toISOString()
            });

            this.updateBetStatus('Game ended in draw. Bets have been refunded.', 'success');
            this.resetBetState();

        } catch (error) {
            console.error('Draw payout error:', error);
            this.updateBetStatus('Failed to process draw refunds: ' + error.message, 'error');
        }
    }

    async createRefundTransaction(playerPubkey, amount) {
        try {
            const transaction = new solanaWeb3.Transaction();
            const playerATA = await this.findAssociatedTokenAddress(playerPubkey);
            const escrowATA = await this.findAssociatedTokenAddress(
                this.currentBet.escrowAccount.pubkey
            );
            
            // Convert amount to proper decimals
            const tokenAmount = new BN(amount * Math.pow(10, this.config.LAWB_TOKEN.DECIMALS));

            const refundIx = new solanaWeb3.TransactionInstruction({
                programId: this.tokenProgram,
                keys: [
                    { pubkey: escrowATA, isSigner: false, isWritable: true },
                    { pubkey: playerATA, isSigner: false, isWritable: true },
                    { pubkey: playerPubkey, isSigner: true, isWritable: false }
                ],
                data: Buffer.from([
                    3, // Transfer instruction
                    ...tokenAmount.toArray('le', 8)
                ])
            });

            transaction.add(refundIx);
            return transaction;

        } catch (error) {
            console.error('Error creating refund transaction:', error);
            throw error;
        }
    }

    setupMultiplayerBetting() {
        const createGameBtn = document.querySelector('.multiplayer-btn[id="create-game"]');
        const joinGameBtn = document.querySelector('.multiplayer-btn[id="join-game"]');
        const bettingContainer = document.querySelector('.betting-container');

        // Show/hide betting UI based on game mode
        const multiplayerBtn = document.getElementById('multiplayer-mode');
        const aiModeBtn = document.getElementById('ai-mode');
        
        if (multiplayerBtn && bettingContainer) {
            multiplayerBtn.addEventListener('click', () => {
                bettingContainer.style.display = 'block';
                this.resetBetState();
            });
        }
        
        if (aiModeBtn && bettingContainer) {
            aiModeBtn.addEventListener('click', () => {
                bettingContainer.style.display = 'none';
                this.resetBetState();
            });
        }

        if (createGameBtn) {
            createGameBtn.addEventListener('click', async () => {
                if (!this.currentBet.isActive) {
                    this.updateBetStatus('Please place a bet first', 'error');
                    return;
                }

                try {
                    const gameCode = this.currentBet.gameId;
                    await this.updateBetRecord(gameCode, { status: 'awaiting_opponent' });
                    
                    if (window.multiplayerManager) {
                        await window.multiplayerManager.createGame(gameCode);
                    }
                    
                    this.updateBetStatus(`Share this code with opponent: ${gameCode}`, 'success');
                } catch (error) {
                    console.error('Game creation error:', error);
                    this.updateBetStatus('Failed to create game: ' + error.message, 'error');
                }
            });
        }

        if (joinGameBtn) {
            joinGameBtn.addEventListener('click', async () => {
                const gameCodeInput = document.getElementById('game-code-input');
                const gameCode = gameCodeInput?.value;
                
                if (!gameCode) {
                    this.updateBetStatus('Please enter a game code', 'error');
                    return;
                }

                try {
                    // Check if game exists and is awaiting opponent
                    const { data: betData, error } = await this.supabase
                        .from('chess_bets')
                        .select('*')
                        .eq('game_id', gameCode)
                        .eq('status', 'awaiting_opponent')
                        .single();

                    if (error || !betData) {
                        throw new Error('Invalid game code or game already started');
                    }

                    // Set bet amount to match existing bet
                    const betInput = document.getElementById('betAmount');
                    if (betInput) betInput.value = betData.bet_amount;

                    // Join the game first
                    if (window.multiplayerManager) {
                        await window.multiplayerManager.joinGame(gameCode);
                    }
                    
                    // Place matching bet
                    await this.handleBetPlacement();
                    
                } catch (error) {
                    console.error('Error joining game:', error);
                    this.updateBetStatus('Failed to join game: ' + error.message, 'error');
                }
            });
        }
    }

    disableBetting() {
        const betButton = document.getElementById('placeBet');
        const betInput = document.getElementById('betAmount');
        if (betButton) betButton.disabled = true;
        if (betInput) betInput.disabled = true;
    }

    enableBetting() {
        const betButton = document.getElementById('placeBet');
        const betInput = document.getElementById('betAmount');
        if (betButton) betButton.disabled = false;
        if (betInput) betInput.disabled = false;
    }

    resetBetState() {
        this.currentBet = {
            amount: 0,
            bluePlayer: null,
            redPlayer: null,
            gameId: null,
            isActive: false,
            escrowAccount: null
        };
        this.enableBetting();
    }

    static addStyles() {
        const styles = `
            .betting-container {
                background: rgba(0, 0, 0, 0.7);
                padding: 20px;
                border-radius: 10px;
                margin-bottom: 20px;
                border: 1px solid rgba(255, 0, 0, 0.3);
                color: white;
            }

            .betting-ui {
                max-width: 400px;
                margin: 0 auto;
            }

            .bet-input {
                margin: 15px 0;
            }

            .bet-input input {
                width: 100%;
                padding: 8px;
                margin: 5px 0;
                background: rgba(0, 0, 0, 0.5);
                border: 1px solid rgba(255, 0, 0, 0.3);
                color: white;
                border-radius: 4px;
            }

            .fee-info, .total-info {
                font-size: 0.9em;
                color: #aaa;
            }

            .bet-button {
                background: linear-gradient(45deg, #FF0000, #CC0000);
                border: none;
                padding: 10px 20px;
                color: white;
                border-radius: 5px;
                cursor: pointer;
                transition: all 0.3s ease;
            }

            .bet-button:hover:not(:disabled) {
                transform: translateY(-2px);
                box-shadow: 0 0 15px rgba(255, 0, 0, 0.3);
            }

            .bet-button:disabled {
                opacity: 0.5;
                cursor: not-allowed;
            }

            .bet-status {
                margin-top: 10px;
                padding: 10px;
                border-radius: 4px;
            }

            .bet-status.error {
                background: rgba(255, 0, 0, 0.2);
                border: 1px solid rgba(255, 0, 0, 0.3);
            }

            .bet-status.processing {
                background: rgba(255, 255, 0, 0.2);
                border: 1px solid rgba(255, 255, 0, 0.3);
            }

            .bet-status.success {
                background: rgba(0, 255, 0, 0.2);
                border: 1px solid rgba(0, 255, 0, 0.3);
            }
        `;

        const styleSheet = document.createElement("style");
        styleSheet.textContent = styles;
        document.head.appendChild(styleSheet);
    }
}

// Initialize styles
ChessBetting.addStyles();

// Export for use
window.ChessBetting = ChessBetting;