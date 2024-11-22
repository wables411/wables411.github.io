window.SOLANA_CONFIG = {
    CLUSTER: 'mainnet-beta',
    ENDPOINTS: {
        'mainnet-beta': 'https://rpc.extrnode.com/solana/218119a6-454e-430e-b63c-f1ae113c7eed'
    },
    RPC_CONFIG: {
        httpHeaders: {
            'Authorization': 'Bearer 218119a6-454e-430e-b63c-f1ae113c7eed',
            'Origin': 'https://lawb.xyz',
            'Referer': 'https://lawb.xyz/'
        }
    },
    CONNECTION_CONFIG: {
        commitment: 'confirmed',
        confirmTransactionInitialTimeout: 60000
    },
    
    async createConnection() {
        try {
            console.log('Creating Solana connection...');
            
            // Create main connection
            const connection = new solanaWeb3.Connection(
                this.ENDPOINTS[this.CLUSTER],
                {
                    ...this.CONNECTION_CONFIG,
                    httpHeaders: this.RPC_CONFIG.httpHeaders
                }
            );
            
            // Test connection
            console.log('Testing connection...');
            const version = await connection.getVersion();
            console.log('Connection successful, version:', version);
            
            return connection;
        } catch (error) {
            console.error('Error creating main connection:', error);
            
            // Try fallback
            try {
                console.log('Trying fallback connection...');
                const fallbackConnection = new solanaWeb3.Connection(
                    'https://api.mainnet-beta.solana.com',
                    this.CONNECTION_CONFIG
                );
                
                await fallbackConnection.getVersion();
                console.log('Fallback connection successful');
                
                return fallbackConnection;
            } catch (fallbackError) {
                console.error('Fallback connection failed:', fallbackError);
                throw new Error('Failed to establish any connection');
            }
        }
    }
};