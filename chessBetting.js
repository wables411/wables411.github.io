class ChessBetting {
    constructor() {
        this.config = window.BETTING_CONFIG;
        this.solanaConfig = window.SOLANA_CONFIG;
        this.supabase = window.gameDatabase;
        this.connection = null;
        
        this.currentBet = {
            amount: 0,
            bluePlayer: null,
            redPlayer: null,
            gameId: null,
            isActive: false,
            escrowAccount: null,
            matched: false
        };

        this.init();
        this.initializeUI();
    }

    async init() {
        try {
            console.log('Initializing betting system...');
            this.connection = await this.solanaConfig.createConnection();
            
            // Initialize token program details
            this.lawbMint = new solanaWeb3.PublicKey(this.config.LAWB_TOKEN.MINT);
            this.tokenProgram = new solanaWeb3.PublicKey(this.config.LAWB_TOKEN.PROGRAM_ID);
            
            // Verify setup
            await this.verifySetup();
            console.log('Betting system initialized successfully');
            return true;
        } catch (error) {
            console.error('Failed to initialize betting system:', error);
            this.updateBetStatus('Failed to initialize betting system', 'error');
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

    initializeUI() {
        // Set up bet amount input handler
        const betAmountInput = document.getElementById('betAmount');
        if (betAmountInput) {
            betAmountInput.addEventListener('input', () => this.updateBetCalculations());
        }

        // Set up create game with bet button
        const createGameWithBetBtn = document.getElementById('create-game-with-bet');
        if (createGameWithBetBtn) {
            createGameWithBetBtn.addEventListener('click', () => this.handleCreateGameWithBet());
        }

        // Initialize join game button handler
        const joinGameBtn = document.getElementById('join-game');
        if (joinGameBtn) {
            joinGameBtn.addEventListener('click', () => this.handleJoinGame());
        }
    }

    updateBetCalculations() {
        const betAmount = Number(document.getElementById('betAmount')?.value || 0);
        const fee = (betAmount * this.config.HOUSE_FEE_PERCENTAGE / 100);
        const totalPot = betAmount * 2;
        const potentialWin = totalPot - (totalPot * this.config.HOUSE_FEE_PERCENTAGE / 100);
        
        const feeAmountSpan = document.getElementById('feeAmount');
        const potentialWinSpan = document.getElementById('potentialWin');
        
        if (feeAmountSpan) feeAmountSpan.textContent = fee.toFixed(2);
        if (potentialWinSpan) potentialWinSpan.textContent = potentialWin.toFixed(2);
    }

    async handleCreateGameWithBet() {
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
            
            // Create escrow account
            const gameId = Math.random().toString(36).substring(2, 8).toUpperCase();
            const escrowAccount = await this.createEscrowAccount(gameId);
            
            // Create bet transaction
            const betTx = await this.createBetTransaction(
                wallet.publicKey,
                amount,
                escrowAccount
            );

            // Sign and send transaction
            const signature = await this.sendAndConfirmTransaction(betTx);
            console.log('Bet transaction confirmed:', signature);

            // Create game record
            const gameData = await this.createGameRecord(gameId, wallet.publicKey.toString(), amount, escrowAccount);

            this.currentBet = {
                amount,
                bluePlayer: wallet.publicKey.toString(),
                gameId: gameId,
                isActive: true,
                escrowAccount,
                matched: false
            };

            this.updateBetStatus(`Game created! Share code: ${gameId}`, 'success');
            this.disableBetting();

        } catch (error) {
            console.error('Error creating game with bet:', error);
            this.updateBetStatus('Failed to create game: ' + error.message, 'error');
            this.resetBetState();
        }
    }

    async handleJoinGame() {
        const gameCode = document.getElementById('game-code-input')?.value?.trim();
        if (!gameCode) {
            this.updateBetStatus('Please enter a game code', 'error');
            return;
        }

        try {
            const wallet = this.getConnectedWallet();
            if (!wallet || !wallet.publicKey) {
                this.updateBetStatus('Please connect your wallet first', 'error');
                return;
            }

            // Get game details
            const { data: game } = await this.supabase
                .from('chess_games')
                .select('*')
                .eq('game_id', gameCode)
                .single();

            if (!game) {
                this.updateBetStatus('Game not found', 'error');
                return;
            }

            if (game.bet_amount > 0) {
                // Handle joining a game with a bet
                const betTx = await this.createMatchingBetTransaction(
                    wallet.publicKey,
                    game.bet_amount,
                    game.escrow_account
                );

                const signature = await this.sendAndConfirmTransaction(betTx);
                console.log('Matching bet transaction confirmed:', signature);
            }

            // Update game record
            await this.updateGameRecord(gameCode, wallet.publicKey.toString());
            this.updateBetStatus('Successfully joined game!', 'success');

        } catch (error) {
            console.error('Error joining game:', error);
            this.updateBetStatus('Failed to join game: ' + error.message, 'error');
        }
    }

    async createEscrowAccount(gameId) {
        try {
            const escrowPDA = await this.config.findEscrowPDA(gameId);
            const escrowATA = await this.findAssociatedTokenAccount(escrowPDA);
            
            console.log('Created escrow account:', {
                pubkey: escrowPDA.toString(),
                tokenAccount: escrowATA.toString()
            });
    
            return {
                pubkey: escrowPDA,
                tokenAccount: escrowATA,
                seed: Buffer.from(gameId)
            };
        } catch (error) {
            console.error('Error creating escrow account:', error);
            throw error;
        }
    }

    async findAssociatedTokenAccount(walletAddress) {
        try {
            if (!walletAddress || typeof walletAddress === 'string') {
                walletAddress = new solanaWeb3.PublicKey(walletAddress);
            }

            const [associatedToken] = await solanaWeb3.PublicKey.findProgramAddress(
                [
                    walletAddress.toBuffer(),
                    this.tokenProgram.toBuffer(),
                    this.lawbMint.toBuffer(),
                ],
                new solanaWeb3.PublicKey(this.config.ASSOCIATED_TOKEN_PROGRAM_ID)
            );
            
            return associatedToken;
        } catch (error) {
            console.error('Error finding associated token account:', error);
            throw error;
        }
    }

    async createBetTransaction(playerPublicKey, amount, escrowData) {
        try {
            const transaction = new solanaWeb3.Transaction();
            
            // Get player's token account
            const playerATA = await this.findAssociatedTokenAccount(playerPublicKey);
            const escrowATA = escrowData.tokenAccount;
            
            // Check balance
            const balance = await this.connection.getTokenAccountBalance(playerATA);
            const requiredAmount = amount * Math.pow(10, this.config.LAWB_TOKEN.DECIMALS);
            
            if (Number(balance.value.amount) < requiredAmount) {
                throw new Error(`Insufficient $LAWB balance`);
            }
    
            // Create escrow ATA if needed
            const escrowAccountInfo = await this.connection.getAccountInfo(escrowATA);
            if (!escrowAccountInfo) {
                transaction.add(this.createATAInstruction(
                    playerPublicKey,
                    escrowATA,
                    escrowData.pubkey
                ));
            }
    
            // Add transfer instruction
            transaction.add(this.createTransferInstruction(
                playerATA,
                escrowATA,
                playerPublicKey,
                amount
            ));
    
            return transaction;
        } catch (error) {
            console.error('Error creating bet transaction:', error);
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
                { pubkey: authority, isSigner: true, isWritable: false }
            ],
            data: Buffer.from([
                0x02, // Transfer instruction
                ...tokenAmount.toArray('le', 8)
            ])
        });
    }

    async sendAndConfirmTransaction(transaction) {
        try {
            const wallet = this.getConnectedWallet();
            if (!wallet) throw new Error('No wallet connected');

            const { blockhash, lastValidBlockHeight } = 
                await this.connection.getLatestBlockhash('finalized');
            
            transaction.recentBlockhash = blockhash;
            transaction.feePayer = wallet.publicKey;

            const signed = await wallet.signTransaction(transaction);
            const signature = await this.connection.sendRawTransaction(
                signed.serialize(),
                { skipPreflight: false, preflightCommitment: 'finalized' }
            );

            await this.connection.confirmTransaction({
                signature,
                blockhash,
                lastValidBlockHeight
            });

            return signature;
        } catch (error) {
            console.error('Transaction error:', error);
            throw error;
        }
    }

    async createGameRecord(gameId, playerAddress, betAmount, escrowAccount) {
        try {
            const { data, error } = await this.supabase
                .from('chess_games')
                .insert([{
                    game_id: gameId,
                    blue_player: playerAddress,
                    bet_amount: betAmount,
                    escrow_account: escrowAccount.pubkey.toString(),
                    game_state: 'waiting'
                }])
                .select()
                .single();

            if (error) throw error;
            return data;
        } catch (error) {
            console.error('Error creating game record:', error);
            throw error;
        }
    }

    async updateGameRecord(gameId, redPlayer) {
        try {
            const { data, error } = await this.supabase
                .from('chess_games')
                .update({
                    red_player: redPlayer,
                    game_state: 'active'
                })
                .eq('game_id', gameId)
                .select()
                .single();

            if (error) throw error;
            return data;
        } catch (error) {
            console.error('Error updating game record:', error);
            throw error;
        }
    }

    async processWinner(winner) {
        if (!this.currentBet.isActive) return;

        try {
            const winnerAddress = winner === 'draw' ? null :
                winner === 'blue' ? this.currentBet.bluePlayer : this.currentBet.redPlayer;

            if (winner === 'draw') {
                await this.processDraw();
            } else {
                await this.processWinnerPayout(winnerAddress);
            }

            this.resetBetState();
        } catch (error) {
            console.error('Error processing winner:', error);
            this.updateBetStatus('Error processing payout: ' + error.message, 'error');
        }
    }

    async processDraw() {
        // Return funds minus 2.5% fee to each player
        const feePercentage = this.config.HOUSE_FEE_PERCENTAGE / 2; // 2.5% each
        const refundAmount = this.currentBet.amount * (1 - feePercentage / 100);

        const tx = await this.createDrawPayoutTransaction(
            this.currentBet.bluePlayer,
            this.currentBet.redPlayer,
            refundAmount
        );

        await this.sendAndConfirmTransaction(tx);
    }

    async processWinnerPayout(winnerAddress) {
        const tx = await this.createWinnerPayoutTransaction(
            winnerAddress,
            this.currentBet.amount * 2
        );

        await this.sendAndConfirmTransaction(tx);
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

    updateBetStatus(message, type = 'info') {
        const statusElement = document.getElementById('betStatus');
        if (statusElement) {
            statusElement.textContent = message;
            statusElement.className = `bet-status ${type}`;
        }
        console.log(`Bet status: ${message}`);
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
            escrowAccount: null,
            matched: false
        };
        this.enableBetting();
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

    async createWinnerPayoutTransaction(winnerAddress, totalAmount) {
        try {
            const transaction = new solanaWeb3.Transaction();
            const winnerPubkey = new solanaWeb3.PublicKey(winnerAddress);
            const housePubkey = new solanaWeb3.PublicKey(this.config.HOUSE_WALLET);
            
            // Calculate amounts
            const houseFee = Math.floor(totalAmount * (this.config.HOUSE_FEE_PERCENTAGE / 100));
            const winnerAmount = totalAmount - houseFee;
            
            // Get token accounts
            const escrowATA = this.currentBet.escrowAccount.tokenAccount;
            const winnerATA = await this.findAssociatedTokenAccount(winnerPubkey);
            const houseATA = await this.findAssociatedTokenAccount(housePubkey);
            
            // Create winner payout instruction
            transaction.add(this.createTransferInstruction(
                escrowATA,
                winnerATA,
                this.currentBet.escrowAccount.pubkey,
                winnerAmount
            ));
            
            // Create house fee instruction
            transaction.add(this.createTransferInstruction(
                escrowATA,
                houseATA,
                this.currentBet.escrowAccount.pubkey,
                houseFee
            ));
            
            return transaction;
        } catch (error) {
            console.error('Error creating winner payout transaction:', error);
            throw error;
        }
    }

    async createDrawPayoutTransaction(player1Address, player2Address, refundAmount) {
        try {
            const transaction = new solanaWeb3.Transaction();
            const player1Pubkey = new solanaWeb3.PublicKey(player1Address);
            const player2Pubkey = new solanaWeb3.PublicKey(player2Address);
            const housePubkey = new solanaWeb3.PublicKey(this.config.HOUSE_WALLET);
            
            // Calculate house fee (5% total, split between players)
            const houseFee = Math.floor(this.currentBet.amount * this.config.HOUSE_FEE_PERCENTAGE / 100);
            
            // Get token accounts
            const escrowATA = this.currentBet.escrowAccount.tokenAccount;
            const player1ATA = await this.findAssociatedTokenAccount(player1Pubkey);
            const player2ATA = await this.findAssociatedTokenAccount(player2Pubkey);
            const houseATA = await this.findAssociatedTokenAccount(housePubkey);
            
            // Add refund instructions
            transaction.add(this.createTransferInstruction(
                escrowATA,
                player1ATA,
                this.currentBet.escrowAccount.pubkey,
                refundAmount
            ));
            
            transaction.add(this.createTransferInstruction(
                escrowATA,
                player2ATA,
                this.currentBet.escrowAccount.pubkey,
                refundAmount
            ));
            
            // Add house fee instruction
            transaction.add(this.createTransferInstruction(
                escrowATA,
                houseATA,
                this.currentBet.escrowAccount.pubkey,
                houseFee * 2 // Total house fee from both players
            ));
            
            return transaction;
        } catch (error) {
            console.error('Error creating draw payout transaction:', error);
            throw error;
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
                margin: 5px;
                width: 100%;
            }

            .bet-button:hover:not(:disabled) {
                transform: translateY(-2px);
                box-shadow: 0 0 15px rgba(255, 0, 0, 0.3);
            }

            .bet-button:disabled {
                opacity: 0.5;
                cursor: not-allowed;
            }

            .multiplayer-options {
                display: flex;
                flex-direction: column;
                gap: 10px;
                margin: 15px 0;
            }

            .bet-status {
                margin-top: 10px;
                padding: 10px;
                border-radius: 4px;
                text-align: center;
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