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
            'Content-Type': 'application/json'
        }
    },
    
    async createConnection() {
        try {
            const endpoint = this.ENDPOINTS[this.CLUSTER][0];
            const connection = new solanaWeb3.Connection(endpoint, this.CONNECTION_CONFIG);
            
            // Test connection
            await connection.getVersion();
            console.log('Solana connection established successfully');
            
            return connection;
        } catch (error) {
            console.error('Failed to create Solana connection:', error);
            throw error;
        }
    },

    async getTokenBalance(connection, walletAddress, tokenMintAddress) {
        try {
            const pubKey = new solanaWeb3.PublicKey(walletAddress);
            const tokenMint = new solanaWeb3.PublicKey(tokenMintAddress);
            
            const tokenAccounts = await connection.getParsedTokenAccountsByOwner(
                pubKey,
                { mint: tokenMint }
            );

            if (tokenAccounts.value.length === 0) {
                return 0;
            }

            return tokenAccounts.value[0].account.data.parsed.info.tokenAmount.uiAmount;
        } catch (error) {
            console.error('Error getting token balance:', error);
            return 0;
        }
    }
};