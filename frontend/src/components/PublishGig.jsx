import React, { useState, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';

export default function PublishGig({ onGigPublished }) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  const { token } = useContext(AuthContext);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title || !description || !price) {
      return alert('Please fill in all fields');
    }

    const res = await fetch('/api/gigs', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({ title, description, price: Number(price) })
    });

    if (res.ok) {
      const newGig = await res.json();
      alert('Gig published successfully!');
      setTitle('');
      setDescription('');
      setPrice('');
      if (onGigPublished) {
        onGigPublished(newGig);
      }
    } else {
      alert('Failed to publish gig.');
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
          placeholder="Price ($)" 
          value={price} 
          onChange={(e) => setPrice(e.target.value)} 
        />
        <button type="submit">Publish Gig</button>
      </form>
    </div>
  );
}