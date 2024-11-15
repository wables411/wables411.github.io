const BETTING_CONFIG = {
    // Using GenesysGo's public RPC
    NETWORK: 'https://ssc-dao.genesysgo.net/',
    
    HOUSE_WALLET: '3NCvL5itgJVrwNZw8BNL8syP8Za5hAmhmApCDh4bdsTu',
    HOUSE_FEE_PERCENTAGE: 5,
    MIN_BET: 100,
    MAX_BET: 5000000,
    MATCH_TIMEOUT: 30 * 60,
    BET_CONFIRMATION_TIMEOUT: 2 * 60
};

window.BETTING_CONFIG = BETTING_CONFIG;