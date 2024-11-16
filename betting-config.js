// betting-config.js
const BETTING_CONFIG = {
    // Network configuration
    NETWORK: 'https://solana-mainnet.rpc.extrnode.com/218119a6-454e-430e-b63c-f1ae113c7eed',
    CONNECTION_CONFIG: {
        commitment: 'confirmed',
        confirmTransactionInitialTimeout: 60000
    },

    // Wallet and contract addresses
    HOUSE_WALLET: '3NCvL5itgJVrwNZw8BNL8syP8Za5hAmhmApCDh4bdsTu',
    
    // LAWB Token configuration
    LAWB_TOKEN: {
        MINT: '65GVcFcSqQcaMNeBkYcen4ozeT83tr13CeDLU4sUUdV6',
        DECIMALS: 9,
        PROGRAM_ID: 'TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA'
    },

    // Betting parameters
    HOUSE_FEE_PERCENTAGE: 5,
    MIN_BET: 100,
    MAX_BET: 5000000,
    
    // Game timeouts (in seconds)
    MATCH_TIMEOUT: 30 * 60,
    BET_CONFIRMATION_TIMEOUT: 2 * 60,
    
    // Escrow configuration
    ESCROW_SEED: 'chess_escrow'
};

window.BETTING_CONFIG = BETTING_CONFIG;