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
        httpHeaders: {
            'Authorization': 'Bearer 218119a6-454e-430e-b63c-f1ae113c7eed',
            'Origin': 'https://lawb.xyz',
            'Referer': 'https://lawb.xyz/'
        }
    },
    
    async createConnection() {
        try {
            // Try GenesysGo public endpoint first
            const connection = new solanaWeb3.Connection(
                'https://ssc-dao.genesysgo.net/',
                { commitment: 'confirmed' }
            );
            
            try {
                await connection.getVersion();
                console.log('Connected to GenesysGo endpoint');
                return connection;
            } catch (error) {
                console.warn('GenesysGo endpoint failed, trying Extrnode');
                
                // Try Extrnode endpoint
                const extrnodeConnection = new solanaWeb3.Connection(
                    this.ENDPOINTS[this.CLUSTER][0],
                    this.CONNECTION_CONFIG
                );
                
                await extrnodeConnection.getVersion();
                console.log('Connected to Extrnode endpoint');
                return extrnodeConnection;
            }
        } catch (error) {
            console.error('Failed to create Solana connection:', error);
            // Final fallback to public endpoint
            const fallbackConnection = new solanaWeb3.Connection(
                'https://api.devnet.solana.com',
                { commitment: 'confirmed' }
            );
            await fallbackConnection.getVersion();
            console.log('Connected to fallback endpoint');
            return fallbackConnection;
        }
    }
};