// solana-config.js
window.SOLANA_CONFIG = {
    CLUSTER: 'mainnet-beta',
    ENDPOINTS: {
        'mainnet-beta': [
            'https://proud-cool-butterfly.solana-mainnet.quiknode.pro/af788f06eb1d204aa3b010a2df6a3d97bb3c1b0f/'
        ]
    },
    CONNECTION_CONFIG: {
        commitment: 'confirmed',
        confirmTransactionInitialTimeout: 60000,
        httpHeaders: {
            'Content-Type': 'application/json'
        }
    },
    
    async createConnection() {
        const endpoint = this.ENDPOINTS[this.CLUSTER][0];
        try {
            console.log('Creating QuickNode connection...');
            
            const connection = new solanaWeb3.Connection(
                endpoint, 
                this.CONNECTION_CONFIG
            );
            
            // Test connection
            await connection.getVersion();
            console.log('QuickNode connection established');
            return connection;
            
        } catch (error) {
            console.error('QuickNode connection failed:', error);
            throw error;
        }
    }
};