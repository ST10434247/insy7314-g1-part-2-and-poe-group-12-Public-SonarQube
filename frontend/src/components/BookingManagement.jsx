import React, { useContext, useEffect, useState } from 'react';
import { AuthContext } from '../context/AuthContext';

const getBookingStatusLabel = (status) => {
  const labels = {
    pending: 'Pending - Waiting for your response.',
    accepted: 'Accepted - Work in progress.',
    rejected: 'Rejected',
    cancelled: 'Cancelled',
    awaiting_confirmation: 'Awaiting client confirmation',
    completed: 'Completed',
    disputed: 'Disputed - Review by Admin required. '
  };

  return labels[status] || status.replaceAll('_', ' ');
};

export default function BookingManagement() {
  const { token, user } = useContext(AuthContext);

  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(false);
  const [updatingId, setUpdatingId] = useState(null);
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
      loadBookings().catch((err) => {
        setError(err.message || 'Unable to load bookings.');
        setLoading(false);
      });
    }
  }, [user, token]);

  // Update a booking's status through the backend.
  const updateBooking = async (bookingId, status) => {
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

      // Reload to display the latest booking status.
      await loadBookings();
    } catch (err) {
      setError(err.message || 'Unable to update booking.');
    } finally {
      setUpdatingId(null);
    }
  };

  // Escalate a disputed booking for administrator review.
  const requestAdminReview = async (bookingId) => {
    setUpdatingId(bookingId);
    setError('');

    try {
      const response = await fetch(
        `/api/bookings/${bookingId}/request-review`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Unable to request admin review.');
      }

      await loadBookings();
    } catch (err) {
      setError(err.message || 'Unable to request admin review.');
    } finally {
      setUpdatingId(null);
    }
  };

  // This component is only visible to freelancers.
  if (user?.role !== 'freelancer') {
    return null;
  }

  return (
    <section className="booking-management">
      <h2>Booking Requests</h2>

      <button onClick={loadBookings} disabled={loading || !!updatingId}>
        {loading ? 'Loading...' : 'Refresh Bookings'}
      </button>

      {error && (
        <p role="alert" style={{ color: 'red' }}>
          {error}
        </p>
      )}

      {!loading && bookings.length === 0 && !error && (
        <p>No booking requests found.</p>
      )}

      <div className="booking-list">
        {bookings.map((booking) => (
          <div className="booking-card" key={booking._id}>
            <h3>{booking.gig?.title || 'Gig'}</h3>

            <p>
              Client:{' '}
              {booking.client?.name || booking.client?.email || 'Unknown'}
            </p>

            <p>Price: R{booking.price}</p>
            <p>Status: {getBookingStatusLabel(booking.status)}</p>

            {booking.requirements && (
              <p>Requirements: {booking.requirements}</p>
            )}

            {booking.status === 'pending' && (
              <div>
                <button
                  onClick={() => updateBooking(booking._id, 'accepted')}
                  disabled={updatingId === booking._id}
                >
                  Accept
                </button>

                <button
                  onClick={() => updateBooking(booking._id, 'rejected')}
                  disabled={updatingId === booking._id}
                >
                  Reject
                </button>
              </div>
            )}

            {booking.status === 'accepted' && (
              <div>
                <button
                  onClick={() =>
                    updateBooking(booking._id, 'awaiting_confirmation')
                  }
                  disabled={updatingId === booking._id}
                >
                  Submit Work for Confirmation
                </button>
              </div>
            )}

            {booking.status === 'disputed' && (
              <div>
                {booking.adminReviewRequested ? (
                  <p>Admin review has been requested.</p>
                ) : (
                  <button
                    onClick={() => requestAdminReview(booking._id)}
                    disabled={updatingId === booking._id}
                  >
                    Request Admin Review
                  </button>
                )}
              </div>
            )}
          </div>
        ))}
      </div>
    </section>
  );
}