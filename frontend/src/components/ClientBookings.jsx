import React, {
  useCallback,
  useContext,
  useEffect,
  useState
} from 'react';
import { AuthContext } from '../context/AuthContext';
import PaymentPage from './PaymentPage';

const getBookingStatusLabel = (status) => {
  const labels = {
    pending: 'Pending - waiting for freelancer acceptance',
    accepted: 'Accepted - Payment available',
    rejected: 'Rejected',
    cancelled: 'Cancelled',
    awaiting_confirmation: 'Awaiting confirmation from you.',
    completed: 'Completed',
    disputed: 'Disputed - Currently being reviewed. '
  };

  return labels[status] || status.replaceAll('_', ' ');
};

export default function ClientBookings() {
  const { token } = useContext(AuthContext);

  const [bookings, setBookings] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState(null);
  const [error, setError] = useState('');

  // Retrieve the client's bookings and transactions.
  const fetchBookings = useCallback(async () => {
    if (!token) {
      setBookings([]);
      setTransactions([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError('');

    try {
      const [bookingResponse, transactionResponse] = await Promise.all([
        fetch('/api/bookings', {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }),
        fetch('/api/transactions', {
          headers: {
            Authorization: `Bearer ${token}`
          }
        })
      ]);

      const bookingData = await bookingResponse.json();
      const transactionData = await transactionResponse.json();

      if (!bookingResponse.ok) {
        throw new Error(bookingData.error || 'Could not load bookings.');
      }

      if (!transactionResponse.ok) {
        throw new Error(
          transactionData.error || 'Could not load transactions.'
        );
      }

      setBookings(bookingData.bookings || []);
      setTransactions(transactionData.transactions || []);
    } catch (err) {
      setError(err.message || 'Could not load bookings.');
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    fetchBookings();
  }, [fetchBookings]);

  // Find the transaction associated with a booking.
  const getTransaction = (bookingId) => {
    return transactions.find((transaction) => {
      const transactionBookingId =
        transaction.booking?._id || transaction.booking;

      return transactionBookingId?.toString() === bookingId.toString();
    });
  };

  // Update a booking's status through the backend.
  const updateBooking = async (bookingId, status) => {
    const actionLabels = {
      completed: 'confirm this booking as completed',
      disputed: 'raise a dispute for this booking',
      cancelled: 'cancel this booking'
    };

    if (!window.confirm(`Are you sure you want to ${actionLabels[status]}?`)) {
      return;
    }

    setUpdatingId(bookingId);
    setError('');

    try {
      const response = await fetch(`/api/bookings/${bookingId}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ status })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Unable to update booking.');
      }

      await fetchBookings();
    } catch (err) {
      setError(err.message || 'Unable to update booking.');
    } finally {
      setUpdatingId(null);
    }
  };

  // Return to the booking list after simulated payment.
  const handlePaymentComplete = () => {
    setSelectedBooking(null);
    fetchBookings();
  };

  if (selectedBooking) {
    return (
      <PaymentPage
        bookingId={selectedBooking._id}
        gigTitle={selectedBooking.gig?.title || 'Booking'}
        price={selectedBooking.price}
        onPaymentComplete={handlePaymentComplete}
      />
    );
  }

  return (
    <section className="client-bookings">
      <h2>My Bookings</h2>

      <button onClick={fetchBookings} disabled={loading || !!updatingId}>
        {loading ? 'Loading...' : 'Refresh Bookings'}
      </button>

      {error && (
        <p role="alert" className="error-message">
          {error}
        </p>
      )}

      {loading && <p>Loading bookings...</p>}

      {!loading && !error && bookings.length === 0 && (
        <p>You have not made any bookings yet.</p>
      )}

      <div className="booking-list">
        {bookings.map((booking) => {
          const transaction = getTransaction(booking._id);
          const isPaid = transaction?.status === 'paid';
          const isUpdating = updatingId === booking._id;

          return (
            <article key={booking._id} className="booking-card">
              <h3>{booking.gig?.title || 'Gig booking'}</h3>

              <p>Price: R{booking.price}</p>

              <p>
                Booking status: {getBookingStatusLabel(booking.status)}
              </p>

              {transaction && (
                <p>Payment status: {transaction.status}</p>
              )}

              {booking.status === 'accepted' && !isPaid && (
                <button
                  onClick={() => setSelectedBooking(booking)}
                  disabled={transaction?.status === 'failed' || isUpdating}
                >
                  {transaction?.status === 'failed'
                    ? 'Payment failed'
                    : 'Pay'}
                </button>
              )}

              {isPaid && (
                <p className="valid-status">Payment complete</p>
              )}

              {booking.status === 'pending' && (
                <button
                  onClick={() => updateBooking(booking._id, 'cancelled')}
                  disabled={isUpdating}
                >
                  Cancel Booking
                </button>
              )}

              {booking.status === 'accepted' && (
                <button
                  onClick={() => updateBooking(booking._id, 'cancelled')}
                  disabled={isUpdating}
                >
                  Cancel Booking
                </button>
              )}

              {booking.status === 'awaiting_confirmation' && (
                <div className="booking-actions">
                  <button
                    onClick={() => updateBooking(booking._id, 'completed')}
                    disabled={isUpdating}
                  >
                    Confirm Completion
                  </button>

                  <button
                    onClick={() => updateBooking(booking._id, 'disputed')}
                    disabled={isUpdating}
                  >
                    Raise Dispute
                  </button>
                </div>
              )}

              {booking.status === 'disputed' && (
                <div className="booking-actions">
                  <p className="dispute-status">
                    This booking is disputed.
                  </p>

                  <button
                    onClick={() => updateBooking(booking._id, 'completed')}
                    disabled={isUpdating}
                  >
                    Withdraw Dispute and Confirm
                  </button>
                </div>
              )}

              {booking.status === 'completed' && (
                <p className="valid-status">Booking completed</p>
              )}

              {booking.status === 'cancelled' && (
                <p>Booking cancelled</p>
              )}

              {booking.status === 'rejected' && (
                <p>Booking rejected</p>
              )}
            </article>
          );
        })}
      </div>
    </section>
  );
}