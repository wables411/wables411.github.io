window.SOLANA_CONFIG = {
    CLUSTER: 'mainnet-beta',
    ENDPOINTS: {
        'mainnet-beta': [
            'https://rpc.ankr.com/solana',  // Use Ankr as primary
            'https://solana-api.projectserum.com'  // Backup
        ]
    },
    CONNECTION_CONFIG: {
        commitment: 'confirmed',
        confirmTransactionInitialTimeout: 60000,
        disableRetryOnRateLimit: false,
        wsEndpoint: false  // Disable websocket
    },
    async createConnection() {
        for (const endpoint of this.ENDPOINTS[this.CLUSTER]) {
            try {
                const connection = new solanaWeb3.Connection(endpoint, {
                    ...this.CONNECTION_CONFIG,
                    httpHeaders: {
                        'Content-Type': 'application/json'
                    }
                });
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