const BETTING_CONFIG = {
    // Using Helius RPC with API key
    NETWORK: 'https://mainnet.helius-rpc.com/?api-key=79326e78-9bd5-469c-9297-80feb7519584',
    
    HOUSE_WALLET: '3NCvL5itgJVrwNZw8BNL8syP8Za5hAmhmApCDh4bdsTu',
    HOUSE_FEE_PERCENTAGE: 5,
    MIN_BET: 100,
    MAX_BET: 5000000,
    MATCH_TIMEOUT: 30 * 60,
    BET_CONFIRMATION_TIMEOUT: 2 * 60
};

window.BETTING_CONFIG = BETTING_CONFIG;