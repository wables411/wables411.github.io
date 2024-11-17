class ChessBetting {
    constructor() {
        this.config = window.BETTING_CONFIG;
        this.supabase = window.gameDatabase;
        this.initializeBetting();
        this.setupMultiplayerBetting();
        this.gameStates = new Map();
    }

    async initializeBetting() {
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
            isActive: false
        };
        
        this.setupBettingUI();
    }

    async findAssociatedTokenAddress(walletAddress) {
        try {
            const SPL_ASSOCIATED_TOKEN_ACCOUNT_PROGRAM_ID = new solanaWeb3.PublicKey('ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL');
            
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

        betAmountInput?.addEventListener('input', (e) => {
            const amount = Number(e.target.value);
            const fee = (amount * this.config.HOUSE_FEE_PERCENTAGE / 100).toFixed(2);
            if (feeAmountSpan) feeAmountSpan.textContent = fee;
        });

        placeBetButton?.addEventListener('click', () => this.handleBetPlacement());
    }

    async handleBetPlacement() {
        try {
            // Check wallet connection
            const wallet = window.solflare.isConnected ? window.solflare : window.solana;
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
                // Check token balance first
                const playerATA = await this.findAssociatedTokenAddress(wallet.publicKey);
                const balance = await this.connection.getTokenAccountBalance(playerATA);
                
                if (Number(balance.value.amount) < amount * Math.pow(10, this.config.LAWB_TOKEN.DECIMALS)) {
                    throw new Error('Insufficient $LAWB balance');
                }

                // Create bet record in database
                const { data: betData, error: betError } = await this.supabase
                    .from('chess_bets')
                    .insert({
                        game_id: gameId,
                        bet_amount: amount,
                        blue_player: wallet.publicKey.toString(),
                        status: 'pending'
                    })
                    .select()
                    .single();

                if (betError) throw betError;

                // Update current bet state
                this.currentBet = {
                    amount: amount,
                    bluePlayer: wallet.publicKey.toString(),
                    gameId: gameId,
                    isActive: true
                };

                // Create transaction to lock tokens
                const transaction = new solanaWeb3.Transaction();
                
                // Add token transfer instruction
                const escrowInstruction = await this.createEscrowInstruction(
                    wallet.publicKey,
                    amount
                );
                
                transaction.add(escrowInstruction);

                // Sign and send transaction
                const signature = await this.sendAndConfirmTransaction(transaction);

                this.updateBetStatus('Bet placed successfully! Waiting for opponent...', 'success');
                this.disableBetting();

            } catch (error) {
                console.error('Database or transaction error:', error);
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

    async createEscrowInstruction(playerPublicKey, amount) {
        try {
            const playerATA = await this.findAssociatedTokenAddress(playerPublicKey);
            const escrowATA = await this.findAssociatedTokenAddress(new solanaWeb3.PublicKey(this.config.HOUSE_WALLET));
            
            // Convert amount to proper decimals
            const tokenAmount = new BN(amount * Math.pow(10, this.config.LAWB_TOKEN.DECIMALS));

            return new solanaWeb3.TransactionInstruction({
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
        } catch (error) {
            console.error('Error creating escrow instruction:', error);
            throw error;
        }
    }

    async sendAndConfirmTransaction(transaction) {
        try {
            const wallet = window.solflare.isConnected ? window.solflare : window.solana;
            
            const { blockhash } = await this.connection.getLatestBlockhash('finalized');
            transaction.recentBlockhash = blockhash;
            transaction.feePayer = wallet.publicKey;

            // Sign transaction
            const signed = await wallet.signTransaction(transaction);
            
            // Send transaction
            const signature = await this.connection.sendRawTransaction(signed.serialize(), {
                skipPreflight: false,
                preflightCommitment: 'finalized'
            });

            // Confirm transaction
            const confirmation = await this.connection.confirmTransaction({
                signature,
                blockhash,
                lastValidBlockHeight: await this.connection.getBlockHeight()
            });

            if (confirmation.value.err) {
                throw new Error('Transaction failed: ' + confirmation.value.err);
            }

            return signature;

        } catch (error) {
            console.error('Transaction error:', error);
            throw error;
        }
    }

    async processWinner(winner) {
        if (!this.currentBet.isActive) {
            console.log('No active bet found');
            return;
        }

        try {
            console.log('Processing winner:', winner);
            const gameState = this.gameStates.get(this.currentBet.gameId);
            if (!gameState) {
                throw new Error('Game state not found');
            }

            this.updateBetStatus('Processing winner payout...', 'processing');

            // Call database function to process bet
            const { data, error } = await this.supabase.rpc(
                'process_bet_completion',
                {
                    game_id: this.currentBet.gameId,
                    winner: winner
                }
            );

            if (error) throw error;

            if (!data.success) {
                throw new Error(data.error || 'Failed to process bet');
            }

            // Update game state
            gameState.status = 'completed';
            gameState.winner = winner;
            gameState.payoutAmount = data.payout_amount;

            this.updateBetStatus(`Game ended! Winner payout of ${data.payout_amount} $LAWB processed`, 'success');

            // Reset bet state
            this.resetBetState();

        } catch (error) {
            console.error('Payout processing error:', error);
            this.updateBetStatus('Failed to process winner payout: ' + error.message, 'error');
        }
    }

    setupMultiplayerBetting() {
        const createGameBtn = document.querySelector('.multiplayer-btn[id="create-game"]');
        const joinGameBtn = document.querySelector('.multiplayer-btn[id="join-game"]');
        const bettingContainer = document.querySelector('.betting-container');

        // Show betting UI only in multiplayer mode
        const multiplayerBtn = document.getElementById('multiplayer-mode');
        const aiModeBtn = document.getElementById('ai-mode');
        
        if (multiplayerBtn && bettingContainer) {
            multiplayerBtn.addEventListener('click', () => {
                bettingContainer.style.display = 'block';
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
                    
                    // Store game data
                    const gameData = {
                        gameCode,
                        bet: this.currentBet.amount,
                        player1: this.currentBet.bluePlayer,
                        timeCreated: Date.now()
                    };
                    
                    localStorage.setItem(`game_${gameCode}`, JSON.stringify(gameData));
                    this.updateBetStatus(`Share this code with opponent: ${gameCode}`, 'success');
                    
                    if (window.multiplayerManager) {
                        window.multiplayerManager.createGame(gameCode);
                    }
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
                    const gameDataStr = localStorage.getItem(`game_${gameCode}`);
                    if (!gameDataStr) {
                        this.updateBetStatus('Invalid game code', 'error');
                        return;
                    }

                    const gameData = JSON.parse(gameDataStr);
                    
                    // Join game first
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

    // Utility functions
    updateBetStatus(message, type = 'info') {
        const statusElement = document.getElementById('betStatus');
        if (statusElement) {
            statusElement.textContent = message;
            statusElement.className = `bet-status ${type}`;
        }
        console.log(`Bet status: ${message}`);
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

    generateGameId() {
        return 'game_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
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
            isActive: false
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

            .fee-info {
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

            .bet-button:hover {
                transform: translateY(-2px);
                box-shadow: 0 0 15px rgba(255, 0, 0, 0.3);
            }

            .bet-button:disabled {
                opacity: 0.5;
                cursor: not-allowed;
                transform: none;
                box-shadow: none;
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