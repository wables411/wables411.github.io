// solana-config.js
const SOLANA_CONFIG = {
    // Network settings
    CLUSTER: 'mainnet-beta',
    ENDPOINTS: {
        'mainnet-beta': [
            'https://solana-mainnet.g.alchemy.com/v2/demo',
            'https://ssc-dao.genesysgo.net',
            'https://api.mainnet-beta.solana.com'
        ],
        'devnet': 'https://api.devnet.solana.com',
        'testnet': 'https://api.testnet.solana.com'
    },

    // Connection settings
    CONNECTION_CONFIG: {
        commitment: 'confirmed',
        confirmTransactionInitialTimeout: 60000,
        wsEndpoint: 'wss://api.mainnet-beta.solana.com/'
    },

    // Program IDs
    PROGRAM_IDS: {
        TOKEN: 'TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA',
        ASSOCIATED_TOKEN: 'ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL',
        SYSTEM: '11111111111111111111111111111111'
    },

    // Helper functions
    async getBestEndpoint() {
        const endpoints = this.ENDPOINTS[this.CLUSTER];
        const endpointList = Array.isArray(endpoints) ? endpoints : [endpoints];
        
        for (const endpoint of endpointList) {
            try {
                const connection = new solanaWeb3.Connection(endpoint, this.CONNECTION_CONFIG);
                await connection.getVersion();
                console.log(`Using Solana endpoint: ${endpoint}`);
                return endpoint;
            } catch (error) {
                console.warn(`Failed to connect to ${endpoint}, trying next...`);
            }
        }
        throw new Error('Unable to connect to any Solana endpoint');
    },

    async createConnection() {
        const endpoint = await this.getBestEndpoint();
        return new solanaWeb3.Connection(endpoint, this.CONNECTION_CONFIG);
    },

    getTokenProgram() {
        return new solanaWeb3.PublicKey(this.PROGRAM_IDS.TOKEN);
    },

    getATAProgram() {
        return new solanaWeb3.PublicKey(this.PROGRAM_IDS.ASSOCIATED_TOKEN);
    }
};

window.SOLANA_CONFIG = SOLANA_CONFIG;