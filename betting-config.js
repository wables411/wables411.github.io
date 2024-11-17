// betting-config.js
const BETTING_CONFIG = {
    // Network configuration
    NETWORK: 'https://solana-mainnet.rpc.extrnode.com',
    CONNECTION_CONFIG: {
        commitment: 'confirmed',
        confirmTransactionInitialTimeout: 60000
    },

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
    HOUSE_WALLET: '3NCvL5itgJVrwNZw8BNL8syP8Za5hAmhmApCDh4bdsTu', // Your house wallet address
    ESCROW_SEED: 'chess_escrow'
};

window.BETTING_CONFIG = BETTING_CONFIG;