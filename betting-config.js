// Immediately create and expose the config to the window
window.BETTING_CONFIG = {
    // Using your Extrnode RPC
    NETWORK: 'https://solana-mainnet.rpc.extrnode.com/218119a6-454e-430e-b63c-f1ae113c7eed',
    
    // Connection config with your API key
    CONNECTION_CONFIG: {
        httpHeaders: {
            'Authorization': '218119a6-454e-430e-b63c-f1ae113c7eed'
        },
        commitment: 'confirmed',
        confirmTransactionInitialTimeout: 120000,
        preflightCommitment: 'confirmed',
        wsEndpoint: 'wss://solana-mainnet.rpc.extrnode.com/218119a6-454e-430e-b63c-f1ae113c7eed'
    },
    
    // House wallet
    HOUSE_WALLET: '3NCvL5itgJVrwNZw8BNL8syP8Za5hAmhmApCDh4bdsTu',
    
    // Betting settings
    HOUSE_FEE_PERCENTAGE: 5,
    MIN_BET: 100,
    MAX_BET: 5000000,
    MATCH_TIMEOUT: 30 * 60,
    BET_CONFIRMATION_TIMEOUT: 120,
    
    // LAWB token config
    LAWB_TOKEN: {
        MINT: '65GVcFcSqQcaMNeBkYcen4ozeT83tr13CeDLU4sUUdV6',
        DECIMALS: 9,
        PROGRAM_ID: 'TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA'
    },

    // Transaction retry settings
    TRANSACTION_RETRY: {
        MAX_ATTEMPTS: 3,
        BACKOFF_INTERVAL: 5000
    }
};

console.log('BETTING_CONFIG:', window.BETTING_CONFIG);
console.log('LAWB_TOKEN:', window.BETTING_CONFIG?.LAWB_TOKEN);