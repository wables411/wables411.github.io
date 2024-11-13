// Chess betting integration
class ChessBetting {
    constructor() {
        this.config = BETTING_CONFIG;
        this.initializeBetting();
    }

    async initializeBetting() {
        // Initialize Solana web3 connection
        this.connection = new solanaWeb3.Connection(this.config.NETWORK);
        
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
            if (!window.solana?.isConnected) {
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

    updateBetStatus(message, type = 'info') {
        const statusElement = document.getElementById('betStatus');
        statusElement.textContent = message;
        statusElement.className = `bet-status ${type}`;
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

    // New betting methods
    async processBet(amount) {
        try {
            if (!this.validateBetAmount(amount)) return;
            
            const wallet = window.solana;
            if (!wallet) throw new Error('Wallet not connected');

            this.updateBetStatus('Creating transaction...', 'processing');

            const transaction = await this.createBetTransaction(amount);
            const signature = await this.sendTransaction(transaction);

            this.updateBetStatus('Confirming transaction...', 'processing');
            await this.confirmTransaction(signature);

            this.currentBet = {
                amount: amount,
                bluePlayer: wallet.publicKey.toString(),
                redPlayer: null,
                gameId: this.generateGameId(),
                isActive: true
            };

            this.updateBetStatus('Bet placed successfully! Waiting for opponent...', 'success');
            this.disableBetting();

        } catch (error) {
            console.error('Bet processing error:', error);
            this.updateBetStatus('Failed to process bet: ' + error.message, 'error');
        }
    }

    async createBetTransaction(amount) {
        const { Token, TOKEN_PROGRAM_ID } = solanaWeb3;
        
        // Get token account
        const tokenMint = new solanaWeb3.PublicKey(this.config.LAWB_TOKEN_ADDRESS);
        const houseWallet = new solanaWeb3.PublicKey(this.config.HOUSE_WALLET);
        
        const playerTokenAccount = await Token.getAssociatedTokenAddress(
            tokenMint,
            window.solana.publicKey
        );

        const houseTokenAccount = await Token.getAssociatedTokenAddress(
            tokenMint,
            houseWallet
        );

        // Calculate amounts
        const betAmount = amount * 1e9; // Convert to lamports (LAWB has 9 decimals)
        const feeAmount = Math.floor(betAmount * this.config.HOUSE_FEE_PERCENTAGE / 100);
        const escrowAmount = betAmount - feeAmount;

        // Create transaction
        const transaction = new solanaWeb3.Transaction();
        
        // Transfer bet amount to house wallet
        transaction.add(
            Token.createTransferInstruction(
                TOKEN_PROGRAM_ID,
                playerTokenAccount,
                houseTokenAccount,
                window.solana.publicKey,
                [],
                betAmount
            )
        );

        return transaction;
    }

    async sendTransaction(transaction) {
        const connection = new solanaWeb3.Connection(this.config.NETWORK);
        
        // Get recent blockhash
        const { blockhash } = await connection.getRecentBlockhash();
        transaction.recentBlockhash = blockhash;
        transaction.feePayer = window.solana.publicKey;

        // Sign and send transaction
        const signed = await window.solana.signTransaction(transaction);
        const signature = await connection.sendRawTransaction(signed.serialize());
        
        return signature;
    }

    async confirmTransaction(signature) {
        const connection = new solanaWeb3.Connection(this.config.NETWORK);
        
        const confirmation = await connection.confirmTransaction(signature);
        if (confirmation.value.err) {
            throw new Error('Transaction failed to confirm');
        }
        
        return confirmation;
    }

    async processWinner(winner) {
        if (!this.currentBet.isActive) return;

        try {
            const winningPlayer = winner === 'blue' ? this.currentBet.bluePlayer : this.currentBet.redPlayer;
            
            // Calculate payout (original bet minus house fee)
            const totalPot = this.currentBet.amount * 2;
            const houseFee = Math.floor(totalPot * this.config.HOUSE_FEE_PERCENTAGE / 100);
            const winnerPayout = totalPot - houseFee;

            // Create and send payout transaction
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
}

// Initialize styles
ChessBetting.addStyles();

// Export for use
window.ChessBetting = ChessBetting;