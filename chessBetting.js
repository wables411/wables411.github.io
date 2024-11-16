class ChessBetting {
    constructor() {
        this.config = BETTING_CONFIG;
        this.initializeBetting();
        this.setupMultiplayerBetting();
        this.gameStates = new Map(); // Stores active game states
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

    async initializeBetting() {
        // Initialize Solana web3 connection with config
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
    }

    async createEscrowAccount(gameId, amount) {
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

        return escrowAccount;
    }

    async setupBettingUI() {
        const bettingContainer = document.createElement('div');
        bettingContainer.className = 'betting-container';
        bettingContainer.innerHTML = `
            <div class="betting-ui">
                <h3>$LAWB Betting</h3>
                <div class="bet-input">
                    <label>Bet Amount ($LAWB):</label>
                    <input type="number" id="betAmount" min="${this.config.MIN_BET}" max="${this.config.MAX_BET}" step="100" value="${this.config.MIN_BET}">
                    <p class="fee-info">House Fee (5%): <span id="feeAmount">0</span> $LAWB</p>
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
            if (amount < this.config.MIN_BET || amount > this.config.MAX_BET) {
                this.updateBetStatus(`Bet must be between ${this.config.MIN_BET} and ${this.config.MAX_BET} $LAWB`, 'error');
                return;
            }
    
            this.updateBetStatus('Processing bet...', 'processing');

            // Generate unique game ID
            const gameId = this.generateGameId();
            
            // Create escrow account for this game
            const escrowAccount = await this.createEscrowAccount(gameId, amount);
            this.currentBet.escrowAccount = escrowAccount;
            this.currentBet.gameId = gameId;
            
            // Process initial bet placement
            await this.processBet(amount, gameId, true);
    
        } catch (error) {
            console.error('Bet placement error:', error);
            this.updateBetStatus('Failed to place bet: ' + error.message, 'error');
        }
    }

    async processBet(amount, gameId, isFirstPlayer = true) {
        try {
            if (!this.validateBetAmount(amount)) return;
            
            const wallet = window.solflare.isConnected ? window.solflare : window.solana;
            if (!wallet || !wallet.publicKey) {
                throw new Error('Wallet not connected');
            }
    
            this.updateBetStatus('Creating escrow transaction...', 'processing');
    
            const transaction = await this.createEscrowTransaction(amount, gameId, isFirstPlayer);
            const signature = await this.sendTransaction(transaction);
    
            this.updateBetStatus('Confirming transaction...', 'processing');
            const confirmation = await this.confirmTransaction(signature);
            
            if (confirmation?.value?.err) {
                throw new Error('Transaction failed: ' + confirmation.value.err);
            }
    
            // Update bet state
            if (isFirstPlayer) {
                this.currentBet = {
                    amount: amount,
                    bluePlayer: wallet.publicKey.toBase58(),
                    redPlayer: null,
                    gameId: gameId,
                    isActive: true,
                    escrowAccount: this.currentBet.escrowAccount
                };
                this.currentBet.escrowAccount.player1 = wallet.publicKey.toBase58();
                this.currentBet.escrowAccount.player1Deposited = true;
                
                // Store game state
                this.gameStates.set(gameId, {
                    status: 'awaiting_opponent',
                    amount: amount,
                    player1: wallet.publicKey.toBase58(),
                    escrowAccount: this.currentBet.escrowAccount
                });

                console.log('Initial bet state updated:', this.currentBet);
                this.updateBetStatus(`Bet placed successfully! Share game code: ${gameId}`, 'success');
                this.disableBetting();
            } else {
                // Update state for second player
                const gameState = this.gameStates.get(gameId);
                if (!gameState) {
                    throw new Error('Game not found');
                }

                gameState.status = 'in_progress';
                gameState.player2 = wallet.publicKey.toBase58();
                this.currentBet.redPlayer = wallet.publicKey.toBase58();
                this.currentBet.escrowAccount.player2 = wallet.publicKey.toBase58();
                this.currentBet.escrowAccount.player2Deposited = true;

                this.updateBetStatus('Bet matched! Game starting...', 'success');
            }
    
        } catch (error) {
            console.error('Bet processing error:', error);
            this.updateBetStatus('Failed to process bet: ' + error.message, 'error');
            this.enableBetting();
        }
    }

    async createEscrowTransaction(amount, gameId, isFirstPlayer) {
        try {
            console.log('Creating escrow transaction...');
            
            const wallet = window.solflare.isConnected ? window.solflare : window.solana;
            if (!wallet || !wallet.publicKey) {
                throw new Error('Wallet not connected properly');
            }
    
            console.log('Player wallet:', wallet.publicKey.toString());
    
            const transaction = new solanaWeb3.Transaction();
    
            // Get token accounts
            const playerTokenAccount = await this.findAssociatedTokenAddress(wallet.publicKey);
            const escrowTokenAccount = this.currentBet.escrowAccount.pubkey;

            console.log('Player token account:', playerTokenAccount.toString());
            console.log('Escrow account:', escrowTokenAccount.toString());
    
            // Convert amount to proper decimals
            const tokenAmount = new BN(amount * Math.pow(10, this.config.LAWB_TOKEN.DECIMALS));
            
            // Create transfer instruction to escrow using SPL Token program
            const transferInstruction = solanaWeb3.SystemProgram.transfer({
                fromPubkey: playerTokenAccount,
                toPubkey: escrowTokenAccount,
                lamports: tokenAmount,
            });
    
            // Create account validation instruction
            const accountValidationInstruction = new solanaWeb3.TransactionInstruction({
                keys: [
                    { pubkey: playerTokenAccount, isSigner: false, isWritable: true },
                    { pubkey: wallet.publicKey, isSigner: true, isWritable: false },
                    { pubkey: this.lawbMint, isSigner: false, isWritable: false },
                ],
                programId: this.tokenProgram,
                data: Buffer.from([]),
            });
    
            transaction.add(accountValidationInstruction);
            transaction.add(transferInstruction);
            
            console.log('Escrow transaction created successfully');
            return transaction;
    
        } catch (error) {
            console.error('Escrow transaction creation error:', error);
            throw error;
        }
    }

    async sendTransaction(transaction) {
        try {
            console.log('Preparing to send transaction...');
            const wallet = window.solflare.isConnected ? window.solflare : window.solana;
            
            if (!wallet || !wallet.publicKey) {
                throw new Error('Wallet not connected');
            }
    
            // Get latest blockhash
            const { blockhash } = await this.connection.getLatestBlockhash('confirmed');
            transaction.recentBlockhash = blockhash;
            transaction.feePayer = wallet.publicKey;
    
            console.log('Requesting signature...');
            const signed = await wallet.signTransaction(transaction);
            
            console.log('Sending transaction...');
            const signature = await this.connection.sendRawTransaction(signed.serialize(), {
                skipPreflight: false,
                preflightCommitment: 'confirmed',
                maxRetries: 3
            });
    
            console.log('Transaction sent:', signature);
            return signature;
    
        } catch (error) {
            console.error('Send transaction error:', error);
            throw error;
        }
    }

    async confirmTransaction(signature) {
        try {
            console.log('Starting confirmation check for:', signature);
            
            const latestBlockhash = await this.connection.getLatestBlockhash();
            
            const confirmation = await this.connection.confirmTransaction({
                signature,
                blockhash: latestBlockhash.blockhash,
                lastValidBlockHeight: latestBlockhash.lastValidBlockHeight
            }, 'confirmed');

            console.log('Confirmation received:', confirmation);
            return confirmation;
            
        } catch (error) {
            console.error('Confirmation error:', error);
            throw error;
        }
    }

    async processWinner(winner) {
        if (!this.currentBet.isActive || !this.currentBet.escrowAccount) {
            console.log('No active bet or escrow found');
            return;
        }

        try {
            console.log('Processing winner:', winner);
            const gameState = this.gameStates.get(this.currentBet.gameId);
            if (!gameState) {
                throw new Error('Game state not found');
            }

            // Calculate payouts
            const totalPot = this.currentBet.amount * 2;
            const houseFee = Math.floor(totalPot * this.config.HOUSE_FEE_PERCENTAGE / 100);
            const winnerPayout = totalPot - houseFee;

            // Determine winner's wallet
            const winningPlayer = winner === 'blue' ? 
                this.currentBet.bluePlayer : 
                winner === 'red' ? 
                    this.currentBet.redPlayer : 
                    null;

            if (!winningPlayer) {
                if (winner === 'draw') {
                    await this.processDrawPayout();
                } else {
                    throw new Error('Invalid winner state');
                }
                return;
            }

            // Create and send payout transactions
            this.updateBetStatus('Processing winner payout...', 'processing');
            
            const payoutTransaction = await this.createPayoutTransaction(
                winningPlayer, 
                winnerPayout, 
                houseFee
            );
            
            const signature = await this.sendTransaction(payoutTransaction);
            await this.confirmTransaction(signature);

            // Update game state
            gameState.status = 'completed';
            gameState.winner = winner;
            gameState.payoutAmount = winnerPayout;

            this.updateBetStatus(`Game ended! Winner payout of ${winnerPayout} $LAWB processed`, 'success');
            
            // Update leaderboard if available
            if (typeof updateGameResult === 'function') {
                updateGameResult(winner);
            }

            // Reset bet state
            this.resetBetState();

        } catch (error) {
            console.error('Payout processing error:', error);
            this.updateBetStatus('Failed to process winner payout: ' + error.message, 'error');
        }
    }

    async processDrawPayout() {
        try {
            const amount = this.currentBet.amount;
            
            // Return original bets to both players
            const player1Transaction = await this.createRefundTransaction(
                this.currentBet.bluePlayer,
                amount
            );
            const player2Transaction = await this.createRefundTransaction(
                this.currentBet.redPlayer,
                amount
            );

            // Process refunds
            this.updateBetStatus('Processing draw refunds...', 'processing');
            
            const sig1 = await this.sendTransaction(player1Transaction);
            await this.confirmTransaction(sig1);
            
            const sig2 = await this.sendTransaction(player2Transaction);
            await this.confirmTransaction(sig2);

            // Update game state
            const gameState = this.gameStates.get(this.currentBet.gameId);
            if (gameState) {
                gameState.status = 'completed';
                gameState.winner = 'draw';
                gameState.payoutAmount = amount;
            }

            this.updateBetStatus('Game ended in draw. Bets have been refunded.', 'success');
            
            // Update leaderboard
            if (typeof updateGameResult === 'function') {
                updateGameResult('draw');
            }

            this.resetBetState();

        } catch (error) {
            console.error('Draw payout error:', error);
            this.updateBetStatus('Failed to process draw refunds: ' + error.message, 'error');
        }
    }

    async createPayoutTransaction(winningPlayerAddress, winnerAmount, houseFee) {
        try {
            const winnerPubkey = new solanaWeb3.PublicKey(winningPlayerAddress);
            const housePubkey = new solanaWeb3.PublicKey(this.config.HOUSE_WALLET);
            
            // Get token accounts
            const escrowTokenAccount = this.currentBet.escrowAccount.pubkey;
            const winnerTokenAccount = await this.findAssociatedTokenAddress(winnerPubkey);
            const houseTokenAccount = await this.findAssociatedTokenAddress(housePubkey);
    
            const transaction = new solanaWeb3.Transaction();

            // Winner payout instruction
            const winnerPayoutInstruction = new solanaWeb3.TransactionInstruction({
                programId: this.tokenProgram,
                keys: [
                    { pubkey: escrowTokenAccount, isSigner: false, isWritable: true },
                    { pubkey: winnerTokenAccount, isSigner: false, isWritable: true },
                    { pubkey: housePubkey, isSigner: true, isWritable: false },
                ],
                data: Buffer.from([
                    3,
                    ...new Uint8Array(new window.BN(winnerAmount * Math.pow(10, this.config.LAWB_TOKEN.DECIMALS)).toArray('le', 8))
                ])
            });

            // House fee instruction
            const houseFeeInstruction = new solanaWeb3.TransactionInstruction({
                programId: this.tokenProgram,
                keys: [
                    { pubkey: escrowTokenAccount, isSigner: false, isWritable: true },
                    { pubkey: houseTokenAccount, isSigner: false, isWritable: true },
                    { pubkey: housePubkey, isSigner: true, isWritable: false },
                ],
                data: Buffer.from([
                    3,
                    ...new Uint8Array(new window.BN(houseFee * Math.pow(10, this.config.LAWB_TOKEN.DECIMALS)).toArray('le', 8))
                ])
            });

            transaction.add(winnerPayoutInstruction);
            transaction.add(houseFeeInstruction);
    
            return transaction;
    
        } catch (error) {
            console.error('Error creating payout transaction:', error);
            throw error;
        }
    }

    async createRefundTransaction(playerAddress, amount) {
        try {
            const playerPubkey = new solanaWeb3.PublicKey(playerAddress);
            const playerTokenAccount = await this.findAssociatedTokenAddress(playerPubkey);
            const escrowTokenAccount = this.currentBet.escrowAccount.pubkey;
            
            const transaction = new solanaWeb3.Transaction();
            
            const refundInstruction = new solanaWeb3.TransactionInstruction({
                programId: this.tokenProgram,
                keys: [
                    { pubkey: escrowTokenAccount, isSigner: false, isWritable: true },
                    { pubkey: playerTokenAccount, isSigner: false, isWritable: true },
                    { pubkey: playerPubkey, isSigner: true, isWritable: false },
                ],
                data: Buffer.from([
                    3,
                    ...new Uint8Array(new window.BN(amount * Math.pow(10, this.config.LAWB_TOKEN.DECIMALS)).toArray('le', 8))
                ])
            });

            transaction.add(refundInstruction);
            return transaction;

        } catch (error) {
            console.error('Error creating refund transaction:', error);
            throw error;
        }
    }

    async setupMultiplayerBetting() {
        const createGameBtn = document.querySelector('.multiplayer-btn[id="create-game"]');
        if (createGameBtn) {
            createGameBtn.addEventListener('click', async () => {
                if (!this.currentBet.isActive) {
                    this.updateBetStatus('Please place a bet first', 'error');
                    return;
                }
                try {
                    // Generate game code
                    const gameCode = this.currentBet.gameId;
                    
                    // Store bet information
                    const gameData = {
                        gameCode,
                        bet: this.currentBet.amount,
                        player1: this.currentBet.bluePlayer,
                        escrowAccount: this.currentBet.escrowAccount.pubkey.toString(),
                        timeCreated: Date.now()
                    };
                    
                    // Store game data
                    localStorage.setItem(`game_${gameCode}`, JSON.stringify(gameData));
                    this.updateBetStatus(`Share this code with opponent: ${gameCode}`, 'success');
                    
                    // Trigger multiplayer game creation
                    if (window.multiplayerManager) {
                        window.multiplayerManager.createGame(gameCode);
                    }
                } catch (error) {
                    console.error('Game creation error:', error);
                    this.updateBetStatus('Failed to create game: ' + error.message, 'error');
                }
            });
        }
    
        // Handle JOIN GAME button
        const joinGameBtn = document.querySelector('.multiplayer-btn[id="join-game"]');
        if (joinGameBtn) {
            joinGameBtn.addEventListener('click', async () => {
                const gameCodeInput = document.getElementById('game-code-input');
                const gameCode = gameCodeInput?.value;
                
                if (!gameCode) {
                    this.updateBetStatus('Please enter a game code', 'error');
                    return;
                }

                try {
                    // Get stored game data
                    const gameDataStr = localStorage.getItem(`game_${gameCode}`);
                    if (!gameDataStr) {
                        this.updateBetStatus('Invalid game code', 'error');
                        return;
                    }

                    const gameData = JSON.parse(gameDataStr);
                    
                    // Recreate escrow account reference
                    this.currentBet.escrowAccount = {
                        pubkey: new solanaWeb3.PublicKey(gameData.escrowAccount),
                        gameId: gameCode,
                        amount: gameData.bet,
                        player1: gameData.player1,
                        player1Deposited: true
                    };
                    
                    // Place matching bet
                    await this.processBet(gameData.bet, gameCode, false);
                    
                    // Join multiplayer game
                    if (window.multiplayerManager) {
                        window.multiplayerManager.joinGame(gameCode);
                    }
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