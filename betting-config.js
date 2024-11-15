// LAWB Token Betting Configuration
const BETTING_CONFIG = {
    // Network - using public Solana RPC
    NETWORK: 'https://solana-api.projectserum.com',  // Changed to Serum's public endpoint
    
    // Token details
    LAWB_TOKEN_ADDRESS: '65GVcFcSqQcaMNeBkYcen4ozeT83tr13CeDLU4sUUdV6',
    
    // House wallet
    HOUSE_WALLET: '3NCvL5itgJVrwNZw8BNL8syP8Za5hAmhmApCDh4bdsTu',
    
    // Fee settings
    HOUSE_FEE_PERCENTAGE: 5,
    
    // Bet limits (in LAWB)
    MIN_BET: 100,
    MAX_BET: 5000000,
    
    // Time limits
    MATCH_TIMEOUT: 30 * 60,
    BET_CONFIRMATION_TIMEOUT: 2 * 60
};

// Make config available globally
window.BETTING_CONFIG = BETTING_CONFIG;