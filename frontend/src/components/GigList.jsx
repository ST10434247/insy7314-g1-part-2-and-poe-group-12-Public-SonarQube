import React, { useEffect, useState, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import PublishGig from './PublishGig';

export default function GigList() {
  const [gigs, setGigs] = useState([]);
  const [selectedGig, setSelectedGig] = useState(null);
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
    }
  };

  loadGigs();
}, []);

  const handleGigPublished = (newGig) => {
    setGigs((prevGigs) => [newGig, ...prevGigs]);
  };


const handleBooking = async () => {
  try {
    const res = await fetch('/api/bookings', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({
        gigId: selectedGig._id
      })
    });

    const data = await res.json();

    if (!res.ok) {
      throw new Error(data.error || 'Booking failed.');
    }

    alert('Booking request submitted. Waiting for freelancer acceptance.');
    setSelectedGig(null);
  } catch (error) {
    console.error('Booking error:', error);
    alert(error.message || 'Unable to submit booking.');
  }
};

  return (
    <div>
      {user?.role === 'freelancer' && (
        <PublishGig onGigPublished={handleGigPublished} />
      )}

      <h2 className="section-title">Explore Services</h2>
      <div className="gig-grid">
        {gigs.map((gig) => (
          <div key={gig._id} className="gig-card">
            <div>
              <h3>{gig.title}</h3>
              <p>{gig.description}</p>
            </div>
            <div className="gig-card-footer">
              <p className="gig-price">${gig.price}</p>
              {user?.role === 'client' && (
                <button onClick={() => setSelectedGig(gig)}>Book Service</button>
              )}
              {!user && <small className="login-prompt">Log in to book</small>}
            </div>
          </div>
        ))}
      </div>

      
      {selectedGig && (
        <div className="modal-overlay">
          <div className="booking-modal">
            <h3>Request Booking: {selectedGig.title}</h3>
            <p>
              Price: ${selectedGig.price}
            </p>
            <p>
              Submit this booking request to the freelancer?
              Payment will be available after acceptance.
            </p>

            <div style={{ display: 'flex', gap: '10px', marginTop: '15px' }}>
              <button
                onClick={handleBooking}
                style={{ flex: 1 }}
              >
                Submit Request
              </button>
              <button
                onClick={() => setSelectedGig(null)}
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