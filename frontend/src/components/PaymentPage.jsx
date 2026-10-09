
import React, { useContext, useState } from 'react';
import { AuthContext } from '../context/AuthContext';
import CardInput from './CardInput';

export default function PaymentPage({ bookingId, gigTitle, price, onPaymentComplete }) {
  const { token } = useContext(AuthContext);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(null);
  const [validCardNumber, setValidCardNumber] = useState(null);
  // Create a transaction and simulate its payment.
  const handleCheckout = async () => {
    if (!token) {
      setMessage({
        type: 'error',
        text: 'You must be logged in as a client.'
      });
      return;
    }

    if (!bookingId) {
      setMessage({
        type: 'error',
        text: 'A booking ID is required.'
      });
      return;
    }

    if (!validCardNumber) {
      setMessage({
        type: 'error',
        text: 'Please enter a valid Visa or Mastercard number.'
      });
      return;
    }
    setLoading(true);
    setMessage(null);

    try {
      // Create a pending transaction for the accepted booking.
      const createResponse = await fetch('/api/transactions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ bookingId })
      });

      const createData = await createResponse.json();

      if (!createResponse.ok) {
        throw new Error(createData.error || 'Unable to create transaction.');
      }

      const transactionId = createData.transaction._id;

      // Simulate successful payment through the transaction status endpoint.
      const paymentResponse = await fetch(
        `/api/transactions/${transactionId}/status`,
        {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`
          },
          body: JSON.stringify({ status: 'paid' })
        }
      );

      const paymentData = await paymentResponse.json();

      if (!paymentResponse.ok) {
        throw new Error(
          paymentData.error || 'Transaction created, but payment confirmation failed.'
        );
      }

      setMessage({
        type: 'success',
        text: 'Simulated payment successful.'
      });

      if (onPaymentComplete) {
        onPaymentComplete(paymentData.transaction);
      }
    } catch (error) {
      setMessage({
        type: 'error',
        text: error.message || 'Unable to process payment.'
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        maxWidth: '400px',
        margin: '20px auto',
        padding: '20px',
        border: '1px solid #ccc',
        borderRadius: '8px'
      }}
    >
      <h2>Simulate Checkout</h2>

      <div style={{ marginBottom: '15px' }}>
        <p><strong>Gig:</strong> {gigTitle || 'Selected gig'}</p>
        <p><strong>Total Price:</strong> R{price ?? '—'}</p>
      </div>

      <p>
        This is a simulated payment for an accepted booking.
        No real card details or payment are processed.
      </p>

      {message && (
        <div
          role="status"
          style={{
            margin: '10px 0',
            color: message.type === 'error' ? 'red' : 'green'
          }}
        >
          {message.text}
        </div>
      )}

      <CardInput
        onValidCard={(cardNumber) => setValidCardNumber(cardNumber)}
      />

      <button
        type="button"
        onClick={handleCheckout}
        disabled={loading || !bookingId || !validCardNumber}
        style={{
          width: '100%',
          padding: '10px',
          marginTop: '15px',
          backgroundColor: loading ? '#ccc' : '#007bff',
          color: '#fff',
          border: 'none',
          borderRadius: '4px',
          cursor: loading || !bookingId || !validCardNumber
            ? 'not-allowed'
            : 'pointer'
        }}
      >
        {loading ? 'Processing...' : 'Simulate Payment'}
      </button>
    </div>
  );
}