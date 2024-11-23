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
            'Authorization': '218119a6-454e-430e-b63c-f1ae113c7eed',
            'Origin': 'https://lawb.xyz',
            'Referer': 'https://lawb.xyz/',
            'Content-Type': 'application/json'
        }
    },
    
    async createConnection() {
        const endpoint = this.ENDPOINTS[this.CLUSTER][0];
        try {
            console.log('Creating Extrnode connection...');
            
            // Create pre-configured fetch function with retry logic
            const fetchWithRetry = async (url, options, retries = 3) => {
                const finalOptions = {
                    ...options,
                    headers: {
                        ...options.headers,
                        ...this.CONNECTION_CONFIG.httpHeaders
                    }
                };

                for (let i = 0; i < retries; i++) {
                    try {
                        const response = await fetch(url, finalOptions);
                        if (response.ok) {
                            return response;
                        }
                        console.warn(`Attempt ${i + 1} failed, retrying...`);
                        await new Promise(resolve => setTimeout(resolve, 1000 * (i + 1)));
                    } catch (error) {
                        if (i === retries - 1) throw error;
                        console.warn(`Attempt ${i + 1} failed, retrying...`);
                        await new Promise(resolve => setTimeout(resolve, 1000 * (i + 1)));
                    }
                }
                throw new Error(`Failed after ${retries} retries`);
            };
            
            const connection = new solanaWeb3.Connection(
                endpoint, 
                {
                    commitment: this.CONNECTION_CONFIG.commitment,
                    confirmTransactionInitialTimeout: this.CONNECTION_CONFIG.confirmTransactionInitialTimeout,
                    fetch: fetchWithRetry
                }
            );
            
            // Test connection
            await connection.getVersion();
            console.log('Extrnode connection established successfully');
            return connection;
            
        } catch (error) {
            console.error('Extrnode connection failed:', error);
            throw error;
        }
    },

    // Test the connection directly
    async testConnection() {
        try {
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
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const data = await response.json();
            console.log('Connection test response:', data);
            return data;
        } catch (error) {
            console.error('Connection test failed:', error);
            throw error;
        }
    }
};