import React, { useState, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';

export default function PublishGig({ onGigPublished }) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  const { token } = useContext(AuthContext);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!token) {
      return alert('Your session has expired. Please log in again.');
    }

    if (!title || !description || !price) {
      return alert('Please fill in all fields');
    }

    try {
      const res = await fetch('/api/gigs', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          title,
          description,
          price: Number(price)
        })
      });

      const data = await res.json();

      if (res.ok) {
        alert('Gig published successfully!');

        setTitle('');
        setDescription('');
        setPrice('');

        if (onGigPublished) {
          onGigPublished(data);
        }
      } else {
        alert(`Failed to publish gig: ${data.message || 'Server error'}`);
      }
    } catch (err) {
      console.error('Network Error:', err);
      alert('Could not connect to the backend server.');
    }
  };

  return (
    <div className="publish-section">
      <h3>Create a New Gig Listing</h3>

      <form onSubmit={handleSubmit} className="publish-form">
        <input
          type="text"
          placeholder="Gig Title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />

        <textarea
          placeholder="Gig Description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />

        <input
          type="number"
          placeholder="Price (R)"
          value={price}
          onChange={(e) => setPrice(e.target.value)}
        />

        <button type="submit">
          Publish Gig
        </button>
      </form>
    </div>
  );
}