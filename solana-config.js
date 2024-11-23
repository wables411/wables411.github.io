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
            'Authorization': '218119a6-454e-430e-b63c-f1ae113c7eed',  // Removed 'Bearer' prefix
            'Origin': 'lawb.xyz',  // Changed to match exactly
            'Referer': 'lawb.xyz',  // Changed to match exactly
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
    },

    // Test the connection directly
    async testConnection() {
        const response = await fetch(
            this.ENDPOINTS[this.CLUSTER][0],
            {
                method: 'POST',
                headers: this.CONNECTION_CONFIG.httpHeaders,
                body: JSON.stringify({
                    "jsonrpc": "2.0",
                    "id": 1,
                    "method": "getHealth"
                })
            }
        );
        const data = await response.json();
        console.log('Connection test response:', data);
        return data;
    }
};