window.SOLANA_CONFIG = {
    CLUSTER: 'mainnet-beta',
    ENDPOINTS: {
        'mainnet-beta': [
            'https://rpc.extrnode.com/solana/218119a6-454e-430e-b63c-f1ae113c7eed'
        ]
    },
    CONNECTION_CONFIG: {
        commitment: 'confirmed',
        confirmTransactionInitialTimeout: 60000,
        httpHeaders: {
            'Authorization': 'Bearer 218119a6-454e-430e-b63c-f1ae113c7eed',
            'Origin': 'https://lawb.xyz',
            'Referer': 'https://lawb.xyz/',
            'Content-Type': 'application/json'
        }
    },
    
    async createConnection() {
        try {
            console.log('Connecting to Extrnode...');
            const connection = new solanaWeb3.Connection(
                this.ENDPOINTS[this.CLUSTER][0],
                this.CONNECTION_CONFIG
            );
            
            // Test the connection
            const version = await connection.getVersion();
            console.log('Successfully connected to Extrnode:', version);
            return connection;
            
        } catch (error) {
            console.error('Error connecting to Extrnode:', error);
            
            // Try Helius as backup
            try {
                console.log('Trying Helius backup...');
                const heliusConnection = new solanaWeb3.Connection(
                    'https://mainnet.helius-rpc.com/?api-key=15319bf9-5dd0-4386-a98c-65281887673c',
                    { commitment: 'confirmed' }
                );
                await heliusConnection.getVersion();
                console.log('Connected to Helius backup');
                return heliusConnection;
            } catch (backupError) {
                console.error('Backup connection failed:', backupError);
                throw new Error('All connection attempts failed');
            }
        }
    }
};