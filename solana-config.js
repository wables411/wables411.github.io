window.SOLANA_CONFIG = {
    CLUSTER: 'mainnet-beta',
    ENDPOINTS: {
        'mainnet-beta': [
            'https://neat-hidden-sanctuary.solana-mainnet.discover.quiknode.pro/2af5315d336f9ae920028bbb90a73b724dc1bbed/',
            'https://solana.rpcpool.com',
            'https://free.rpcpool.com'
        ]
    },
    CONNECTION_CONFIG: {
        commitment: 'confirmed',
        confirmTransactionInitialTimeout: 60000,
        wsEndpoint: 'wss://neat-hidden-sanctuary.solana-mainnet.discover.quiknode.pro/2af5315d336f9ae920028bbb90a73b724dc1bbed/',
        httpHeaders: {
            'Content-Type': 'application/json'
        }
    },
    
    async createConnection() {
        const endpoints = this.ENDPOINTS[this.CLUSTER];
        
        for (let endpoint of endpoints) {
            try {
                console.log('Trying endpoint:', endpoint);
                
                const connection = new solanaWeb3.Connection(
                    endpoint,
                    {
                        ...this.CONNECTION_CONFIG,
                        commitment: 'confirmed',
                        confirmTransactionInitialTimeout: 60000
                    }
                );
                
                // Test the connection
                const version = await connection.getVersion();
                console.log('Successfully connected to:', endpoint, 'Version:', version);
                return connection;
                
            } catch (error) {
                console.warn(`Failed to connect to ${endpoint}:`, error);
                continue;
            }
        }
        
        // If all endpoints fail, create a fallback connection
        try {
            console.log('Trying fallback connection...');
            const fallbackEndpoint = 'https://api.mainnet-beta.solana.com';
            const fallbackConnection = new solanaWeb3.Connection(
                fallbackEndpoint,
                'confirmed'
            );
            
            await fallbackConnection.getVersion();
            console.log('Connected to fallback endpoint');
            return fallbackConnection;
            
        } catch (error) {
            console.error('All connection attempts failed:', error);
            throw new Error('Failed to connect to any Solana endpoint');
        }
    }
};