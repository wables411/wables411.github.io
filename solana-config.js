window.SOLANA_CONFIG = {
    CLUSTER: 'mainnet-beta',
    ENDPOINTS: {
        'mainnet-beta': [
            'https://rpc.ankr.com/solana',  // Move Ankr to first position
            'https://solana-api.projectserum.com',
            'https://solana-mainnet.rpc.extrnode.com/218119a6-454e-430e-b63c-f1ae113c7eed'
        ]
    },
    CONNECTION_CONFIG: {
        commitment: 'confirmed',
        confirmTransactionInitialTimeout: 60000,
        httpHeaders: {
            'Authorization': 'Bearer 218119a6-454e-430e-b63c-f1ae113c7eed',
            'Content-Type': 'application/json'
        },
        wsEndpoint: 'wss://solana-mainnet.rpc.extrnode.com/218119a6-454e-430e-b63c-f1ae113c7eed'
    },
    PROGRAM_IDS: {
        TOKEN: 'TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA',
        ASSOCIATED_TOKEN: 'ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL',
        SYSTEM: '11111111111111111111111111111111'
    },
    async createConnection() {
        for (const endpoint of this.ENDPOINTS[this.CLUSTER]) {
            try {
                const connection = new solanaWeb3.Connection(endpoint, this.CONNECTION_CONFIG);
                // Test connection
                await connection.getSlot();
                console.log('Connected to Solana network:', endpoint);
                return connection;
            } catch (error) {
                console.warn(`Failed to connect to ${endpoint}, trying next...`);
            }
        }
        throw new Error('Unable to connect to any Solana endpoint');
    }
};