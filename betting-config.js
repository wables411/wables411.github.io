// LAWB Token Betting Configuration
const BETTING_CONFIG = {
    // Network
    NETWORK: 'https://api.mainnet-beta.solana.com',
    
    // Token details
    LAWB_TOKEN_ADDRESS: '65GVcFcSqQcaMNeBkYcen4ozeT83tr13CeDLU4sUUdV6',
    
    // House wallet
    HOUSE_WALLET: '3NCvL5itgJVrwNZw8BNL8syP8Za5hAmhmApCDh4bdsTu',
    
    // Fee settings
    HOUSE_FEE_PERCENTAGE: 5,
    
    // Bet limits (in LAWB)
    MIN_BET: 100,
    MAX_BET: 5000000, // Increased from 100000 to 5000000
    
    // Time limits
    MATCH_TIMEOUT: 45 * 60, // 30 minutes in seconds
    BET_CONFIRMATION_TIMEOUT: 2 * 60 // 2 minutes in seconds
};

// Make config available globally
window.BETTING_CONFIG = BETTING_CONFIG;