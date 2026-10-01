
import React, { useContext, useEffect, useState } from 'react';
import { AuthContext } from '../context/AuthContext';

export default function BookingManagement() {
  const { token, user } = useContext(AuthContext);
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Load bookings belonging to the logged-in freelancer.
  const loadBookings = async () => {
    setLoading(true);
    setError('');

    try {
      const response = await fetch('/api/bookings', {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Unable to load bookings.');
      }

      setBookings(data.bookings || []);
    } catch (err) {
      setError(err.message || 'Unable to load bookings.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user?.role === 'freelancer' && token) {
      loadBookings();
    }
  }, [user, token]);

  // Accept or reject a pending booking.
  const updateBooking = async (bookingId, status) => {
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

      // Reload to display the latest booking status.
      await loadBookings();
    } catch (err) {
      setError(err.message || 'Unable to update booking.');
    }
  };

  // This component is only visible to freelancers.
  if (user?.role !== 'freelancer') {
    return null;
  }

  return (
    <section className="booking-management">
      <h2>Booking Requests</h2>

      <button onClick={loadBookings} disabled={loading}>
        {loading ? 'Loading...' : 'Refresh Bookings'}
      </button>

      {error && <p role="alert" style={{ color: 'red' }}>{error}</p>}

      {!loading && bookings.length === 0 && !error && (
        <p>No booking requests found.</p>
      )}

      <div className="booking-list">
        {bookings.map((booking) => (
          <div className="booking-card" key={booking._id}>
            <h3>{booking.gig?.title || 'Gig'}</h3>
            <p>
              Client: {booking.client?.name || booking.client?.email || 'Unknown'}
            </p>
            <p>Price: ${booking.price}</p>
            <p>Status: {booking.status}</p>

            {booking.requirements && (
              <p>Requirements: {booking.requirements}</p>
            )}

            {booking.status === 'pending' && (
              <div>
                <button
                  onClick={() => updateBooking(booking._id, 'accepted')}
                >
                  Accept
                </button>
                <button
                  onClick={() => updateBooking(booking._id, 'rejected')}
                >
                  Reject
                </button>
              </div>
            )}
          </div>
        ))}
      </div>
    </section>
  );
}