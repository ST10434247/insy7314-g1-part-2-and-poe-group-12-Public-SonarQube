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

  const handleGigPublished = (newGig) => {
    setGigs((prevGigs) => [newGig, ...prevGigs]);
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
        <PublishGig onGigPublished={handleGigPublished} />
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