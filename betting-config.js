window.SUPABASE_CHECK = {
    async testConnection() {
        try {
            const { data, error } = await window.gameDatabase
                .from('chess_games')
                .select('count(*)')
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

window.BETTING_CONFIG = {
    // Token config
    LAWB_TOKEN: {
        MINT: new solanaWeb3.PublicKey('65GVcFcSqQcaMNeBkYcen4ozeT83tr13CeDLU4sUUdV6'),
        DECIMALS: 9,
        convertToNative: function(uiAmount) {
            return Math.round(uiAmount * Math.pow(10, this.DECIMALS));
        },
        convertToUi: function(nativeAmount) {
            return nativeAmount / Math.pow(10, this.DECIMALS);
        }
    },

    // Game parameters
    HOUSE_FEE_PERCENTAGE: 5,
    MIN_BET: 100,
    MAX_BET: 5000000,
    
    // System accounts
    HOUSE_WALLET: new solanaWeb3.PublicKey('3NCvL5itgJVrwNZw8BNL8syP8Za5hAmhmApCDh4bdsTu'),
    
    // Program IDs
    TOKEN_PROGRAM_ID: window.SplToken.TOKEN_PROGRAM_ID,
    ASSOCIATED_TOKEN_PROGRAM_ID: window.SplToken.ASSOCIATED_TOKEN_PROGRAM_ID,
    SYSTEM_PROGRAM_ID: solanaWeb3.SystemProgram.programId,

    // Database schemas
    SCHEMAS: {
        CHESS_GAMES: {
            tableName: 'chess_games',
            columns: {
                id: 'uuid',
                game_id: 'text',
                blue_player: 'text',
                red_player: 'text',
                board: 'jsonb',
                current_player: 'text',
                game_state: 'text',
                piece_state: 'jsonb',
                last_move: 'jsonb',
                winner: 'text',
                bet_amount: 'numeric',
                escrow_account: 'text',
                created_at: 'timestamp',
                updated_at: 'timestamp'
            }
        },
        CHESS_BETS: {
            tableName: 'chess_bets',
            columns: {
                id: 'uuid',
                game_id: 'text',
                bet_amount: 'numeric',
                blue_player: 'text',
                red_player: 'text',
                status: 'text',
                winner: 'text',
                escrow_account: 'text',
                created_at: 'timestamp',
                processed_at: 'timestamp'
            }
        }
    },

    // Database validation helpers
    validateGameRecord: function(record) {
        const schema = this.SCHEMAS.CHESS_GAMES.columns;
        return Object.entries(record).every(([key, value]) => {
            return schema[key] && 
                   (value === null || 
                    typeof value === (schema[key] === 'jsonb' ? 'object' : schema[key]));
        });
    },

    validateBetRecord: function(record) {
        const schema = this.SCHEMAS.CHESS_BETS.columns;
        return Object.entries(record).every(([key, value]) => {
            return schema[key] && 
                   (value === null || 
                    typeof value === (schema[key] === 'numeric' ? 'number' : schema[key]));
        });
    },

    // Account helper functions
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
    }
};