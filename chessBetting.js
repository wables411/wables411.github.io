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
            matched: false
        };

        this.transactionOptions = {
            skipPreflight: false,
            preflightCommitment: 'confirmed',
            commitment: 'confirmed',
            maxRetries: 3
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
            this.initializeBalanceChecking();
            
            return true;
        } catch (error) {
            console.error('Failed to initialize betting system:', error);
            this.updateBetStatus('Failed to initialize betting system', 'error');
            return false;
        }
    }

    async initializeBalanceChecking() {
        try {
            const wallet = this.getConnectedWallet();
            if (wallet?.publicKey) {
                const playerATA = await this.config.findAssociatedTokenAddress(
                    wallet.publicKey,
                    this.lawbMint
                );
                
                // Subscribe to balance changes
                this.connection.onAccountChange(
                    playerATA,
                    (accountInfo) => {
                        this.handleBalanceUpdate(accountInfo);
                    },
                    'confirmed'
                );
            }
        } catch (error) {
            console.error('Failed to initialize balance checking:', error);
        }
    }

    async handleBalanceUpdate(accountInfo) {
        try {
            const wallet = this.getConnectedWallet();
            if (!wallet?.publicKey) return;

            const balance = accountInfo.lamports / Math.pow(10, this.config.LAWB_TOKEN.DECIMALS);
            const betInput = document.getElementById('betAmount');
            const createGameBtn = document.getElementById('create-game-with-bet');

            if (betInput && createGameBtn) {
                const currentBet = Number(betInput.value);
                createGameBtn.disabled = balance < currentBet;
            }
        } catch (error) {
            console.error('Error handling balance update:', error);
        }
    }

    async sendAndConfirmTransaction(transaction) {
        try {
            const wallet = this.getConnectedWallet();
            if (!wallet) throw new Error('No wallet connected');

            const { blockhash, lastValidBlockHeight } = 
                await this.connection.getLatestBlockhash('confirmed');
            
            transaction.recentBlockhash = blockhash;
            transaction.feePayer = wallet.publicKey;

            const signed = await wallet.signTransaction(transaction);
            const signature = await this.connection.sendRawTransaction(
                signed.serialize(),
                this.transactionOptions
            );

            const confirmation = await this.connection.confirmTransaction({
                signature,
                blockhash,
                lastValidBlockHeight
            });

            if (confirmation.value.err) {
                throw new Error('Transaction failed to confirm');
            }

            return signature;
        } catch (error) {
            console.error('Transaction failed:', error);
            throw error;
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

        const createGameNoBtn = document.getElementById('create-game-no-bet');
        if (createGameNoBtn) {
            createGameNoBtn.addEventListener('click', () => this.handleCreateGameNoBet());
        }

        const joinGameBtn = document.getElementById('join-game');
        if (joinGameBtn) {
            joinGameBtn.addEventListener('click', () => this.handleJoinGame());
        }

        // Set up game code display functionality
        const gameCodeDisplay = document.getElementById('gameCode');
        if (gameCodeDisplay) {
            gameCodeDisplay.addEventListener('click', () => {
                if (gameCodeDisplay.textContent) {
                    navigator.clipboard.writeText(gameCodeDisplay.textContent)
                        .then(() => this.showCopyNotification())
                        .catch(error => console.error('Failed to copy:', error));
                }
            });
        }
    }

    showCopyNotification() {
        const notification = document.getElementById('copyNotification');
        if (notification) {
            notification.style.display = 'block';
            setTimeout(() => {
                notification.style.display = 'none';
            }, 2000);
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

        // Update the bet button state based on valid amount
        const createBetBtn = document.getElementById('create-game-with-bet');
        if (createBetBtn) {
            createBetBtn.disabled = !this.validateBetAmount(betAmount, false);
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
            if (!this.validateBetAmount(amount)) {
                return;
            }

            this.updateBetStatus('Processing bet...', 'processing');
            
            // Generate game ID and create escrow
            const gameId = Math.random().toString(36).substring(2, 8).toUpperCase();
            const playerPubKey = new solanaWeb3.PublicKey(wallet.publicKey);

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

            // Create escrow PDA and associated token account
            const escrowPDA = await this.config.findEscrowPDA(gameId);
            const escrowATA = await this.config.findAssociatedTokenAddress(
                escrowPDA,
                this.lawbMint
            );

            // Create transaction
            const transaction = new solanaWeb3.Transaction();
            
            // Add transfer instruction
            transaction.add(
                this.config.createTransferInstruction(
                    playerATA,
                    escrowATA,
                    playerPubKey,
                    requiredAmount
                )
            );

            // Execute transaction
            await this.sendAndConfirmTransaction(transaction);

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

            // Get game details
            const { data: game } = await this.supabase
                .from('chess_games')
                .select('*')
                .eq('game_id', gameCode.toUpperCase())
                .single();

            if (!game) {
                this.updateBetStatus('Game not found', 'error');
                return;
            }

            if (game.game_state !== 'waiting') {
                this.updateBetStatus('Game is no longer available', 'error');
                return;
            }

            if (game.blue_player === wallet.publicKey.toString()) {
                this.updateBetStatus('Cannot join your own game', 'error');
                return;
            }

            if (game.bet_amount > 0) {
                const playerPubKey = new solanaWeb3.PublicKey(wallet.publicKey);
                
                // Get player's token account
                const playerATA = await this.config.findAssociatedTokenAddress(
                    playerPubKey,
                    this.lawbMint
                );

                // Check balance
                const balance = await this.connection.getTokenAccountBalance(playerATA);
                const requiredAmount = game.bet_amount * Math.pow(10, this.config.LAWB_TOKEN.DECIMALS);
                
                if (Number(balance.value.amount) < requiredAmount) {
                    throw new Error(`Insufficient $LAWB balance`);
                }

                // Get escrow accounts
                const escrowPDA = new solanaWeb3.PublicKey(game.escrow_account);
                const escrowATA = await this.config.findAssociatedTokenAddress(
                    escrowPDA,
                    this.lawbMint
                );

                // Create matching bet transaction
                const transaction = new solanaWeb3.Transaction();
                transaction.add(
                    this.config.createTransferInstruction(
                        playerATA,
                        escrowATA,
                        playerPubKey,
                        requiredAmount
                    )
                );

                // Execute transaction
                await this.sendAndConfirmTransaction(transaction);
            }

            // Update game record
            await this.updateGameRecord(gameCode.toUpperCase(), wallet.publicKey.toString());
            
            this.currentBet = {
                amount: game.bet_amount,
                bluePlayer: game.blue_player,
                redPlayer: wallet.publicKey.toString(),
                gameId: game.game_id,
                isActive: true,
                escrowAccount: game.escrow_account ? new solanaWeb3.PublicKey(game.escrow_account) : null,
                matched: true
            };

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

    async handleCreateGameNoBet() {
        try {
            const wallet = this.getConnectedWallet();
            if (!wallet || !wallet.publicKey) {
                this.updateBetStatus('Please connect your wallet first', 'error');
                return;
            }

            this.updateBetStatus('Creating game...', 'processing');

            const gameId = Math.random().toString(36).substring(2, 8).toUpperCase();
            await this.createGameRecord(gameId, wallet.publicKey.toString(), 0, null);

            // Show game code
            const gameCodeDisplay = document.getElementById('gameCodeDisplay');
            const gameCode = document.getElementById('gameCode');
            if (gameCodeDisplay && gameCode) {
                gameCode.textContent = gameId;
                gameCodeDisplay.style.display = 'block';
            }

            this.updateBetStatus(`Game created! Click code to copy`, 'success');

        } catch (error) {
            console.error('Error creating game:', error);
            this.updateBetStatus('Failed to create game: ' + error.message, 'error');
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
                    game_state: 'waiting',
                    current_player: 'blue',
                    board: {
                        positions: JSON.parse(JSON.stringify(window.initialBoard)),
                        pieceState: {
                            blueKingMoved: false,
                            redKingMoved: false,
                            blueRooksMove: { left: false, right: false },
                            redRooksMove: { left: false, right: false },
                            lastPawnDoubleMove: null
                        }
                    }
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
        if (!this.currentBet.isActive || !this.currentBet.amount) return;

        try {
            this.updateBetStatus('Processing payout...', 'processing');

            if (winner === 'draw') {
                await this.processDraw();
            } else {
                const winnerAddress = winner === 'blue' ? 
                    this.currentBet.bluePlayer : this.currentBet.redPlayer;
                await this.processWinnerPayout(winnerAddress);
            }

            this.updateBetStatus('Payout complete!', 'success');
            this.resetBetState();
        } catch (error) {
            console.error('Error processing winner:', error);
            this.updateBetStatus('Error processing payout: ' + error.message, 'error');
        }
    }

    async processDraw() {
        if (!this.currentBet.escrowAccount) {
            throw new Error('No escrow account found for this game');
        }

        const playerAmount = this.currentBet.amount;
        const feePercentage = this.config.HOUSE_FEE_PERCENTAGE / 2; // Split fee between players
        const refundAmount = Math.floor(playerAmount * (1 - feePercentage / 100)) * Math.pow(10, this.config.LAWB_TOKEN.DECIMALS);
        const houseFee = Math.floor(playerAmount * feePercentage / 100) * Math.pow(10, this.config.LAWB_TOKEN.DECIMALS);

        const transaction = new solanaWeb3.Transaction();
        
        // Get escrow token account
        const escrowATA = await this.config.findAssociatedTokenAddress(
            this.currentBet.escrowAccount,
            this.lawbMint
        );

        // Get player token accounts
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
        if (!this.currentBet.escrowAccount) {
            throw new Error('No escrow account found for this game');
        }

        const totalAmount = this.currentBet.amount * 2;
        const houseFee = Math.floor(totalAmount * this.config.HOUSE_FEE_PERCENTAGE / 100);
        const winnerAmount = Math.floor(totalAmount - houseFee) * Math.pow(10, this.config.LAWB_TOKEN.DECIMALS);
        const houseFeeAmount = Math.floor(houseFee) * Math.pow(10, this.config.LAWB_TOKEN.DECIMALS);

        const transaction = new solanaWeb3.Transaction();
        
        // Get token accounts
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

        // Add winner payout instruction
        transaction.add(
            this.config.createTransferInstruction(
                escrowATA,
                winnerATA,
                this.currentBet.escrowAccount,
                winnerAmount
            )
        );

        // Add house fee instruction
        transaction.add(
            this.config.createTransferInstruction(
                escrowATA,
                houseATA,
                this.currentBet.escrowAccount,
                houseFeeAmount
            )
        );

        await this.sendAndConfirmTransaction(transaction);
    }

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