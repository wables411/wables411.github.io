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
            'Content-Type': 'application/json'
        }
    },
    
    // For transfer instructions
    TOKEN_INSTRUCTIONS: {
        TRANSFER: 3,
        CLOSE_ACCOUNT: 9
    },

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

    createTokenTransferInstruction(source, destination, authority, amount) {
        return new solanaWeb3.TransactionInstruction({
            programId: window.SplToken.TOKEN_PROGRAM_ID,
            keys: [
                { pubkey: source, isSigner: false, isWritable: true },
                { pubkey: destination, isSigner: false, isWritable: true },
                { pubkey: authority, isSigner: true, isWritable: false }
            ],
            data: Buffer.from([
                this.TOKEN_INSTRUCTIONS.TRANSFER,
                ...new solanaWeb3.BN(amount.toString()).toArray('le', 8)
            ])
        });
    },

    // PDA helpers
    async findEscrowPDAWithBump(gameId) {
        try {
            const [pda, bump] = await solanaWeb3.PublicKey.findProgramAddress(
                [Buffer.from(gameId)],
                window.SplToken.TOKEN_PROGRAM_ID
            );
            return { pda, bump };
        } catch (error) {
            console.error('Error finding escrow PDA with bump:', error);
            throw error;
        }
    },

    async findAssociatedTokenAddress(walletAddress, tokenMintAddress) {
        try {
            const [address] = await solanaWeb3.PublicKey.findProgramAddress(
                [
                    walletAddress.toBuffer(),
                    window.SplToken.TOKEN_PROGRAM_ID.toBuffer(),
                    tokenMintAddress.toBuffer()
                ],
                window.SplToken.ASSOCIATED_TOKEN_PROGRAM_ID
            );
            return address;
        } catch (error) {
            console.error('Error finding associated token address:', error);
            throw error;
        }
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
            console.log('QuickNode connection established');
            return connection;
            
        } catch (error) {
            console.error('QuickNode connection failed:', error);
            throw error;
        }
    },

    async signAndSendTransaction(connection, transaction, wallet, signers = []) {
        try {
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
                    skipPreflight: false,
                    maxRetries: 5,
                    preflightCommitment: 'confirmed'
                }
            );

            const confirmation = await connection.confirmTransaction(signature, 'confirmed');
            if (confirmation?.value?.err) {
                throw new Error(`Transaction failed: ${confirmation.value.err}`);
            }

            return signature;
        } catch (error) {
            console.error('Transaction failed:', error);
            throw error;
        }
    }
};