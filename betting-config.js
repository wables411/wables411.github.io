window.BETTING_CONFIG = {
    // Token config with proper PublicKey initialization
    LAWB_TOKEN: {
        MINT: new solanaWeb3.PublicKey('65GVcFcSqQcaMNeBkYcen4ozeT83tr13CeDLU4sUUdV6'),
        DECIMALS: 9,
        PROGRAM_ID: new solanaWeb3.PublicKey('TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA')
    },

    // Parameters
    HOUSE_FEE_PERCENTAGE: 5,
    MIN_BET: 100,
    MAX_BET: 5000000,
    
    // Escrow and wallet
    HOUSE_WALLET: new solanaWeb3.PublicKey('3NCvL5itgJVrwNZw8BNL8syP8Za5hAmhmApCDh4bdsTu'),
    
    // Program IDs
    TOKEN_PROGRAM_ID: new solanaWeb3.PublicKey('TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA'),
    ASSOCIATED_TOKEN_PROGRAM_ID: new solanaWeb3.PublicKey('ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL'),
    SYSTEM_PROGRAM_ID: solanaWeb3.SystemProgram.programId,

    // Helper methods
    async findAssociatedTokenAddress(walletAddress, tokenMintAddress) {
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
    },

    async findEscrowPDA(gameId) {
        return (await solanaWeb3.PublicKey.findProgramAddress(
            [Buffer.from(gameId)],
            this.TOKEN_PROGRAM_ID
        ))[0];
    },

    createTransferInstruction(source, destination, owner, amount) {
        return window.SplToken.createTransferInstruction(
            source,              // source
            destination,         // destination
            owner,              // owner
            amount,             // amount
            [],                 // multiSigners
            this.TOKEN_PROGRAM_ID // programId
        );
    }
};

window.BETTING_CONFIG = BETTING_CONFIG;