// betting-config.js
const BETTING_CONFIG = {
    // Use Solana config for network
    NETWORK: SOLANA_CONFIG.ENDPOINTS[SOLANA_CONFIG.CLUSTER],
    CONNECTION_CONFIG: SOLANA_CONFIG.CONNECTION_CONFIG,

    // LAWB Token configuration
    LAWB_TOKEN: {
        MINT: '65GVcFcSqQcaMNeBkYcen4ozeT83tr13CeDLU4sUUdV6',
        DECIMALS: 9,
        PROGRAM_ID: SOLANA_CONFIG.PROGRAM_IDS.TOKEN
    },

    // Betting parameters
    HOUSE_FEE_PERCENTAGE: 5,
    MIN_BET: 100,
    MAX_BET: 100000,
    
    // Escrow configuration
    HOUSE_WALLET: '3NCvL5itgJVrwNZw8BNL8syP8Za5hAmhmApCDh4bdsTu',
    ESCROW_SEED: 'chess_escrow',

    // Use Solana program IDs
    ASSOCIATED_TOKEN_PROGRAM_ID: SOLANA_CONFIG.PROGRAM_IDS.ASSOCIATED_TOKEN,
    SYSTEM_PROGRAM_ID: SOLANA_CONFIG.PROGRAM_IDS.SYSTEM,

    // Helper methods
    async getConnection() {
        return SOLANA_CONFIG.createConnection();
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