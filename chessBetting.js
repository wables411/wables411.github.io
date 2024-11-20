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
            
            // Initialize token details
            this.lawbMint = this.config.LAWB_TOKEN.MINT;
            this.tokenProgram = this.config.TOKEN_PROGRAM_ID;
            
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
        const betAmountInput = document.getElementById('betAmount');
        if (betAmountInput) {
            betAmountInput.addEventListener('input', () => this.updateBetCalculations());
        }

        const createGameWithBetBtn = document.getElementById('create-game-with-bet');
        if (createGameWithBetBtn) {
            createGameWithBetBtn.addEventListener('click', () => this.handleCreateGameWithBet());
        }

        const joinGameBtn = document.getElementById('join-game');
        if (joinGameBtn) {
            joinGameBtn.addEventListener('click', () => this.handleJoinGame());
        }

        const createGameNoBtn = document.getElementById('create-game-no-bet');
        if (createGameNoBtn) {
            createGameNoBtn.addEventListener('click', () => this.handleCreateGameNoBet());
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
            
            // Generate game ID
            const gameId = Math.random().toString(36).substring(2, 8).toUpperCase();
            
            // Get player's token account
            const playerPubKey = new solanaWeb3.PublicKey(wallet.publicKey);
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
    
            // Create escrow PDA
            const escrowPDA = await this.createEscrowPDA(gameId);
            
            // Create instruction to create ATA
            const escrowATA = await this.config.findAssociatedTokenAddress(
                escrowPDA,
                this.lawbMint
            );
    
            // Create transaction
            const transaction = new solanaWeb3.Transaction();
    
            // Create escrow token account if needed
            const escrowAccountInfo = await this.connection.getAccountInfo(escrowATA);
            if (!escrowAccountInfo) {
                // Create instruction for ATA creation
                const createAtaIx = new solanaWeb3.TransactionInstruction({
                    keys: [
                        { pubkey: playerPubKey, isSigner: true, isWritable: true },
                        { pubkey: escrowATA, isSigner: false, isWritable: true },
                        { pubkey: escrowPDA, isSigner: false, isWritable: false },
                        { pubkey: this.lawbMint, isSigner: false, isWritable: false },
                        { pubkey: solanaWeb3.SystemProgram.programId, isSigner: false, isWritable: false },
                        { pubkey: this.tokenProgram, isSigner: false, isWritable: false },
                    ],
                    programId: this.config.ASSOCIATED_TOKEN_PROGRAM_ID,
                    data: Buffer.from([])
                });
                transaction.add(createAtaIx);
            }
    
            // Create transfer instruction
            const transferIx = new solanaWeb3.TransactionInstruction({
                keys: [
                    { pubkey: playerATA, isSigner: false, isWritable: true },
                    { pubkey: escrowATA, isSigner: false, isWritable: true },
                    { pubkey: playerPubKey, isSigner: true, isWritable: false },
                    { pubkey: this.tokenProgram, isSigner: false, isWritable: false }
                ],
                programId: this.tokenProgram,
                data: Buffer.from([
                    0x02, // Transfer instruction
                    ...new BN(requiredAmount).toArray('le', 8)
                ])
            });
            transaction.add(transferIx);
    
            // Sign and send transaction
            const signature = await this.sendAndConfirmTransaction(transaction);
            console.log('Bet transaction confirmed:', signature);
    
            // Create game record
            await this.createGameRecord(gameId, wallet.publicKey.toString(), amount, escrowPDA);
    
            this.currentBet = {
                amount,
                bluePlayer: wallet.publicKey.toString(),
                gameId,
                isActive: true,
                escrowAccount: escrowPDA,
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
                const playerATA = await this.config.findAssociatedTokenAddress(
                    wallet.publicKey,
                    this.lawbMint
                );

                // Check balance
                const balance = await this.connection.getTokenAccountBalance(playerATA);
                if (Number(balance.value.amount) < game.bet_amount) {
                    throw new Error('Insufficient $LAWB balance');
                }

                const escrowPDA = new solanaWeb3.PublicKey(game.escrow_account);
                const escrowATA = await this.config.findAssociatedTokenAddress(
                    escrowPDA,
                    this.lawbMint
                );

                const transaction = new solanaWeb3.Transaction();
                transaction.add(
                    this.config.createTransferInstruction(
                        playerATA,
                        escrowATA,
                        wallet.publicKey,
                        game.bet_amount
                    )
                );

                const signature = await this.sendAndConfirmTransaction(transaction);
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

    async handleCreateGameNoBet() {
        try {
            const wallet = this.getConnectedWallet();
            if (!wallet || !wallet.publicKey) {
                this.updateBetStatus('Please connect your wallet first', 'error');
                return;
            }

            const gameId = Math.random().toString(36).substring(2, 8).toUpperCase();
            await this.createGameRecord(gameId, wallet.publicKey.toString(), 0, null);
            this.updateBetStatus(`Game created! Share code: ${gameId}`, 'success');

        } catch (error) {
            console.error('Error creating game:', error);
            this.updateBetStatus('Failed to create game: ' + error.message, 'error');
        }
    }

    async createEscrowPDA(gameId) {
        const [pda] = await solanaWeb3.PublicKey.findProgramAddress(
            [
                Buffer.from('chess_escrow'),
                Buffer.from(gameId)
            ],
            this.tokenProgram
        );
        return pda;
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
                    escrow_account: escrowAccount?.toString(),
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
        const feePercentage = this.config.HOUSE_FEE_PERCENTAGE / 2;
        const refundAmount = this.currentBet.amount * (1 - feePercentage / 100);
        
        const escrowATA = await this.config.findAssociatedTokenAddress(
            this.currentBet.escrowAccount,
            this.lawbMint
        );

        const player1ATA = await this.config.findAssociatedTokenAddress(
            new solanaWeb3.PublicKey(this.currentBet.bluePlayer),
            this.lawbMint
        );

        const player2ATA = await this.config.findAssociatedTokenAddress(
            new solanaWeb3.PublicKey(this.currentBet.redPlayer),
            this.lawbMint
        );

        const houseATA = await this.config.findAssociatedTokenAddress(
            this.config.HOUSE_WALLET,
            this.lawbMint
        );

        const transaction = new solanaWeb3.Transaction();

        // Add refund instructions
        transaction.add(
            this.config.createTransferInstruction(
                escrowATA,
                player1ATA,
                this.currentBet.escrowAccount,
                refundAmount
            )
        );

        transaction.add(
            this.config.createTransferInstruction(
                escrowATA,
                player2ATA,
                this.currentBet.escrowAccount,
                refundAmount
            )
        );

        // Add house fee instruction
        const houseFee = this.currentBet.amount * this.config.HOUSE_FEE_PERCENTAGE / 100;
        transaction.add(
            this.config.createTransferInstruction(
                escrowATA,
                houseATA,
                this.currentBet.escrowAccount,
                houseFee * 2
            )
        );

        await this.sendAndConfirmTransaction(transaction);
    }

    async processWinnerPayout(winnerAddress) {
        const escrowATA = await this.config.findAssociatedTokenAddress(
            this.currentBet.escrowAccount,
            this.lawbMint
        );

        const winnerATA = await this.config.findAssociatedTokenAddress(
            new solanaWeb3.PublicKey(winnerAddress),
            this.lawbMint
        );

        const houseATA = await this.config.findAssociatedTokenAddress(
            this.config.HOUSE_WALLET,
            this.lawbMint
        );

        const transaction = new solanaWeb3.Transaction();

        // Calculate amounts
        const totalAmount = this.currentBet.amount * 2;
        const houseFee = Math.floor(totalAmount * this.config.HOUSE_FEE_PERCENTAGE / 100);
        const winnerAmount = totalAmount - houseFee;

        // Winner payout
        transaction.add(
            this.config.createTransferInstruction(
                escrowATA,
                winnerATA,
                this.currentBet.escrowAccount,
                winnerAmount
            )
        );

        // House fee
        transaction.add(
            this.config.createTransferInstruction(
                escrowATA,
                houseATA,
                this.currentBet.escrowAccount,
                houseFee
            )
        );

        await this.sendAndConfirmTransaction(transaction);
    }

    // Add these methods INSIDE the class
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