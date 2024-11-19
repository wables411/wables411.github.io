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
    ESCROW_SEED: 'chess_escrow',

    // Program IDs
    ASSOCIATED_TOKEN_PROGRAM_ID: 'ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL',
    SYSTEM_PROGRAM_ID: '11111111111111111111111111111111',

    // Helper methods
    async getConnection() {
        return window.SOLANA_CONFIG.createConnection();
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