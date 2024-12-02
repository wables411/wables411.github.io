window.BETTING_CONFIG = {
    // Token config
    LAWB_TOKEN: {
        MINT: new solanaWeb3.PublicKey('65GVcFcSqQcaMNeBkYcen4ozeT83tr13CeDLU4sUUdV6'),
        DECIMALS: 9,
        convertToNative: function(uiAmount) {
            return BigInt(Math.round(uiAmount * Math.pow(10, this.DECIMALS)));
        },
        convertToUi: function(nativeAmount) {
            return Number(nativeAmount) / Math.pow(10, this.DECIMALS);
        }
    },

    // Game parameters
    HOUSE_FEE_PERCENTAGE: 5,
    MIN_BET: 100,          // In UI amount
    MAX_BET: 5000000,      // In UI amount
    
    // System accounts
    HOUSE_WALLET: new solanaWeb3.PublicKey('3NCvL5itgJVrwNZw8BNL8syP8Za5hAmhmApCDh4bdsTu'),
    
    // Program IDs
    TOKEN_PROGRAM_ID: window.SplToken.TOKEN_PROGRAM_ID,
    ASSOCIATED_TOKEN_PROGRAM_ID: window.SplToken.ASSOCIATED_TOKEN_PROGRAM_ID,
    SYSTEM_PROGRAM_ID: solanaWeb3.SystemProgram.programId,

    // Helper functions
    async findAssociatedTokenAddress(walletAddress, tokenMintAddress) {
        try {
            const wallet = typeof walletAddress === 'string' ? 
                new solanaWeb3.PublicKey(walletAddress) : walletAddress;
            
            const mint = typeof tokenMintAddress === 'string' ? 
                new solanaWeb3.PublicKey(tokenMintAddress) : tokenMintAddress;

            const [address] = await solanaWeb3.PublicKey.findProgramAddress(
                [
                    wallet.toBuffer(),
                    this.TOKEN_PROGRAM_ID.toBuffer(),
                    mint.toBuffer()
                ],
                this.ASSOCIATED_TOKEN_PROGRAM_ID
            );
            return address;
        } catch (error) {
            console.error('Error finding associated token address:', error);
            throw error;
        }
    },

    async findEscrowPDAWithBump(gameId) {
        try {
            const [pda, bump] = await solanaWeb3.PublicKey.findProgramAddress(
                [Buffer.from(gameId)],
                this.TOKEN_PROGRAM_ID
            );
            return { pda, bump };
        } catch (error) {
            console.error('Error finding escrow PDA with bump:', error);
            throw error;
        }
    },

    createTransferInstruction(source, destination, authority, amount) {
        try {
            return new solanaWeb3.TransactionInstruction({
                keys: [
                    { pubkey: source, isSigner: false, isWritable: true },
                    { pubkey: destination, isSigner: false, isWritable: true },
                    { pubkey: authority, isSigner: true, isWritable: false }
                ],
                programId: this.TOKEN_PROGRAM_ID,
                data: Buffer.from([3, ...new solanaWeb3.BN(amount.toString()).toArray('le', 8)])
            });
        } catch (error) {
            console.error('Error creating transfer instruction:', error);
            throw error;
        }
    },

    createAssociatedTokenAccountInstruction(payer, associatedToken, owner, mint) {
        return new solanaWeb3.TransactionInstruction({
            keys: [
                { pubkey: payer, isSigner: true, isWritable: true },
                { pubkey: associatedToken, isSigner: false, isWritable: true },
                { pubkey: owner, isSigner: false, isWritable: false },
                { pubkey: mint, isSigner: false, isWritable: false },
                { pubkey: this.SYSTEM_PROGRAM_ID, isSigner: false, isWritable: false },
                { pubkey: this.TOKEN_PROGRAM_ID, isSigner: false, isWritable: false },
                { pubkey: solanaWeb3.SYSVAR_RENT_PUBKEY, isSigner: false, isWritable: false }
            ],
            programId: this.ASSOCIATED_TOKEN_PROGRAM_ID,
            data: Buffer.from([])
        });
    },

    validateBetAmount(amount) {
        console.log('Validating bet amount:', {
            input: amount,
            nativeAmount: this.LAWB_TOKEN.convertToNative(amount).toString(),
            min: this.MIN_BET,
            max: this.MAX_BET
        });
        
        if (!amount || isNaN(amount)) return false;
        if (amount < this.MIN_BET) return false;
        if (amount > this.MAX_BET) return false;
        return true;
    }
};