window.SOLANA_CONFIG = {
    CLUSTER: 'mainnet-beta',
    ENDPOINTS: {
        'mainnet-beta': [
            'https://proud-cool-butterfly.solana-mainnet.quiknode.pro/af788f06eb1d204aa3b010a2df6a3d97bb3c1b0f/'
        ]
    },
    CONNECTION_CONFIG: {
        commitment: 'confirmed',
        confirmTransactionInitialTimeout: 60000,
        httpHeaders: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${process.env.QUICKNODE_API_KEY}`
        }
    },
    
    // For transfer instructions
    TOKEN_INSTRUCTIONS: {
        TRANSFER: 3,
        CLOSE_ACCOUNT: 9
    },

    NATIVE_MINT: new solanaWeb3.PublicKey('So11111111111111111111111111111111111111112'),

    getInstructionData(type, amount) {
        const data = Buffer.alloc(9);
        data.writeUInt8(type, 0);
        data.writeBigUInt64LE(BigInt(amount.toString()), 1);
        return data;
    },

    createTransferInstruction(source, destination, owner, amount) {
        return new solanaWeb3.TransactionInstruction({
            keys: [
                { pubkey: source, isSigner: false, isWritable: true },
                { pubkey: destination, isSigner: false, isWritable: true },
                { pubkey: owner, isSigner: true, isWritable: false }
            ],
            programId: window.SplToken.TOKEN_PROGRAM_ID,
            data: this.getInstructionData(this.TOKEN_INSTRUCTIONS.TRANSFER, amount)
        });
    },

    // PDA helpers
    async findEscrowPDA(gameId) {
        const seeds = [Buffer.from(gameId)];
        return solanaWeb3.PublicKey.findProgramAddress(
            seeds, 
            window.SplToken.TOKEN_PROGRAM_ID
        );
    },

    async findAssociatedTokenAddress(walletAddress, tokenMintAddress) {
        const [address] = await solanaWeb3.PublicKey.findProgramAddress(
            [
                walletAddress.toBuffer(),
                window.SplToken.TOKEN_PROGRAM_ID.toBuffer(),
                tokenMintAddress.toBuffer()
            ],
            window.SplToken.ASSOCIATED_TOKEN_PROGRAM_ID
        );
        return address;
    },

    async createConnection() {
        const endpoint = this.ENDPOINTS[this.CLUSTER][0];
        try {
            console.log('Creating QuickNode connection...');
            
            const connection = new solanaWeb3.Connection(
                endpoint, 
                this.CONNECTION_CONFIG
            );
            
            // Test connection
            const version = await connection.getVersion();
            console.log('QuickNode connection established', version);
            return connection;
            
        } catch (error) {
            console.error('QuickNode connection failed:', error);
            throw error;
        }
    },

    async signAndSendTransaction(connection, transaction, wallet, signers = []) {
        transaction.recentBlockhash = (
            await connection.getLatestBlockhash('confirmed')
        ).blockhash;

        transaction.feePayer = wallet.publicKey;

        if (signers.length > 0) {
            transaction.partialSign(...signers);
        }

        const signed = await wallet.signTransaction(transaction);
        const signature = await connection.sendRawTransaction(
            signed.serialize(),
            {
                skipPreflight: true,
                maxRetries: 5
            }
        );

        await connection.confirmTransaction(signature);
        return signature;
    }
};