// Define React and ReactDOM from window globals
const { createElement, useState } = React;
const { createRoot } = ReactDOM;

// Constants
const LAWB_DECIMALS = 9;
const LAWB_TOKEN_ADDRESS = new solanaWeb3.PublicKey('65GVcFcSqQcaMNeBkYcen4ozeT83tr13CeDLU4sUUdV6');
const MERCHANT_ADDRESS = new solanaWeb3.PublicKey('6GXgaZyCrPqs1gMW3tFU9g82oPQY7eqyjcneQDs9PYJN');

// Token Constants
const TOKEN_PROGRAM_ID = new solanaWeb3.PublicKey('TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA');
const ASSOCIATED_TOKEN_PROGRAM_ID = new solanaWeb3.PublicKey('ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL');

// Initialize Supabase using the global client
const supabase = window.supabase.createClient(
    'https://roxwocgknkiqnsgiojgz.supabase.co',
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJveHdvY2drbmtpcW5zZ2lvamd6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzA3NjMxMTIsImV4cCI6MjA0NjMzOTExMn0.NbLMZom-gk7XYGdV4MtXYcgR8R1s8xthrIQ0hpQfx9Y'
);

// Helper function for token accounts
const findAssociatedTokenAddress = async (walletAddress, tokenMintAddress) => {
    const [address] = await solanaWeb3.PublicKey.findProgramAddressSync(
        [
            new solanaWeb3.PublicKey(walletAddress).toBuffer(),
            TOKEN_PROGRAM_ID.toBuffer(),
            new solanaWeb3.PublicKey(tokenMintAddress).toBuffer(),
        ],
        ASSOCIATED_TOKEN_PROGRAM_ID
    );
    return address;
};

const getOrCreateAssociatedTokenAccount = async (connection, provider, mint, owner) => {
    try {
        const ownerPubKey = new solanaWeb3.PublicKey(owner);
        const mintPubKey = new solanaWeb3.PublicKey(mint);
        
        // Find the associated token address
        const associatedTokenAddress = await findAssociatedTokenAddress(
            owner,
            mint.toString()
        );

        try {
            // Check if account exists
            await connection.getTokenAccountBalance(associatedTokenAddress);
            return {
                address: associatedTokenAddress,
                exists: true
            };
        } catch (error) {
            // Account doesn't exist, create it
            const transaction = new solanaWeb3.Transaction();
            
            transaction.add(
                new solanaWeb3.TransactionInstruction({
                    keys: [
                        { pubkey: ownerPubKey, isSigner: true, isWritable: true },
                        { pubkey: associatedTokenAddress, isSigner: false, isWritable: true },
                        { pubkey: ownerPubKey, isSigner: false, isWritable: false },
                        { pubkey: mintPubKey, isSigner: false, isWritable: false },
                        { pubkey: solanaWeb3.SystemProgram.programId, isSigner: false, isWritable: false },
                        { pubkey: TOKEN_PROGRAM_ID, isSigner: false, isWritable: false },
                        { pubkey: ASSOCIATED_TOKEN_PROGRAM_ID, isSigner: false, isWritable: false },
                    ],
                    programId: ASSOCIATED_TOKEN_PROGRAM_ID,
                    data: Buffer.from([]),
                })
            );

            const { blockhash } = await connection.getLatestBlockhash('confirmed');
            transaction.recentBlockhash = blockhash;
            transaction.feePayer = ownerPubKey;

            const signed = await provider.signAndSendTransaction(transaction);
            await connection.confirmTransaction(signed.signature, 'confirmed');

            return {
                address: associatedTokenAddress,
                exists: false
            };
        }
    } catch (error) {
        console.error('Error in getOrCreateAssociatedTokenAccount:', error);
        throw error;
    }
};

// CheckoutComponent implementation
const CheckoutComponent = () => {
    // State declarations
    const [walletConnected, setWalletConnected] = useState(false);
    const [publicKey, setPublicKey] = useState(null);
    const [showForm, setShowForm] = useState(false);
    const [loading, setLoading] = useState(false);
    const [selectedColor, setSelectedColor] = useState(null);
    const [showColorChoice, setShowColorChoice] = useState(false);
    const [paymentType, setPaymentType] = useState(null);
    const [showWalletModal, setShowWalletModal] = useState(false);

    const styles = {
        container: {
            maxWidth: '500px',
            margin: '0 auto',
            padding: '20px',
            backgroundColor: 'rgba(0, 0, 0, 0.7)',
            borderRadius: '10px',
            color: 'white',
        },
        button: {
            backgroundColor: '#FF0000',
            color: 'white',
            padding: '10px 20px',
            border: 'none',
            borderRadius: '5px',
            cursor: 'pointer',
            width: '100%',
            marginTop: '10px',
            fontSize: '16px',
            transition: 'background-color 0.2s ease'
        },
        colorButton: {
            padding: '10px 20px',
            border: 'none',
            borderRadius: '5px',
            cursor: 'pointer',
            margin: '5px',
            width: '120px',
            fontSize: '16px',
            transition: 'transform 0.2s'
        },
        selectedColor: {
            transform: 'scale(1.1)',
            boxShadow: '0 0 10px rgba(255, 255, 255, 0.5)'
        },
        colorContainer: {
            display: 'flex',
            justifyContent: 'center',
            gap: '20px',
            marginBottom: '20px'
        },
        input: {
            width: '100%',
            padding: '8px',
            margin: '5px 0',
            borderRadius: '4px',
            border: '1px solid #ccc',
            backgroundColor: 'rgba(255, 255, 255, 0.9)',
            color: '#000',
            fontSize: '14px'
        },
        loading: {
            opacity: 0.7,
            cursor: 'not-allowed',
            backgroundColor: '#cc0000'
        },
        errorText: {
            color: '#ff4444',
            fontSize: '14px',
            marginTop: '5px',
            textAlign: 'center'
        }
    };

    const WalletModal = () => (
        <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.7)',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            zIndex: 1000
        }}>
            <div style={{
                backgroundColor: 'rgba(0, 0, 0, 0.9)',
                padding: '20px',
                borderRadius: '10px',
                maxWidth: '400px',
                width: '90%'
            }}>
                <h3 style={{
                    color: 'white',
                    textAlign: 'center',
                    marginBottom: '20px'
                }}>Select Wallet</h3>
                
                <button
                    onClick={connectPhantom}
                    style={{
                        ...styles.button,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '10px'
                    }}>
                    Phantom
                </button>
                
                <button
                    onClick={connectSolflare}
                    style={{
                        ...styles.button,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '10px'
                    }}>
                    Solflare
                </button>
                
                <button
                    onClick={() => setShowWalletModal(false)}
                    style={{
                        ...styles.button,
                        backgroundColor: '#666',
                        marginTop: '20px'
                    }}>
                    Cancel
                </button>
            </div>
        </div>
    );

    const connectPhantom = async () => {
        try {
            if (typeof window.solana === 'undefined') {
                alert('Please install Phantom wallet');
                return;
            }

            try {
                await window.solana.connect({ onlyIfTrusted: false });
            } catch (err) {
                console.error('Connection error:', err);
                alert('Failed to connect: ' + err.message);
                return;
            }

            if (window.solana.isConnected && window.solana.publicKey) {
                setPublicKey(window.solana.publicKey.toString());
                setWalletConnected(true);
                setShowColorChoice(true);
                setShowWalletModal(false);
            } else {
                alert('Please authorize the connection in your wallet');
            }
        } catch (err) {
            console.error('Wallet error:', err);
            alert('Failed to connect Phantom wallet');
        }
    };

    const connectSolflare = async () => {
        try {
            if (typeof window.solflare === 'undefined') {
                alert('Please install Solflare wallet');
                return;
            }

            try {
                await window.solflare.connect();
            } catch (err) {
                console.error('Connection error:', err);
                alert('Failed to connect: ' + err.message);
                return;
            }

            if (window.solflare.isConnected && window.solflare.publicKey) {
                setPublicKey(window.solflare.publicKey.toString());
                setWalletConnected(true);
                setShowColorChoice(true);
                setShowWalletModal(false);
            } else {
                alert('Please authorize the connection in your wallet');
            }
        } catch (err) {
            console.error('Wallet error:', err);
            alert('Failed to connect Solflare wallet');
        }
    };

    const handleColorSelect = (color) => {
        setSelectedColor(color);
    };

    const handleLawbPayment = async () => {
        if (!selectedColor) {
            alert('Please select a color first');
            return;
        }
    
        try {
            setLoading(true);
            setPaymentType('LAWB');
    
            const provider = window.solana || window.solflare;
            if (!provider) {
                throw new Error('Wallet not connected');
            }
    
            const connection = new solanaWeb3.Connection(
                'https://api.mainnet-beta.solana.com',
                'confirmed'
            );
            
            const sender = new solanaWeb3.PublicKey(publicKey);
    
            // Check LAWB balance before proceeding
            const senderTokenAccount = await getOrCreateAssociatedTokenAccount(
                connection,
                provider,
                LAWB_TOKEN_ADDRESS,
                sender
            );

            try {
                const balance = await connection.getTokenAccountBalance(senderTokenAccount.address);
                const requiredAmount = BigInt(1000000 * (10 ** LAWB_DECIMALS));
                if (BigInt(balance.value.amount) < requiredAmount) {
                    throw new Error('Insufficient $LAWB balance');
                }
                
                const recipientTokenAccount = await getOrCreateAssociatedTokenAccount(
                    connection,
                    provider,
                    LAWB_TOKEN_ADDRESS,
                    MERCHANT_ADDRESS
                );

                // Create LAWB transfer instruction
                const instruction = new solanaWeb3.TransactionInstruction({
                    keys: [
                        { pubkey: senderTokenAccount.address, isSigner: false, isWritable: true },
                        { pubkey: recipientTokenAccount.address, isSigner: false, isWritable: true },
                        { pubkey: sender, isSigner: true, isWritable: false },
                    ],
                    programId: TOKEN_PROGRAM_ID,
                    data: Buffer.from([3, ...new Uint8Array(requiredAmount.toString())])  // '3' is transfer instruction
                });
        
                const transaction = new solanaWeb3.Transaction().add(instruction);
                const { blockhash } = await connection.getLatestBlockhash('confirmed');
                transaction.recentBlockhash = blockhash;
                transaction.feePayer = sender;
        
                const signed = await provider.signAndSendTransaction(transaction);
                await connection.confirmTransaction(signed.signature, 'confirmed');
        
                console.log('Transaction confirmed:', signed.signature);
                alert('Payment successful! Transaction signature: ' + signed.signature);
                setShowForm(true);
            } catch (err) {
                throw new Error('Token transfer failed: ' + err.message);
            }
    
        } catch (err) {
            console.error('Payment error:', err);
            alert('Payment failed: ' + err.message);
            setPaymentType(null);
        } finally {
            setLoading(false);
        }
    };

    const handleSolPayment = async () => {
        if (!selectedColor) {
            alert('Please select a color first');
            return;
        }
    
        try {
            setLoading(true);
            setPaymentType('SOL');
            
            const provider = window.solana || window.solflare;
            if (!provider) {
                throw new Error('Wallet not connected');
            }
    
            const connection = new solanaWeb3.Connection(
                'https://api.mainnet-beta.solana.com',
                'confirmed'
            );
            
            const sender = new solanaWeb3.PublicKey(publicKey);
    
            const transaction = new solanaWeb3.Transaction().add(
                solanaWeb3.SystemProgram.transfer({
                    fromPubkey: sender,
                    toPubkey: MERCHANT_ADDRESS,
                    lamports: 0.5 * solanaWeb3.LAMPORTS_PER_SOL
                })
            );
    
            const { blockhash } = await connection.getLatestBlockhash('confirmed');
            transaction.recentBlockhash = blockhash;
            transaction.feePayer = sender;
    
            const signed = await provider.signAndSendTransaction(transaction);
            await connection.confirmTransaction(signed.signature, 'confirmed');
    
            console.log('Transaction confirmed:', signed.signature);
            alert('Payment successful! Transaction signature: ' + signed.signature);
            setShowForm(true);
    
        } catch (err) {
            console.error('Payment error:', err);
            alert('Payment failed: ' + err.message);
            setPaymentType(null);
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!paymentType || !selectedColor) {
            alert('Please complete payment before submitting shipping details');
            return;
        }
        
        try {
            const formData = {
                wallet_address: publicKey,
                color: selectedColor,
                name: e.target.name.value,
                street_address: e.target.address.value,
                city: e.target.city.value,
                state: e.target.state.value,
                zip: e.target.zip.value,
                country: e.target.country.value,
                email: e.target.email.value,
                payment_type: paymentType,
                order_date: new Date().toISOString()
            };

            const { error } = await supabase
                .from('plushie_orders')
                .insert([formData]);

            if (error) throw error;
            
            alert('Order placed successfully!');
            e.target.reset();
            setShowForm(false);
            setWalletConnected(false);
            setSelectedColor(null);
            setPaymentType(null);
            setShowColorChoice(false);
        } catch (err) {
            console.error('Order submission error:', err);
            alert('Failed to submit order: ' + err.message);
        }
    };

    return (
        <div style={styles.container}>
            <h2 style={{textAlign: 'center', marginBottom: '20px'}}>🦞 Lawb Plushie Checkout 🦞</h2>
            
            {!walletConnected ? (
                <button 
                    onClick={() => setShowWalletModal(true)} 
                    style={styles.button}>
                    Connect Wallet
                </button>
            ) : showColorChoice && !showForm ? (
                <div>
                    <p style={{textAlign: 'center', marginBottom: '15px'}}>Select your plushie color:</p>
                    <div style={styles.colorContainer}>
                        <button
                            onClick={() => handleColorSelect('RED')}
                            style={{
                                ...styles.colorButton,
                                backgroundColor: '#FF0000',
                                color: 'white',
                                ...(selectedColor === 'RED' ? styles.selectedColor : {})
                            }}>
                            Red
                        </button>
                        <button
                            onClick={() => handleColorSelect('BLUE')}
                            style={{
                                ...styles.colorButton,
                                backgroundColor: '#0000FF',
                                color: 'white',
                                ...(selectedColor === 'BLUE' ? styles.selectedColor : {})
                            }}>
                            Blue
                        </button>
                    </div>
                    {selectedColor && (
                        <>
                            <button 
                                onClick={handleSolPayment} 
                                style={{...styles.button, ...(loading ? styles.loading : {})}}
                                disabled={loading}>
                                {loading ? 'Processing...' : 'Pay 0.5 SOL'}
                            </button>
                            <button 
                                onClick={handleLawbPayment} 
                                style={{...styles.button, marginTop: '10px'}}
                                disabled={loading}>
                                Pay 1,000,000 $LAWB
                            </button>
                        </>
                    )}
                </div>
            ) : showForm ? (
                <form onSubmit={handleSubmit}>
                    <p style={{textAlign: 'center', marginBottom: '15px'}}>
                        Selected Color: <strong>{selectedColor}</strong>
                    </p>
                    <input
                        type="text"
                        name="name"
                        placeholder="Name"
                        required
                        style={styles.input}
                    />
                    <input
                        type="text"
                        name="address"
                        placeholder="Street Address"
                        required
                        style={styles.input}
                    />
                    <input
                        type="text"
                        name="city"
                        placeholder="City"
                        required
                        style={styles.input}
                    />
                    <input
                        type="text"
                        name="state"
                        placeholder="State/Province"
                        required
                        style={styles.input}
                    />
                    <input
                        type="text"
                        name="zip"
                        placeholder="ZIP/Postal Code"
                        required
                        style={styles.input}
                    />
                    <input
                        type="text"
                        name="country"
                        placeholder="Country"
                        required
                        style={styles.input}
                    />
                    <input
                        type="email"
                        name="email"
                        placeholder="Email"
                        required
                        style={styles.input}
                    />
                    <button type="submit" style={styles.button}>
                        Submit Order
                    </button>
                </form>
            ) : null}
            {showWalletModal && <WalletModal />}
        </div>
    );
};

// Mount the React component
const root = createRoot(document.getElementById('checkout-root'));
root.render(createElement(CheckoutComponent));