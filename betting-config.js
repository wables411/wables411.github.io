const BETTING_CONFIG = {
    // Network config
    NETWORK: window.SOLANA_CONFIG.ENDPOINTS[window.SOLANA_CONFIG.CLUSTER],
    CONNECTION_CONFIG: window.SOLANA_CONFIG.CONNECTION_CONFIG,

    // Token config
    LAWB_TOKEN: {
        MINT: new solanaWeb3.PublicKey('65GVcFcSqQcaMNeBkYcen4ozeT83tr13CeDLU4sUUdV6'),
        DECIMALS: 9,
        SYMBOL: 'LAWB'
    },

    // Betting parameters
    HOUSE_FEE_PERCENTAGE: 5,
    MIN_BET: 100,
    MAX_BET: 5000000,
    
    // System accounts
    HOUSE_WALLET: new solanaWeb3.PublicKey('3NCvL5itgJVrwNZw8BNL8syP8Za5hAmhmApCDh4bdsTu'),
    
    // Program IDs
    TOKEN_PROGRAM_ID: new solanaWeb3.PublicKey('TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA'),
    ASSOCIATED_TOKEN_PROGRAM_ID: new solanaWeb3.PublicKey('ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL'),
    SYSTEM_PROGRAM_ID: solanaWeb3.SystemProgram.programId,

    // Helper methods
    async findAssociatedTokenAddress(walletAddress, tokenMintAddress) {
        try {
            if (typeof walletAddress === 'string') {
                walletAddress = new solanaWeb3.PublicKey(walletAddress);
            }
            if (typeof tokenMintAddress === 'string') {
                tokenMintAddress = new solanaWeb3.PublicKey(tokenMintAddress);
            }
            
            return (await solanaWeb3.PublicKey.findProgramAddress(
                [
                    walletAddress.toBuffer(),
                    this.TOKEN_PROGRAM_ID.toBuffer(),
                    tokenMintAddress.toBuffer()
                ],
                this.ASSOCIATED_TOKEN_PROGRAM_ID
            ))[0];
        } catch (error) {
            console.error('Error finding associated token address:', error);
            throw error;
        }
    },

    async findEscrowPDA(gameId) {
        try {
            return (await solanaWeb3.PublicKey.findProgramAddress(
                [Buffer.from(gameId)],
                this.TOKEN_PROGRAM_ID
            ))[0];
        } catch (error) {
            console.error('Error finding escrow PDA:', error);
            throw error;
        }
    },

    createTransferInstruction(source, destination, owner, amount) {
        try {
            return new solanaWeb3.TransactionInstruction({
                keys: [
                    { pubkey: source, isSigner: false, isWritable: true },
                    { pubkey: destination, isSigner: false, isWritable: true },
                    { pubkey: owner, isSigner: true, isWritable: false }
                ],
                programId: this.TOKEN_PROGRAM_ID,
                data: Buffer.from([
                    3, // Transfer instruction
                    ...new BN(amount).toArray('le', 8)
                ])
            });
        } catch (error) {
            console.error('Error creating transfer instruction:', error);
            throw error;
        }
    },

    calculateBetAmounts(betAmount) {
        const fee = (betAmount * this.HOUSE_FEE_PERCENTAGE) / 100;
        const potentialWin = (betAmount * 2) - ((betAmount * 2) * this.HOUSE_FEE_PERCENTAGE / 100);
        return {
            fee,
            potentialWin,
            totalRequired: betAmount
        };
    },

    async validateBetAmount(connection, walletAddress, amount) {
        try {
            if (!amount || isNaN(amount)) {
                throw new Error('Invalid bet amount');
            }
            
            if (amount < this.MIN_BET || amount > this.MAX_BET) {
                throw new Error(`Bet must be between ${this.MIN_BET} and ${this.MAX_BET} ${this.LAWB_TOKEN.SYMBOL}`);
            }

            const balance = await window.SOLANA_CONFIG.getTokenBalance(
                connection,
                walletAddress,
                this.LAWB_TOKEN.MINT
            );

            if (balance < amount) {
                throw new Error(`Insufficient ${this.LAWB_TOKEN.SYMBOL} balance`);
            }

            return true;
        } catch (error) {
            console.error('Bet validation error:', error);
            throw error;
        }
    }
};

window.BETTING_CONFIG = BETTING_CONFIG;