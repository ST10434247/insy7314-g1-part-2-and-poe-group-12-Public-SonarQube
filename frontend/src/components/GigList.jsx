import React, { useEffect, useState, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import PublishGig from './PublishGig';

export default function GigList() {
  const [gigs, setGigs] = useState([]);
  const [loadingGigs, setLoadingGigs] = useState(true);
  const [selectedGig, setSelectedGig] = useState(null);
  const [requirements, setRequirements] = useState('');
  const [bookingError, setBookingError] = useState('');
  const [bookingSuccess, setBookingSuccess] = useState('');
  const [bookingLoading, setBookingLoading] = useState(false);
  const { token, user } = useContext(AuthContext);
  const [deletingGigId, setDeletingGigId] = useState(null);
const [gigActionError, setGigActionError] = useState('');

// Load active gigs from the backend when the marketplace opens.
useEffect(() => {
  const loadGigs = async () => {

    try {
      const response = await fetch('/api/gigs');

      // Handle unsuccessful responses instead of treating them as gig data.
      if (!response.ok) {
        throw new Error('Failed to load gigs.');
      }

      const data = await response.json();

      // The API returns an object containing a gigs array.
      setGigs(data.gigs || []);
    } catch (error) {
      console.error('Failed to load gigs:', error);
      setGigs([]);
    } finally{
      setLoadingGigs(false);
    }
  };

  loadGigs();
}, []);

  // Add the newly published gig to the current list.
  // Accept either the gig itself or the full API response.
  const handleGigPublished = (createdData) => {
    const newGig = createdData?.gig || createdData;

    // Avoid adding an invalid response as a blank card.
    if (!newGig?._id || !newGig?.title) {
      console.error('Invalid gig data returned after publishing:', createdData);
      return;
    }

    setGigs((previousGigs) => [
      newGig,
      ...previousGigs.filter((gig) => gig._id !== newGig._id)
    ]);
  };

// Delete a service through the backend.
// The backend verifies that the logged-in freelancer owns it.
const handleDeleteGig = async (gig) => {
  if (!window.confirm(
    `Are you sure you want to delete "${gig.title}"? This cannot be undone.`
  )) {
    return;
  }

  setDeletingGigId(gig._id);
  setGigActionError('');

  try {
    const response = await fetch(`/api/gigs/${gig._id}`, {
      method: 'DELETE',
      headers: {
        Authorization: `Bearer ${token}`
      }
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'Unable to delete service.');
    }

    // Remove the deleted service from the displayed list.
    setGigs((previousGigs) =>
      previousGigs.filter((item) => item._id !== gig._id)
    );
  } catch (error) {
    setGigActionError(error.message || 'Unable to delete service.');
  } finally {
    setDeletingGigId(null);
  }
};

const handleBooking = async () => {
  if (!token || !selectedGig) {
    setBookingError('Please log in and select a gig.');
    return;
  }

  // Prevent empty booking requirements form being submitted.
  if(!requirements.trim()) {
    setBookingError(
      'Please describe your project requirements before submitting the booking.'
    );
    return;
  }

  setBookingLoading(true);
  setBookingError('');

  try {
    const res = await fetch('/api/bookings', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({
        gigId: selectedGig._id,
        requirements: requirements.trim()
      })
    });

    const data = await res.json();

    if (!res.ok) {
      throw new Error(
        data.error || data.message || 'Booking failed.'
      );
    }

    setBookingSuccess('Booking request submitted successfully! The freelancer will review your request. ');
    setSelectedGig(null);
    setRequirements('');
  } catch (error) {
    setBookingError(error.message || 'Unable to submit booking.');
  } finally {
    setBookingLoading(false);
  }
};

  return (
    <div>
    {user?.role === 'freelancer' && (
      <>
        <PublishGig onGigPublished={handleGigPublished} />

        <section>
          <h2 className="section-title">My Services</h2>

          {gigActionError && (
            <p role="alert" className="error-message">
              {gigActionError}
            </p>
          )}

          {loadingGigs ? (
            <p className="gig-status">Loading your services...</p>
          ) : (
            (() => {
              const userId = String(user._id || user.id || '');

              const myGigs = gigs.filter((gig) => {
                const owner = gig.freelancer;
                const ownerId =
                  typeof owner === 'object'
                    ? owner?._id || owner?.id
                    : owner;

                return String(ownerId || '') === userId && userId !== '';
              });

              if (myGigs.length === 0) {
                return (
                  <p className="gig-status">
                    You have no active services published.
                  </p>
                );
              }

              return (
                <div className="gig-grid">
                  {myGigs.map((gig) => (
                    <article key={gig._id} className="gig-card">
                      <div>
                        <h3>{gig.title}</h3>
                        <p>{gig.description}</p>
                      </div>

                      <div className="gig-card-footer">
                        <p className="gig-price">R{gig.price}</p>

                        <button
                          type="button"
                          onClick={() => handleDeleteGig(gig)}
                          disabled={deletingGigId === gig._id}
                        >
                          {deletingGigId === gig._id
                            ? 'Deleting...'
                            : 'Delete Service'}
                        </button>
                      </div>
                    </article>
                  ))}
                </div>
              );
            })()
          )}
        </section>
      </>
    )}

      {user?.role !== 'freelancer' && (
        <>

      <h2 className="section-title">Explore Services</h2>
      
      {loadingGigs ? (
        <p className="gig-status">Loading available gig services...</p>
      ) : gigs.length === 0 ? (
        <p className="gig-status">
          No services are currently available.
        </p>
      ) : (
      <div className="gig-grid">
        {gigs.map((gig) => (
          <div key={gig._id} className="gig-card">
            <div>
              <h3>{gig.title}</h3>
              <p>{gig.description}</p>
            </div>

            <div className="gig-card-footer">
              <p className="gig-price">R{gig.price}</p>

              {user?.role === 'client' && (
                <button
                  onClick={() => {
                    setSelectedGig(gig);
                    setRequirements('');
                    setBookingError('');
                    setBookingSuccess('');
                  }}
                >
                  Book Service
                </button>
              )}

              {!user && (
              <small className="login-prompt">
                Log in to book
              </small>
              )}
            </div>
          </div>
        ))}
      </div>
      )}
    </>
  )}

  {bookingSuccess && (
    <div className="booking-success" role="status">
      {bookingSuccess}
    </div>
  )}
      
      {selectedGig && (
        <div className="modal-overlay">
          <div className="booking-modal">
            <h3>Request Booking: {selectedGig.title}</h3>
            <p>
              Price: R{selectedGig.price}
            </p>
            <p>
              Submit this booking request to the freelancer?
              Payment will be available after acceptance.
            </p>
            <label htmlFor="booking-requirements">
              Project requirements
            </label>

            <textarea
              id="booking-requirements"
              value={requirements}
              onChange={(e) => setRequirements(e.target.value)}
              maxLength={2000}
              rows={4}
              placeholder="Describe what you need from the freelancer..."
              style={{ width: '100%', marginTop: '8px' }}
            />

            <small>{requirements.length}/2000 characters</small>

            {bookingError && (
              <p role="alert" style={{ color: 'red' }}>
                {bookingError}
              </p>
            )}
            <div style={{ display: 'flex', gap: '10px', marginTop: '15px' }}>
              <button
                onClick={handleBooking}
                disabled={bookingLoading}
                style={{ flex: 1 }}
              >
                {bookingLoading ? 'Submitting...' : 'Submit Request'}
              </button>

              <button
                onClick={() => {
                  setSelectedGig(null);
                  setRequirements('');
                  setBookingError('');
                  setBookingSuccess('');
                }}
                disabled={bookingLoading}
                style={{ background: '#e4e6eb', color: '#001e00' }}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}