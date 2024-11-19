const BETTING_CONFIG = {
    // Network configuration from SOLANA_CONFIG
    NETWORK: window.SOLANA_CONFIG.ENDPOINTS[window.SOLANA_CONFIG.CLUSTER],
    CONNECTION_CONFIG: window.SOLANA_CONFIG.CONNECTION_CONFIG,

    // LAWB Token configuration
    LAWB_TOKEN: {
        MINT: '65GVcFcSqQcaMNeBkYcen4ozeT83tr13CeDLU4sUUdV6',
        DECIMALS: 9,
        PROGRAM_ID: 'TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA'
    },

    // Betting parameters
    HOUSE_FEE_PERCENTAGE: 5,
    MIN_BET: 100,
    MAX_BET: 100000,
    
    // Escrow configuration
    HOUSE_WALLET: '3NCvL5itgJVrwNZw8BNL8syP8Za5hAmhmApCDh4bdsTu',
    ESCROW: {
        SEED: 'lawb_chess_escrow_v1',
        AUTHORITY_SEED: 'lawb_chess_authority_v1',
        FEE_SEED: 'lawb_chess_fee_v1',
        // Program that will control escrow accounts
        PROGRAM_ID: new solanaWeb3.PublicKey('11111111111111111111111111111111'), // System Program as temporary authority
        // Base58 encoded seed for PDAs
        SEED_PREFIX: 'lawb-chess-v1',
        // Game state seeds
        GAME_SEED: 'game',
        BET_SEED: 'bet',
        ESCROW_SEED: 'escrow'
    },

    // Program IDs
    ASSOCIATED_TOKEN_PROGRAM_ID: 'ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL',
    SYSTEM_PROGRAM_ID: '11111111111111111111111111111111',

    // Helper methods
    async getConnection() {
        return window.SOLANA_CONFIG.createConnection();
    },

    async findEscrowPDA(gameId) {
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
    },

    async findGamePDA(gameId) {
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
    },

    async findBetPDA(gameId) {
        const seeds = [
            Buffer.from(this.ESCROW.SEED_PREFIX),
            Buffer.from(this.ESCROW.BET_SEED),
            Buffer.from(gameId)
        ];
        
        const [pda] = await solanaWeb3.PublicKey.findProgramAddress(
            seeds,
            this.ESCROW.PROGRAM_ID
        );
        return pda;
    },

    async findEscrowAuthority(gameId) {
        const seeds = [
            Buffer.from(this.ESCROW.SEED_PREFIX),
            Buffer.from(this.ESCROW.AUTHORITY_SEED),
            Buffer.from(gameId)
        ];
        
        const [authority] = await solanaWeb3.PublicKey.findProgramAddress(
            seeds,
            this.ESCROW.PROGRAM_ID
        );
        return authority;
    },

    async validateConnection() {
        try {
            const connection = await this.getConnection();
            const version = await connection.getVersion();
            console.log('Solana connection validated:', version);
            return true;
        } catch (error) {
            console.error('Failed to validate Solana connection:', error);
            return false;
        }
    }
};

window.BETTING_CONFIG = BETTING_CONFIG;