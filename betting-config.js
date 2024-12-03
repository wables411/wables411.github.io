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
            // Fix: Don't multiply by Math.pow(10, this.DECIMALS)
            // Just return the UI amount directly as BigInt
            return BigInt(uiAmount);
        },
        convertToUi: function(nativeAmount) {
            // Fix: Don't divide by Math.pow(10, this.DECIMALS)
            // Just return the native amount as a Number
            return Number(nativeAmount);
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

    TOKEN_INSTRUCTIONS: {
        TRANSFER: 3,
        CLOSE_ACCOUNT: 9
    },

    getInstructionData(type, amount) {
        const data = Buffer.alloc(9);
        data.writeUInt8(type, 0);
        data.writeBigUInt64LE(BigInt(amount.toString()), 1);
        return data;
    },

    createTransferInstruction(source, destination, owner, amount) {
        return new solanaWeb3.TransactionInstruction({
            keys: [
                { pubkey: source, isSigner: false, isWritable: true },
                { pubkey: destination, isSigner: false, isWritable: true },
                { pubkey: owner, isSigner: true, isWritable: false }
            ],
            programId: window.SplToken.TOKEN_PROGRAM_ID,
            data: Buffer.from([3, ...new solanaWeb3.BN(amount.toString()).toArray('le', 8)])
        });
    },

    createTokenTransferInstruction(source, destination, authority, amount) {
        return new solanaWeb3.TransactionInstruction({
            programId: window.SplToken.TOKEN_PROGRAM_ID,
            keys: [
                { pubkey: source, isSigner: false, isWritable: true },
                { pubkey: destination, isSigner: false, isWritable: true },
                { pubkey: authority, isSigner: true, isWritable: false }
            ],
            data: Buffer.from([
                this.TOKEN_INSTRUCTIONS.TRANSFER,
                ...new solanaWeb3.BN(amount.toString()).toArray('le', 8)
            ])
        });
    },

    async findEscrowPDAWithBump(gameId) {
        try {
            const [pda, bump] = await solanaWeb3.PublicKey.findProgramAddress(
                [Buffer.from(gameId)],
                window.SplToken.TOKEN_PROGRAM_ID
            );
            return { pda, bump };
        } catch (error) {
            console.error('Error finding escrow PDA with bump:', error);
            throw error;
        }
    },

    async findAssociatedTokenAddress(walletAddress, tokenMintAddress) {
        try {
            const [address] = await solanaWeb3.PublicKey.findProgramAddress(
                [
                    walletAddress.toBuffer(),
                    window.SplToken.TOKEN_PROGRAM_ID.toBuffer(),
                    tokenMintAddress.toBuffer()
                ],
                window.SplToken.ASSOCIATED_TOKEN_PROGRAM_ID
            );
            return address;
        } catch (error) {
            console.error('Error finding associated token address:', error);
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