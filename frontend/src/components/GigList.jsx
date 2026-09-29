import React, { useEffect, useState, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import CardInput from './CardInput';
import PublishGig from './PublishGig';

export default function GigList() {
  const [gigs, setGigs] = useState([]);
  const [selectedGig, setSelectedGig] = useState(null);
  const [validCardNumber, setValidCardNumber] = useState(null);
  const { token, user } = useContext(AuthContext);

  useEffect(() => {
    fetch('/api/gigs')
      .then((res) => res.json())
      .then((data) => setGigs(data));
  }, []);

  const handleGigPublished = (newGig) => {
    setGigs((prevGigs) => [newGig, ...prevGigs]);
  };

  const handleBooking = async () => {
    if (!validCardNumber) {
      return alert('Please enter a valid payment card.');
    }

    const res = await fetch('/api/bookings', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({ gigId: selectedGig._id, cardNumber: validCardNumber })
    });

    if (res.ok) {
      alert('Booking confirmed successfully!');
      setSelectedGig(null);
    } else {
      alert('Booking failed.');
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
            <h3>Checkout: {selectedGig.title}</h3>
            <CardInput onValidCard={(card) => setValidCardNumber(card)} />
            <div style={{ display: 'flex', gap: '10px', marginTop: '15px' }}>
              <button 
                onClick={handleBooking} 
                disabled={!validCardNumber}
                style={{ flex: 1 }}
              >
                Confirm & Pay ${selectedGig.price}
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