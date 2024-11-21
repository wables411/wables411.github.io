window.SOLANA_CONFIG = {
    CLUSTER: 'mainnet-beta',
    ENDPOINTS: {
        'mainnet-beta': [
            'https://solana-mainnet.rpc.extrnode.com/218119a6-454e-430e-b63c-f1ae113c7eed'
        ]
    },
    CONNECTION_CONFIG: {
        commitment: 'confirmed',
        confirmTransactionInitialTimeout: 60000,
        wsEndpoint: 'wss://solana-mainnet.rpc.extrnode.com/218119a6-454e-430e-b63c-f1ae113c7eed',
        httpHeaders: {
            'Authorization': 'Bearer 218119a6-454e-430e-b63c-f1ae113c7eed',
            'Origin': 'https://lawb.xyz',
            'Referer': 'https://lawb.xyz'
        }
    },
    
    async createConnection() {
        try {
            const endpoint = this.ENDPOINTS[this.CLUSTER][0];
            const connection = new solanaWeb3.Connection(
                endpoint,
                this.CONNECTION_CONFIG
            );
            
            // Test connection
            await connection.getVersion();
            console.log('Solana connection established successfully');
            return connection;
        } catch (error) {
            console.error('Failed to create Solana connection:', error);
            // Fall back to public RPC if Extrnode fails
            try {
                const fallbackConnection = new solanaWeb3.Connection(
                    'https://api.mainnet-beta.solana.com',
                    { commitment: 'confirmed' }
                );
                await fallbackConnection.getVersion();
                console.log('Connected to fallback endpoint');
                return fallbackConnection;
            } catch (fallbackError) {
                console.error('Fallback connection failed:', fallbackError);
                throw error;
            }
        }
    }
};