window.SOLANA_CONFIG = {
    CLUSTER: 'mainnet-beta',
    ENDPOINTS: {
        'mainnet-beta': ['https://solana-mainnet.rpc.extrnode.com/218119a6-454e-430e-b63c-f1ae113c7eed']
    },
    CONNECTION_CONFIG: {
        commitment: 'confirmed',
        httpHeaders: {
            'Authorization': 'Bearer 218119a6-454e-430e-b63c-f1ae113c7eed'
        }
    },
    async createConnection() {
        const endpoint = this.ENDPOINTS[this.CLUSTER][0];
        const connection = new solanaWeb3.Connection(endpoint, this.CONNECTION_CONFIG);
        return connection;
    }
};