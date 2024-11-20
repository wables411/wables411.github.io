window.SOLANA_CONFIG = {
    CLUSTER: 'mainnet-beta',
    ENDPOINTS: {
        'mainnet-beta': ['https://rpc.ankr.com/solana']  // Just use Ankr
    },
    CONNECTION_CONFIG: {
        commitment: 'confirmed',
        wsEndpoint: null,  // Explicitly disable websocket
        confirmTransactionInitialTimeout: 60000
    },
    async createConnection() {
        const endpoint = this.ENDPOINTS[this.CLUSTER][0];
        const connection = new solanaWeb3.Connection(
            endpoint,
            this.CONNECTION_CONFIG
        );
        await connection.getSlot(); // Test connection
        console.log('Connected to Solana network:', endpoint);
        return connection;
    }
};