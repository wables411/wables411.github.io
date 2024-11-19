/* global solanaWeb3, BN, Buffer */

class ChessBetting {
    constructor() {
        this.config = window.BETTING_CONFIG;
        this.solanaConfig = window.SOLANA_CONFIG;
        this.supabase = window.gameDatabase;
        this.connection = null;
        this.gameStates = new Map();
        
        this.currentBet = {
            amount: 0,
            bluePlayer: null,
            redPlayer: null,
            gameId: null,
            isActive: false,
            escrowAccount: null
        };

        this.initializeUI();
        this.init();
    }

    generateGameId() {
        const timestamp = Date.now().toString(36);
        const randomStr = Math.random().toString(36).substring(2, 8);
        return `${timestamp}-${randomStr}`.toUpperCase();
    }

    async createEscrowAccount(gameId, amount) {
        try {
            // Find PDA for this game
            const escrowPDA = await this.config.findEscrowPDA(gameId);
            
            // Find token account for escrow
            const escrowATA = await this.findAssociatedTokenAddress(escrowPDA);
            
            // Create unique seed for this escrow
            const seed = Buffer.from(gameId + this.config.ESCROW.SEED);
            
            console.log('Created escrow account:', {
                escrowPDA: escrowPDA.toString(),
                escrowATA: escrowATA.toString()
            });
    
            return {
                pubkey: escrowPDA,
                tokenAccount: escrowATA,
                seed: seed
            };
        } catch (error) {
            console.error('Error creating escrow account:', error);
            throw error;
        }
    }

    async createBetTransaction(playerPublicKey, amount, escrowData) {
        try {
            console.log('Creating bet transaction...');
            
            const transaction = new solanaWeb3.Transaction();
            
            // Get player's token account
            const playerATA = await this.findAssociatedTokenAddress(playerPublicKey);
            
            // Get escrow token account
            const escrowATA = escrowData.tokenAccount;
            
            // Check player balance
            const balance = await this.connection.getTokenAccountBalance(playerATA);
            const requiredAmount = amount * Math.pow(10, this.config.LAWB_TOKEN.DECIMALS);
            
            if (Number(balance.value.amount) < requiredAmount) {
                throw new Error(`Insufficient $LAWB balance. Required: ${amount}, Available: ${Number(balance.value.amount) / Math.pow(10, this.config.LAWB_TOKEN.DECIMALS)}`);
            }
    
            // Create escrow ATA if it doesn't exist
            const escrowAccountInfo = await this.connection.getAccountInfo(escrowATA);
            if (!escrowAccountInfo) {
                console.log('Creating escrow token account...');
                const createATAIx = this.createATAInstruction(
                    playerPublicKey,
                    escrowATA,
                    escrowData.pubkey
                );
                transaction.add(createATAIx);
            }
    
            // Create transfer instruction
            const transferIx = this.createTransferInstruction(
                playerATA,
                escrowATA,
                playerPublicKey,
                amount
            );
            transaction.add(transferIx);
    
            console.log('Bet transaction created successfully');
            return transaction;
    
        } catch (error) {
            console.error('Error creating bet transaction:', error);
            throw error;
        }
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
                // First create the game record
                const { error: gameError } = await this.supabase
                    .from('chess_games')
                    .insert([{
                        game_id: gameId,
                        blue_player: wallet.publicKey.toString(),
                        game_state: 'waiting',
                        current_player: 'blue',
                        board: {
                            positions: board,
                            pieceState: pieceState
                        }
                    }]);

                if (gameError) throw gameError;

                // Create escrow account
                const escrowAccount = await this.createEscrowAccount(gameId, amount);
                console.log('Created escrow account:', escrowAccount);

                // Create and send bet transaction
                const betTx = await this.createBetTransaction(
                    wallet.publicKey,
                    amount,
                    escrowAccount
                );

                // Sign and send transaction
                const signature = await this.sendAndConfirmTransaction(betTx);
                console.log('Bet transaction confirmed:', signature);

                // Create bet record
                await this.createBetRecord({
                    gameId,
                    amount,
                    bluePlayer: wallet.publicKey.toString(),
                    status: 'pending',
                    escrowAccount: escrowAccount.pubkey.toString()
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
                this.resetBetState();
                throw error;
            }

        } catch (error) {
            console.error('Bet placement error:', error);
            this.updateBetStatus('Failed to place bet: ' + error.message, 'error');
            this.enableBetting();
        }
    }

    initializeUI() {
        this.setupBettingUI();
        this.addDiagnosticsButton();
        this.setupMultiplayerBetting();
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

    addBettingEventListeners() {
        const betAmountInput = document.getElementById('betAmount');
        const placeBetButton = document.getElementById('placeBet');
        const feeAmountSpan = document.getElementById('feeAmount');
        const potentialWinSpan = document.getElementById('potentialWin');

        if (betAmountInput) {
            betAmountInput.addEventListener('input', (e) => {
                const amount = Number(e.target.value);
                const fee = (amount * this.config.HOUSE_FEE_PERCENTAGE / 100);
                const totalPot = amount * 2;
                const potentialWin = totalPot - fee;
                
                if (feeAmountSpan) feeAmountSpan.textContent = fee.toFixed(2);
                if (potentialWinSpan) potentialWinSpan.textContent = potentialWin.toFixed(2);
            });
        }

        if (placeBetButton) {
            placeBetButton.addEventListener('click', () => this.handleBetPlacement());
            // Trigger initial fee calculation
            betAmountInput?.dispatchEvent(new Event('input'));
        }

        // Show/hide betting UI based on game mode
        const multiplayerBtn = document.getElementById('multiplayer-mode');
        const aiModeBtn = document.getElementById('ai-mode');
        const bettingContainer = document.getElementById('betting-container');
        
        if (multiplayerBtn && bettingContainer) {
            multiplayerBtn.addEventListener('click', () => {
                bettingContainer.style.display = 'block';
            });
        }
        
        if (aiModeBtn && bettingContainer) {
            aiModeBtn.addEventListener('click', () => {
                bettingContainer.style.display = 'none';
            });
        }
    }

    updateBetStatus(message, type = 'info') {
        const statusElement = document.getElementById('betStatus');
        if (statusElement) {
            statusElement.textContent = message;
            statusElement.className = `bet-status ${type}`;
        }
        console.log(`Bet status: ${message}`);
    }

    async init() {
        try {
            await this.initializeBetting();
            console.log('Initialization complete');
        } catch (error) {
            console.error('Failed to initialize ChessBetting:', error);
            this.updateBetStatus('Failed to initialize betting system', 'error');
        }
    }

    async initializeBetting() {
        try {
            console.log('Initializing betting system...');
            
            // Get best Solana endpoint and create connection
            this.connection = await this.solanaConfig.createConnection();
            
            // Initialize LAWB token
            this.lawbMint = new solanaWeb3.PublicKey(this.config.LAWB_TOKEN.MINT);
            this.tokenProgram = new solanaWeb3.PublicKey(this.config.LAWB_TOKEN.PROGRAM_ID);
            
            // Verify connection and token setup
            await this.verifySetup();
            
            console.log('Betting system initialized successfully');
            return true;
        } catch (error) {
            console.error('Failed to initialize betting system:', error);
            this.updateBetStatus('Failed to initialize betting system. Please try again.', 'error');
            return false;
        }
    }

    async verifySetup() {
        try {
            // Test connection
            const blockHeight = await this.connection.getBlockHeight();
            console.log('Connected to Solana network. Block height:', blockHeight);

            // Verify LAWB token
            const tokenInfo = await this.connection.getParsedAccountInfo(this.lawbMint);
            if (!tokenInfo.value) {
                throw new Error('Failed to verify LAWB token');
            }
            console.log('LAWB token verified');

            return true;
        } catch (error) {
            console.error('Setup verification failed:', error);
            throw error;
        }
    }

    async findAssociatedTokenAddress(walletAddress) {
        try {
            const SPL_ASSOCIATED_TOKEN_ACCOUNT_PROGRAM_ID = new solanaWeb3.PublicKey(
                this.config.ASSOCIATED_TOKEN_PROGRAM_ID
            );
            
            if (!walletAddress || !walletAddress.toBuffer) {
                throw new Error('Invalid wallet address');
            }
            
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

    createATAInstruction(payer, ata, owner) {
        return new solanaWeb3.TransactionInstruction({
            programId: new solanaWeb3.PublicKey(this.config.ASSOCIATED_TOKEN_PROGRAM_ID),
            keys: [
                { pubkey: payer, isSigner: true, isWritable: true },
                { pubkey: ata, isSigner: false, isWritable: true },
                { pubkey: owner, isSigner: false, isWritable: false },
                { pubkey: this.lawbMint, isSigner: false, isWritable: false },
                { pubkey: solanaWeb3.SystemProgram.programId, isSigner: false, isWritable: false },
                { pubkey: this.tokenProgram, isSigner: false, isWritable: false }
            ],
            data: Buffer.from([])
        });
    }

    createTransferInstruction(from, to, authority, amount) {
        const tokenAmount = new BN(amount * Math.pow(10, this.config.LAWB_TOKEN.DECIMALS));
        return new solanaWeb3.TransactionInstruction({
            programId: this.tokenProgram,
            keys: [
                { pubkey: from, isSigner: false, isWritable: true },
                { pubkey: to, isSigner: false, isWritable: true },
                { pubkey: authority, isSigner: true, isWritable: false },
                { pubkey: this.lawbMint, isSigner: false, isWritable: false }
            ],
            data: Buffer.from([
                0x02, // Transfer instruction
                ...tokenAmount.toArray('le', 8)
            ])
        });
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
            const escrowATA = this.currentBet.escrowAccount.tokenAccount;
            const winnerATA = await this.findAssociatedTokenAddress(winnerPubkey);
            const houseATA = await this.findAssociatedTokenAddress(housePubkey);
            
            // Create winner payout instruction
            const winnerPayoutIx = new solanaWeb3.TransactionInstruction({
                programId: this.tokenProgram,
                keys: [
                    { pubkey: escrowATA, isSigner: false, isWritable: true },
                    { pubkey: winnerATA, isSigner: false, isWritable: true },
                    { pubkey: this.currentBet.escrowAccount.pubkey, isSigner: true, isWritable: false }
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
                    { pubkey: this.currentBet.escrowAccount.pubkey, isSigner: true, isWritable: false }
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

    validateBetAmount(amount) {
        if (!amount || isNaN(amount)) {
            this.updateBetStatus('Invalid bet amount', 'error');
            return false;
        }
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

    getConnectedWallet() {
        return window.solflare?.isConnected ? window.solflare : 
               window.solana?.isConnected ? window.solana : null;
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