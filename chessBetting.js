// Chess betting integration
const BN = window.buffer.BN;
class ChessBetting {
    constructor() {
        this.config = BETTING_CONFIG;
        this.initializeBetting();
        this.setupMultiplayerBetting();
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
            isActive: false
        };
        
        this.setupBettingUI();
    }

    setupBettingUI() {
        // Create betting container
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

        // Insert betting UI before the chessboard
        const chessGame = document.getElementById('chess-game');
        chessGame.parentNode.insertBefore(bettingContainer, chessGame);

        // Add event listeners
        this.addBettingEventListeners();
    }

    addBettingEventListeners() {
        const betAmountInput = document.getElementById('betAmount');
        const placeBetButton = document.getElementById('placeBet');
        const feeAmountSpan = document.getElementById('feeAmount');

        betAmountInput.addEventListener('input', (e) => {
            const amount = Number(e.target.value);
            const fee = (amount * this.config.HOUSE_FEE_PERCENTAGE / 100).toFixed(2);
            feeAmountSpan.textContent = fee;
        });

        placeBetButton.addEventListener('click', () => this.handleBetPlacement());
    }

    async handleBetPlacement() {
        try {
            // Check wallet connection
            const wallet = window.solflare.isConnected ? window.solflare : window.solana;
            if (!wallet || !wallet.publicKey) {
                this.updateBetStatus('Please connect your wallet first', 'error');
                return;
            }
    
            const amount = Number(document.getElementById('betAmount').value);
            if (amount < this.config.MIN_BET || amount > this.config.MAX_BET) {
                this.updateBetStatus(`Bet must be between ${this.config.MIN_BET} and ${this.config.MAX_BET} $LAWB`, 'error');
                return;
            }
    
            this.updateBetStatus('Processing bet...', 'processing');
            await this.processBet(amount);
    
        } catch (error) {
            console.error('Bet placement error:', error);
            this.updateBetStatus('Failed to place bet: ' + error.message, 'error');
        }
    }

    async processBet(amount) {
        try {
            if (!this.validateBetAmount(amount)) return;
            
            const wallet = window.solflare.isConnected ? window.solflare : window.solana;
            if (!wallet || !wallet.publicKey) {
                throw new Error('Wallet not connected');
            }
    
            this.updateBetStatus('Creating transaction...', 'processing');
    
            const transaction = await this.createBetTransaction(amount);
            const signature = await this.sendTransaction(transaction);
    
            this.updateBetStatus('Confirming transaction...', 'processing');
            
            const confirmation = await this.confirmTransaction(signature);
            
            if (confirmation?.value?.err) {
                throw new Error('Transaction failed: ' + confirmation.value.err);
            }
    
            this.currentBet = {
                amount: amount,
                bluePlayer: wallet.publicKey.toBase58(),
                redPlayer: null,
                gameId: this.generateGameId(),
                isActive: true
            };
    
            console.log('Bet state updated:', this.currentBet);
            this.updateBetStatus('Bet placed successfully! Waiting for opponent...', 'success');
            this.disableBetting();
    
        } catch (error) {
            console.error('Bet processing error:', error);
            this.updateBetStatus('Failed to process bet: ' + error.message, 'error');
            this.enableBetting();
        }
    }
    async findAssociatedTokenAddress(walletAddress) {
        const [associatedToken] = await solanaWeb3.PublicKey.findProgramAddress(
            [
                walletAddress.toBuffer(),
                this.tokenProgram.toBuffer(),
                this.lawbMint.toBuffer(),
            ],
            new solanaWeb3.PublicKey('ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL')
        );
        return associatedToken;
    }

    async createBetTransaction(amount) {
        try {
            console.log('Starting transaction creation...');
            
            const wallet = window.solflare.isConnected ? window.solflare : window.solana;
            if (!wallet || !wallet.publicKey) {
                throw new Error('Wallet not connected properly');
            }

            // Get token accounts
            const playerTokenAccount = await this.findAssociatedTokenAddress(wallet.publicKey);
            const houseTokenAccount = await this.findAssociatedTokenAddress(
                new solanaWeb3.PublicKey(this.config.HOUSE_WALLET)
            );

            // Convert amount to proper decimals
            const tokenAmount = amount * Math.pow(10, this.config.LAWB_TOKEN.DECIMALS);

            // Create transfer instruction for LAWB tokens
            const transferInstruction = new solanaWeb3.TransactionInstruction({
                keys: [
                    { pubkey: playerTokenAccount, isSigner: false, isWritable: true },
                    { pubkey: houseTokenAccount, isSigner: false, isWritable: true },
                    { pubkey: wallet.publicKey, isSigner: true, isWritable: false },
                ],
                programId: this.tokenProgram,
                data: Buffer.from([3, ...new BN(tokenAmount).toArray('le', 8)])
            });

            // Create transaction
            const transaction = new solanaWeb3.Transaction().add(transferInstruction);
            
            console.log('Transaction created successfully');
            return transaction;

        } catch (error) {
            console.error('Transaction creation error:', error);
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

            // Get recent blockhash with retry logic
            let blockhash;
            for (let attempt = 0; attempt < this.config.TRANSACTION_RETRY.MAX_ATTEMPTS; attempt++) {
                try {
                    const { blockhash: recentBlockhash } = await this.connection.getLatestBlockhash('confirmed');
                    blockhash = recentBlockhash;
                    break;
                } catch (error) {
                    if (attempt === this.config.TRANSACTION_RETRY.MAX_ATTEMPTS - 1) throw error;
                    await new Promise(resolve => setTimeout(resolve, this.config.TRANSACTION_RETRY.BACKOFF_INTERVAL));
                }
            }
            
            transaction.recentBlockhash = blockhash;
            transaction.feePayer = wallet.publicKey;

            console.log('Requesting signature...');
            const signed = await wallet.signTransaction(transaction);
            
            console.log('Sending transaction...');
            const signature = await this.connection.sendRawTransaction(signed.serialize(), {
                skipPreflight: false,
                preflightCommitment: 'confirmed'
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
            
            const commitment = 'confirmed';
            const latestBlockhash = await this.connection.getLatestBlockhash();
            
            const confirmationStrategy = {
                signature,
                blockhash: latestBlockhash.blockhash,
                lastValidBlockHeight: latestBlockhash.lastValidBlockHeight,
            };

            const confirmation = await this.connection.confirmTransaction(
                confirmationStrategy,
                commitment
            );

            console.log('Confirmation received:', confirmation);
            return confirmation;
        } catch (error) {
            console.error('Confirmation error:', error);
            throw error;
        }
    }

    updateBetStatus(message, type = 'info') {
        const statusElement = document.getElementById('betStatus');
        statusElement.textContent = message;
        statusElement.className = `bet-status ${type}`;
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
        return 'game_' + Math.random().toString(36).substr(2, 9);
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

    async processWinner(winner) {
        if (!this.currentBet.isActive) return;

        try {
            const winningPlayer = winner === 'blue' ? this.currentBet.bluePlayer : this.currentBet.redPlayer;
            
            // Calculate payout (original bet minus house fee)
            const totalPot = this.currentBet.amount * 2;
            const houseFee = Math.floor(totalPot * this.config.HOUSE_FEE_PERCENTAGE / 100);
            const winnerPayout = totalPot - houseFee;

            // Create payout transaction
            const transaction = await this.createPayoutTransaction(winningPlayer, winnerPayout);
            const signature = await this.sendTransaction(transaction);
            await this.confirmTransaction(signature);

            this.updateBetStatus(`Game ended! Winner payout of ${winnerPayout} $LAWB processed`, 'success');
            this.resetBetState();

        } catch (error) {
            console.error('Payout processing error:', error);
            this.updateBetStatus('Failed to process winner payout: ' + error.message, 'error');
        }
    }

    async createPayoutTransaction(winningPlayerAddress, amount) {
        try {
            // Convert winner address to PublicKey
            const winnerPubkey = new solanaWeb3.PublicKey(winningPlayerAddress);
            
            // Get token accounts
            const houseTokenAccount = await this.findAssociatedTokenAddress(
                new solanaWeb3.PublicKey(this.config.HOUSE_WALLET)
            );
            const winnerTokenAccount = await this.findAssociatedTokenAddress(winnerPubkey);

            // Convert amount to proper decimals
            const tokenAmount = amount * Math.pow(10, this.config.LAWB_TOKEN.DECIMALS);

            // Create transfer instruction for LAWB tokens
            const transferInstruction = new solanaWeb3.TransactionInstruction({
                keys: [
                    { pubkey: houseTokenAccount, isSigner: false, isWritable: true },
                    { pubkey: winnerTokenAccount, isSigner: false, isWritable: true },
                    { pubkey: new solanaWeb3.PublicKey(this.config.HOUSE_WALLET), isSigner: true, isWritable: false },
                ],
                programId: this.tokenProgram,
                data: Buffer.from([3, ...new BN(tokenAmount).toArray('le', 8)])
            });

            return new solanaWeb3.Transaction().add(transferInstruction);

        } catch (error) {
            console.error('Error creating payout transaction:', error);
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
                    const gameCode = this.generateGameId();
                    
                    // Store bet information with game code
                    const gameData = {
                        gameCode,
                        bet: this.currentBet.amount,
                        player1: this.currentBet.bluePlayer,
                        timeCreated: Date.now()
                    };
                    // Store in database or local storage
                    localStorage.setItem(`game_${gameCode}`, JSON.stringify(gameData));
                    // Update UI to show game code
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
                // Get stored game data
                const gameData = localStorage.getItem(`game_${gameCode}`);
                if (!gameData) {
                    this.updateBetStatus('Invalid game code', 'error');
                    return;
                }
                const { bet } = JSON.parse(gameData);
                
                // Place matching bet
                await this.processBet(bet);
                
                // Join multiplayer game
                if (window.multiplayerManager) {
                    window.multiplayerManager.joinGame(gameCode);
                }
            });
        }
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