const BETTING_CONFIG = {
    // Network configuration from SOLANA_CONFIG
    NETWORK: window.SOLANA_CONFIG.ENDPOINTS[window.SOLANA_CONFIG.CLUSTER],
    CONNECTION_CONFIG: window.SOLANA_CONFIG.CONNECTION_CONFIG,

    // LAWB Token configuration
    LAWB_TOKEN: {
        MINT: new solanaWeb3.PublicKey('65GVcFcSqQcaMNeBkYcen4ozeT83tr13CeDLU4sUUdV6'),
        DECIMALS: 9,
        PROGRAM_ID: splToken.TOKEN_PROGRAM_ID
    },

    // Betting parameters
    HOUSE_FEE_PERCENTAGE: 5,
    MIN_BET: 100,
    MAX_BET: 5000000,
    
    // Escrow configuration
    HOUSE_WALLET: new solanaWeb3.PublicKey('3NCvL5itgJVrwNZw8BNL8syP8Za5hAmhmApCDh4bdsTu'),
    ESCROW: {
        SEED: 'lawb_chess_escrow_v1',
        AUTHORITY_SEED: 'lawb_chess_authority_v1',
        FEE_SEED: 'lawb_chess_fee_v1',
        PROGRAM_ID: splToken.TOKEN_PROGRAM_ID,
        SEED_PREFIX: 'lawb-chess-v1',
        GAME_SEED: 'game',
        BET_SEED: 'bet',
        ESCROW_SEED: 'escrow'
    },

    // Program IDs (using SPL Token constants)
    ASSOCIATED_TOKEN_PROGRAM_ID: splToken.ASSOCIATED_TOKEN_PROGRAM_ID,
    TOKEN_PROGRAM_ID: splToken.TOKEN_PROGRAM_ID,
    SYSTEM_PROGRAM_ID: solanaWeb3.SystemProgram.programId,

    async findEscrowPDA(gameId) {
        try {
            const seeds = [
                Buffer.from(this.ESCROW.SEED_PREFIX),
                Buffer.from(this.ESCROW.ESCROW_SEED),
                Buffer.from(gameId)
            ];
            
            const [pda] = await solanaWeb3.PublicKey.findProgramAddress(
                seeds,
                this.ESCROW.PROGRAM_ID
            );
            return pda;
        } catch (error) {
            console.error('Error finding escrow PDA:', error);
            throw error;
        }
    },

    async findGamePDA(gameId) {
        try {
            const seeds = [
                Buffer.from(this.ESCROW.SEED_PREFIX),
                Buffer.from(this.ESCROW.GAME_SEED),
                Buffer.from(gameId)
            ];
            
            const [pda] = await solanaWeb3.PublicKey.findProgramAddress(
                seeds,
                this.ESCROW.PROGRAM_ID
            );
            return pda;
        } catch (error) {
            console.error('Error finding game PDA:', error);
            throw error;
        }
    }
};

window.BETTING_CONFIG = BETTING_CONFIG;