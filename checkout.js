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

    const connectWallet = async () => {
        try {
            if (!window.solana) {
                alert('Please install Phantom wallet');
                return;
            }
            const response = await window.solana.connect();
            setPublicKey(response.publicKey.toString());
            setWalletConnected(true);
            setShowColorChoice(true);
        } catch (err) {
            console.error(err);
            alert('Failed to connect wallet');
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

            const signed = await window.solana.signTransaction(transaction);
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
                    onClick={connectWallet} 
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
        </div>
    );
};

// Mount the React component
const root = ReactDOM.createRoot(document.getElementById('checkout-root'));
root.render(React.createElement(CheckoutComponent));