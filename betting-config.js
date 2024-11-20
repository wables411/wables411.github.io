const BETTING_CONFIG = {
    // Network config (same as before)
    NETWORK: window.SOLANA_CONFIG.ENDPOINTS[window.SOLANA_CONFIG.CLUSTER],
    CONNECTION_CONFIG: window.SOLANA_CONFIG.CONNECTION_CONFIG,

    // Token config with proper PublicKey initialization
    LAWB_TOKEN: {
        MINT: new solanaWeb3.PublicKey('65GVcFcSqQcaMNeBkYcen4ozeT83tr13CeDLU4sUUdV6'),
        DECIMALS: 9,
        PROGRAM_ID: new solanaWeb3.PublicKey('TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA')
    },

    // Parameters (same)
    HOUSE_FEE_PERCENTAGE: 5,
    MIN_BET: 100,
    MAX_BET: 5000000,
    
    // Escrow and wallet with proper PublicKey
    HOUSE_WALLET: new solanaWeb3.PublicKey('3NCvL5itgJVrwNZw8BNL8syP8Za5hAmhmApCDh4bdsTu'),
    
    // Program IDs with proper PublicKey initialization
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
    }
};

window.BETTING_CONFIG = BETTING_CONFIG;