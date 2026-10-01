
import React, {
  useCallback,
  useContext,
  useEffect,
  useState
} from 'react';
import { AuthContext } from '../context/AuthContext';
import PaymentPage from './PaymentPage';

export default function ClientBookings() {
  const { token } = useContext(AuthContext);

  const [bookings, setBookings] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

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
        throw new Error(
          bookingData.error || 'Could not load bookings.'
        );
      }

      if (!transactionResponse.ok) {
        throw new Error(
          transactionData.error || 'Could not load transactions.'
        );
      }

      setBookings(bookingData.bookings || []);
      setTransactions(transactionData.transactions || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    fetchBookings();
  }, [fetchBookings]);

  const getTransaction = (bookingId) => {
    return transactions.find((transaction) => {
      const transactionBookingId =
        transaction.booking?._id || transaction.booking;

      return transactionBookingId?.toString() === bookingId.toString();
    });
  };

  if (selectedBooking) {
    return (
      <PaymentPage
        bookingId={selectedBooking._id}
        gigTitle={selectedBooking.gig?.title || 'Booking'}
        price={selectedBooking.price}
        onPaymentComplete={() => {
          setSelectedBooking(null);
          fetchBookings();
        }}
      />
    );
  }

  return (
    <section>
      <h2>My Bookings</h2>

      {loading && <p>Loading bookings...</p>}

      {error && <p role="alert">{error}</p>}

      {!loading && !error && bookings.length === 0 && (
        <p>You have not made any bookings yet.</p>
      )}

      {bookings.map((booking) => {
        const transaction = getTransaction(booking._id);
        const isPaid = transaction?.status === 'paid';

        return (
          <article key={booking._id} className="booking-card">
            <h3>{booking.gig?.title || 'Gig booking'}</h3>

            <p>Price: ${booking.price}</p>
            <p>Booking status: {booking.status}</p>

            {transaction && (
              <p>Payment status: {transaction.status}</p>
            )}

            {booking.status === 'accepted' && !isPaid && (
              <button
                onClick={() => setSelectedBooking(booking)}
                disabled={transaction?.status === 'failed'}
              >
                {transaction?.status === 'failed'
                  ? 'Payment failed'
                  : 'Pay'}
              </button>
            )}

            {isPaid && (
              <p className="valid-status">
                Payment complete
              </p>
            )}
          </article>
        );
      })}
    </section>
  );
}