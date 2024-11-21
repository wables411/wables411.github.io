window.BETTING_CONFIG = {
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
    
    // System accounts and program IDs
    HOUSE_WALLET: new solanaWeb3.PublicKey('3NCvL5itgJVrwNZw8BNL8syP8Za5hAmhmApCDh4bdsTu'),
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

            const [address] = await solanaWeb3.PublicKey.findProgramAddress(
                [
                    walletAddress.toBuffer(),
                    this.TOKEN_PROGRAM_ID.toBuffer(),
                    tokenMintAddress.toBuffer()
                ],
                this.ASSOCIATED_TOKEN_PROGRAM_ID
            );

            return address;
        } catch (error) {
            console.error('Error finding associated token address:', error);
            throw error;
        }
    },

    async findEscrowPDA(gameId) {
        try {
            const seeds = [Buffer.from(gameId)];
            const [pda] = await solanaWeb3.PublicKey.findProgramAddress(
                seeds,
                this.TOKEN_PROGRAM_ID
            );
            return pda;
        } catch (error) {
            console.error('Error finding escrow PDA:', error);
            throw error;
        }
    },

    createTransferInstruction(source, destination, authority, amount) {
        try {
            return new solanaWeb3.TransactionInstruction({
                keys: [
                    { pubkey: source, isSigner: false, isWritable: true },
                    { pubkey: destination, isSigner: false, isWritable: true },
                    { pubkey: authority, isSigner: true, isWritable: false },
                    { pubkey: this.TOKEN_PROGRAM_ID, isSigner: false, isWritable: false }
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

    createAssociatedTokenAccountInstruction(
        payer,
        associatedToken,
        owner,
        mint
    ) {
        return splToken.createAssociatedTokenAccountInstruction(
            payer,
            associatedToken,
            owner,
            mint,
            this.TOKEN_PROGRAM_ID,
            this.ASSOCIATED_TOKEN_PROGRAM_ID
        );
    }
};