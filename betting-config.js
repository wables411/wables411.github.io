const BETTING_CONFIG = {
    // Network configuration from SOLANA_CONFIG
    NETWORK: window.SOLANA_CONFIG.ENDPOINTS[window.SOLANA_CONFIG.CLUSTER],
    CONNECTION_CONFIG: window.SOLANA_CONFIG.CONNECTION_CONFIG,

    // LAWB Token configuration
    LAWB_TOKEN: {
        MINT: new solanaWeb3.PublicKey('65GVcFcSqQcaMNeBkYcen4ozeT83tr13CeDLU4sUUdV6'),
        DECIMALS: 9,
        PROGRAM_ID: new solanaWeb3.PublicKey('TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA')
    },

    // Betting parameters
    HOUSE_FEE_PERCENTAGE: 5,
    MIN_BET: 100,
    MAX_BET: 5000000,
    
    // Escrow configuration
    HOUSE_WALLET: new solanaWeb3.PublicKey('3NCvL5itgJVrwNZw8BNL8syP8Za5hAmhmApCDh4bdsTu'),

    // Program IDs
    ASSOCIATED_TOKEN_PROGRAM_ID: new solanaWeb3.PublicKey('ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL'),
    TOKEN_PROGRAM_ID: new solanaWeb3.PublicKey('TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA'),
    SYSTEM_PROGRAM_ID: solanaWeb3.SystemProgram.programId,

    // Helper methods using Web3.js
    async findAssociatedTokenAddress(walletAddress, tokenMintAddress) {
        return solanaWeb3.PublicKey.findProgramAddressSync(
            [
                walletAddress.toBuffer(),
                this.TOKEN_PROGRAM_ID.toBuffer(),
                tokenMintAddress.toBuffer(),
            ],
            this.ASSOCIATED_TOKEN_PROGRAM_ID
        )[0];
    },

    createAssociatedTokenAccountInstruction(
        payer,
        associatedToken,
        owner,
        mint
    ) {
        const keys = [
            { pubkey: payer, isSigner: true, isWritable: true },
            { pubkey: associatedToken, isSigner: false, isWritable: true },
            { pubkey: owner, isSigner: false, isWritable: false },
            { pubkey: mint, isSigner: false, isWritable: false },
            { pubkey: solanaWeb3.SystemProgram.programId, isSigner: false, isWritable: false },
            { pubkey: this.TOKEN_PROGRAM_ID, isSigner: false, isWritable: false },
        ];

        return new solanaWeb3.TransactionInstruction({
            keys,
            programId: this.ASSOCIATED_TOKEN_PROGRAM_ID,
            data: Buffer.from([])
        });
    },

    createTransferInstruction(source, destination, owner, amount) {
        const keys = [
            { pubkey: source, isSigner: false, isWritable: true },
            { pubkey: destination, isSigner: false, isWritable: true },
            { pubkey: owner, isSigner: true, isWritable: false }
        ];

        const data = Buffer.from([
            0x02, // Transfer instruction
            ...new BN(amount).toArray('le', 8)
        ]);

        return new solanaWeb3.TransactionInstruction({
            keys,
            programId: this.TOKEN_PROGRAM_ID,
            data
        });
    }
};

window.BETTING_CONFIG = BETTING_CONFIG;