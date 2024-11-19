window.SOLANA_CONFIG = {
    CLUSTER: 'mainnet-beta',
    ENDPOINTS: {
        'mainnet-beta': [
            'https://solana-mainnet.phantom.tech/YBPpkkN4g91xDiAnTE9r0RcMkjg0sKUIWvAfoFVJ',
            'https://api.mainnet-beta.solana.com'
        ]
    },
    CONNECTION_CONFIG: {
        commitment: 'confirmed',
        confirmTransactionInitialTimeout: 60000,
        disableRetryOnRateLimit: false
    },
    async createConnection() {
        for (const endpoint of this.ENDPOINTS[this.CLUSTER]) {
            try {
                const connection = new solanaWeb3.Connection(endpoint, this.CONNECTION_CONFIG);
                // Test connection
                await connection.getSlot();
                console.log('Using Solana endpoint:', endpoint);
                return connection;
            } catch (error) {
                console.warn(`Failed to connect to ${endpoint}, trying next...`);
            }
        }
        throw new Error('Unable to connect to any Solana endpoint');
    }
};