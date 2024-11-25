// solana-config.js
window.SOLANA_CONFIG = {
    CLUSTER: 'mainnet-beta',
    ENDPOINTS: {
        'mainnet-beta': [
            'https://solana-mainnet.rpc.extrnode.com'
        ]
    },
    CONNECTION_CONFIG: {
        commitment: 'confirmed',
        confirmTransactionInitialTimeout: 60000,
        httpHeaders: {
            'Authorization': 'Bearer 218119a6-454e-430e-b63c-f1ae113c7eed',
            'Origin': 'https://lawb.xyz',
            'Referer': 'https://lawb.xyz',
            'Content-Type': 'application/json'
        }
    },
    
    async createConnection() {
        const endpoint = this.ENDPOINTS[this.CLUSTER][0];
        try {
            console.log('Creating Extrnode connection...');
            
            // Create pre-configured fetch function
            const fetchFunction = (url, options) => {
                const finalOptions = {
                    ...options,
                    headers: {
                        ...options.headers,
                        ...this.CONNECTION_CONFIG.httpHeaders
                    }
                };
                return fetch(url, finalOptions);
            };
            
            const connection = new solanaWeb3.Connection(
                endpoint, 
                {
                    commitment: this.CONNECTION_CONFIG.commitment,
                    confirmTransactionInitialTimeout: this.CONNECTION_CONFIG.confirmTransactionInitialTimeout,
                    httpHeaders: this.CONNECTION_CONFIG.httpHeaders,
                    fetch: fetchFunction
                }
            );
            
            // Test connection
            await connection.getVersion();
            console.log('Extrnode connection established');
            return connection;
            
        } catch (error) {
            console.error('Extrnode connection failed:', error);
            throw error;
        }
    }
};