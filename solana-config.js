window.SOLANA_CONFIG = {
    CLUSTER: 'mainnet-beta',
    ENDPOINTS: {
        'mainnet-beta': [
            'https://rpc.extrnode.com/solana/218119a6-454e-430e-b63c-f1ae113c7eed',  // Primary HTTPS endpoint
            'https://api.mainnet-beta.solana.com',
            'https://solana-api.projectserum.com'
        ]
    },
    CONNECTION_CONFIG: {
        commitment: 'confirmed',
        confirmTransactionInitialTimeout: 60000,
        httpHeaders: {
            'Authorization': 'Bearer 218119a6-454e-430e-b63c-f1ae113c7eed'
        }
    },
    
    async createConnection() {
        const endpoints = this.ENDPOINTS[this.CLUSTER];
        
        for (let endpoint of endpoints) {
            try {
                console.log('Trying endpoint:', endpoint);
                
                const config = endpoint.includes('extrnode') ? 
                    {
                        ...this.CONNECTION_CONFIG,
                        httpHeaders: {
                            ...this.CONNECTION_CONFIG.httpHeaders,
                            'Origin': 'https://lawb.xyz',
                            'Referer': 'https://lawb.xyz/'
                        }
                    } : this.CONNECTION_CONFIG;
                
                const connection = new solanaWeb3.Connection(endpoint, config);
                
                // Test the connection
                await connection.getVersion();
                console.log('Successfully connected to:', endpoint);
                return connection;
            } catch (error) {
                console.warn(`Failed to connect to ${endpoint}:`, error);
                continue;
            }
        }
        
        throw new Error('Failed to connect to any Solana endpoint');
    }
};