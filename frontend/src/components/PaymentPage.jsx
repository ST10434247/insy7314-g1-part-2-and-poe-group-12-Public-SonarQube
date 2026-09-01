import React, { useState, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import CardInput from './CardInput';

export default function PaymentPage({ gigId, gigTitle, price }) {
  const { token, user } = useContext(AuthContext);
  const [validCardNumber, setValidCardNumber] = useState(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(null);

  const handleCheckout = async (e) => {
    e.preventDefault();
    if (!validCardNumber) {
      setMessage({ type: 'error', text: 'Please provide a valid card number.' });
      return;
    }

    if (!token) {
      setMessage({ type: 'error', text: 'You must be logged in as a client to book.' });
      return;
    }

    setLoading(true);
    setMessage(null);

    try {
      const response = await fetch('/api/bookings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          gigId: gigId,
          cardNumber: validCardNumber
        })
      });

      const data = await response.json();

      if (response.ok) {
        setMessage({ type: 'success', text: `Booking successful! Confirmation ID: ${data.booking._id}` });
      } else {
        setMessage({ type: 'error', text: data.error || 'Payment failed.' });
      }
    } catch (err) {
      setMessage({ type: 'error', text: 'Network error processing payment.' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: '400px', margin: '20px auto', padding: '20px', border: '1px solid #ccc', borderRadius: '8px' }}>
      <h2>Simulate Checkout</h2>
      <div style={{ marginBottom: '15px' }}>
        <p><strong>Gig:</strong> {gigTitle || 'Sample Web Development'}</p>
        <p><strong>Total Price:</strong> ${price || '150.00'}</p>
      </div>

      <form onSubmit={handleCheckout}>
        <CardInput onValidCard={(cardNumber) => setValidCardNumber(cardNumber)} />

        {message && (
          <div style={{ margin: '10px 0', color: message.type === 'error' ? 'red' : 'green' }}>
            {message.text}
          </div>
        )}

        <button
          type="submit"
          disabled={!validCardNumber || loading}
          style={{
            width: '100%',
            padding: '10px',
            marginTop: '15px',
            backgroundColor: validCardNumber ? '#007bff' : '#ccc',
            color: '#fff',
            border: 'none',
            borderRadius: '4px',
            cursor: validCardNumber ? 'pointer' : 'not-allowed'
          }}
        >
          {loading ? 'Processing...' : 'Pay & Book Gig'}
        </button>
      </form>
    </div>
  );
}