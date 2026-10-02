import React, { useContext, useEffect, useState } from 'react';
import { AuthContext } from '../context/AuthContext';

const API_URL = '/api/admin/disputes';

function AdminDisputes() {
  const { token } = useContext(AuthContext);

  const [disputes, setDisputes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [resolvingId, setResolvingId] = useState(null);

  // Retrieve disputes that have been escalated for admin review.
  const fetchDisputes = async () => {
    setLoading(true);
    setError('');

    try {
      const response = await fetch(API_URL, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Unable to retrieve disputes.');
      }

      setDisputes(data.disputes || []);
    } catch (err) {
      setError(err.message || 'Unable to retrieve disputes.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (token) {
      fetchDisputes();
    }
  }, [token]);

  // Resolve a dispute using one of the permitted final or reopening statuses.
  const resolveDispute = async (bookingId, status) => {
    const actionLabels = {
      completed: 'mark this booking as completed',
      accepted: 'reopen this booking',
      cancelled: 'cancel this booking'
    };

    if (!window.confirm(`Are you sure you want to ${actionLabels[status]}?`)) {
      return;
    }

    setResolvingId(bookingId);
    setError('');

    try {
      const response = await fetch(`${API_URL}/${bookingId}/resolve`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ status })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Unable to resolve dispute.');
      }

      // Remove the resolved dispute from the pending review list.
      setDisputes((current) =>
        current.filter((booking) => booking._id !== bookingId)
      );
    } catch (err) {
      setError(err.message || 'Unable to resolve dispute.');
    } finally {
      setResolvingId(null);
    }
  };

  return (
    <section className="admin-disputes">
      <h2>Admin Dispute Review</h2>
      <p>Review bookings escalated by freelancers.</p>

      {error && (
        <p role="alert" className="error-message">
          {error}
        </p>
      )}

      {loading ? (
        <p>Loading disputes...</p>
      ) : disputes.length === 0 ? (
        <p>No disputes are currently awaiting review.</p>
      ) : (
        <div className="dispute-list">
          {disputes.map((booking) => (
            <article className="dispute-card" key={booking._id}>
              <h3>{booking.gig?.title || 'Unknown gig'}</h3>

              <p>
                <strong>Category:</strong>{' '}
                {booking.gig?.category || 'Not specified'}
              </p>

              <p>
                <strong>Client:</strong>{' '}
                {booking.client?.email || 'Unknown'}
              </p>

              <p>
                <strong>Freelancer:</strong>{' '}
                {booking.freelancer?.email || 'Unknown'}
              </p>

              <p>
                <strong>Price:</strong> R{booking.price}
              </p>

              <p>
                <strong>Requirements:</strong>{' '}
                {booking.requirements || 'None provided'}
              </p>

              <p>
                <strong>Review requested:</strong>{' '}
                {booking.adminReviewRequestedAt
                  ? new Date(booking.adminReviewRequestedAt).toLocaleString()
                  : 'Unknown'}
              </p>

              <div className="dispute-actions">
                <button
                  onClick={() => resolveDispute(booking._id, 'completed')}
                  disabled={resolvingId === booking._id}
                >
                  Mark Completed
                </button>

                <button
                  onClick={() => resolveDispute(booking._id, 'accepted')}
                  disabled={resolvingId === booking._id}
                >
                  Reopen Booking
                </button>

                <button
                  onClick={() => resolveDispute(booking._id, 'cancelled')}
                  disabled={resolvingId === booking._id}
                >
                  Cancel Booking
                </button>
              </div>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}

export default AdminDisputes;