window.SOLANA_CONFIG = {
    CLUSTER: 'mainnet-beta',
    ENDPOINTS: {
        'mainnet-beta': [
            'https://solana-mainnet.rpc.extrnode.com/218119a6-454e-430e-b63c-f1ae113c7eed',
            'https://api.mainnet-beta.solana.com'  // Fallback
        ]
    },
    CONNECTION_CONFIG: {
        commitment: 'confirmed',
        confirmTransactionInitialTimeout: 60000,
        wsEndpoint: false,
        httpHeaders: {
            'Authorization': '218119a6-454e-430e-b63c-f1ae113c7eed',
            'Origin': 'https://lawb.xyz',
            'Referer': 'https://lawb.xyz'
        }
    },
    
    async createConnection() {
        let connection = null;
        let error = null;
        
        for (const endpoint of this.ENDPOINTS[this.CLUSTER]) {
            try {
                console.log('Attempting connection to:', endpoint);
                
                const config = {
                    ...this.CONNECTION_CONFIG
                };
                
                // Add headers only for Extrnode endpoint
                if (endpoint.includes('extrnode')) {
                    config.httpHeaders = this.CONNECTION_CONFIG.httpHeaders;
                }
                
                connection = new solanaWeb3.Connection(endpoint, config);
                
                // Test connection
                await connection.getVersion();
                console.log('Connection established to:', endpoint);
                return connection;
                
            } catch (err) {
                console.warn(`Connection failed for ${endpoint}:`, err);
                error = err;
            }
        }
        
        throw error || new Error('Failed to connect to any endpoint');
    }
};