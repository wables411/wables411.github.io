// First define the Supabase check
window.SUPABASE_CHECK = {
    async testConnection() {
        try {
            const { data, error } = await window.gameDatabase
                .from('chess_games')
                .select('id')
                .limit(1);

            if (error) {
                console.error('Supabase connection test failed:', error);
                return false;
            }

            console.log('Supabase connection test successful:', data);
            return true;
        } catch (err) {
            console.error('Supabase test error:', err);
            return false;
        }
    }
};

// Then define the betting config
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

            return window.SplToken.getAssociatedTokenAddress(
                mint,
                wallet,
                false,
                this.TOKEN_PROGRAM_ID,
                this.ASSOCIATED_TOKEN_PROGRAM_ID
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