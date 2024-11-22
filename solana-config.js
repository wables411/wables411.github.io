window.SOLANA_CONFIG = {
    CLUSTER: 'mainnet-beta',
    ENDPOINTS: {
        'mainnet-beta': [
            'https://solana-mainnet.rpc.extrnode.com/218119a6-454e-430e-b63c-f1ae113c7eed'  // Note correct URL format
        ]
    },
    CONNECTION_CONFIG: {
        commitment: 'confirmed',
        confirmTransactionInitialTimeout: 60000,
        httpHeaders: {
            'Authorization': 'Bearer 218119a6-454e-430e-b63c-f1ae113c7eed',
            'Origin': 'https://lawb.xyz',
            'Referer': 'https://lawb.xyz/'
        }
    },
    
    async createConnection() {
        try {
            console.log('Creating Solana connection...');
            const connection = new solanaWeb3.Connection(
                this.ENDPOINTS[this.CLUSTER][0],
                {
                    ...this.CONNECTION_CONFIG,
                    httpHeaders: this.CONNECTION_CONFIG.httpHeaders
                }
            );
            
            await connection.getVersion();
            console.log('Connection established');
            return connection;
        } catch (error) {
            console.error('Connection failed:', error);
            throw error;  // Let the caller handle fallbacks
        }
    }
};