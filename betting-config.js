window.BETTING_CONFIG = {
    // Token config
    LAWB_TOKEN: {
        MINT: new solanaWeb3.PublicKey('65GVcFcSqQcaMNeBkYcen4ozeT83tr13CeDLU4sUUdV6'),
        DECIMALS: 9
    },

    // Parameters
    HOUSE_FEE_PERCENTAGE: 5,
    MIN_BET: 100,
    MAX_BET: 5000000,
    
    // System accounts
    HOUSE_WALLET: new solanaWeb3.PublicKey('3NCvL5itgJVrwNZw8BNL8syP8Za5hAmhmApCDh4bdsTu'),
    
    // Program IDs
    TOKEN_PROGRAM_ID: window.SplToken.TOKEN_PROGRAM_ID,
    ASSOCIATED_TOKEN_PROGRAM_ID: window.SplToken.ASSOCIATED_TOKEN_PROGRAM_ID,
    SYSTEM_PROGRAM_ID: solanaWeb3.SystemProgram.programId,

    // Helper methods
    async findAssociatedTokenAddress(walletAddress, tokenMintAddress) {
        try {
            // Convert string addresses to PublicKeys if needed
            if (typeof walletAddress === 'string') {
                walletAddress = new solanaWeb3.PublicKey(walletAddress);
            }
            if (typeof tokenMintAddress === 'string') {
                tokenMintAddress = new solanaWeb3.PublicKey(tokenMintAddress);
            }

            // Use SPL Token helper
            return window.SplToken.getAssociatedTokenAddress(
                tokenMintAddress,
                walletAddress,
                false
            );
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
            return window.SplToken.createTransferInstruction(
                source,
                destination,
                owner,
                amount,
                [],
                this.TOKEN_PROGRAM_ID
            );
        } catch (error) {
            console.error('Error creating transfer instruction:', error);
            throw error;
        }
    }
};