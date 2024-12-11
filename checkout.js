const supabase = createClient(
    'https://roxwocgknkiqnsgiojgz.supabase.co',
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJveHdvY2drbmtpcW5zZ2lvamd6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzA3NjMxMTIsImV4cCI6MjA0NjMzOTExMn0.NbLMZom-gk7XYGdV4MtXYcgR8R1s8xthrIQ0hpQfx9Y'
);

const CheckoutComponent = () => {
    const [walletConnected, setWalletConnected] = React.useState(false);
    const [publicKey, setPublicKey] = React.useState(null);
    const [showForm, setShowForm] = React.useState(false);
    const [loading, setLoading] = React.useState(false);
    const [selectedColor, setSelectedColor] = React.useState(null);
    const [showColorChoice, setShowColorChoice] = React.useState(false);
    const [paymentType, setPaymentType] = React.useState(null);
    const [showWalletModal, setShowWalletModal] = React.useState(false);

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
    
            // Request wallet connection
            try {
                await window.solana.connect({ onlyIfTrusted: false });
            } catch (err) {
                console.error('Connection error:', err);
                alert('Failed to connect: ' + err.message);
                return;
            }
    
            // After connection, get the public key
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

    const handleSolPayment = async () => {
        if (!selectedColor) {
            alert('Please select a color first');
            return;
        }

        try {
            setLoading(true);
            setPaymentType('SOL');
            const connection = new solanaWeb3.Connection('https://api.mainnet-beta.solana.com');
            const recipient = new solanaWeb3.PublicKey('6GXgaZyCrPqs1gMW3tFU9g82oPQY7eqyjcneQDs9PYJN');
            const transaction = new solanaWeb3.Transaction().add(
                solanaWeb3.SystemProgram.transfer({
                    fromPubkey: new solanaWeb3.PublicKey(publicKey),
                    toPubkey: recipient,
                    lamports: 0.5 * solanaWeb3.LAMPORTS_PER_SOL
                })
            );

            const { blockhash } = await connection.getRecentBlockhash();
            transaction.recentBlockhash = blockhash;
            transaction.feePayer = new solanaWeb3.PublicKey(publicKey);

            // Modify this part to handle different wallet types
            const provider = window.solana || window.solflare;
            const signed = await provider.signTransaction(transaction);
            const signature = await connection.sendRawTransaction(signed.serialize());
            const confirmation = await connection.confirmTransaction(signature);
            
            if (confirmation.value.err) {
                throw new Error('Transaction failed');
            }
            
            setShowForm(true);
        } catch (err) {
            console.error(err);
            alert('Payment failed');
            setPaymentType(null);
        } finally {
            setLoading(false);
        }
    };

    const handleLawbPayment = async () => {
        if (!selectedColor) {
            alert('Please select a color first');
            return;
        }
        setPaymentType('LAWB');
        // Add LAWB token payment logic here
        setShowForm(true);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
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
            payment_type: paymentType
        };

        try {
            const { data, error } = await supabase
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
            console.error(err);
            alert('Failed to submit order');
        }
    };

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
            fontSize: '16px'
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
            border: '1px solid #ccc'
        },
        loading: {
            opacity: 0.7,
            cursor: 'not-allowed'
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
const root = ReactDOM.createRoot(document.getElementById('checkout-root'));
root.render(React.createElement(CheckoutComponent));