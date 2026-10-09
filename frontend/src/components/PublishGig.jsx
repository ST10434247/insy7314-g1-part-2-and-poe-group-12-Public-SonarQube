import React, { useState, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';

export default function PublishGig({ onGigPublished }) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('');
  const [price, setPrice] = useState('');
  const [deliveryDays, setDeliveryDays] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  const { token } = useContext(AuthContext);

  const handleSubmit = async (e) => {
    e.preventDefault();

    setError('');
    setSuccess('');

    if (!token) {
      setError('Your session has expired. Please log in again.');
      return; 
    }

    const trimmedTitle = title.trim();
    const trimmedDescription = description.trim();
    const trimmedCategory = category.trim();

    // Frontend Validation checks the user input before the gig is sent to the backend.

    if (!trimmedTitle || !deliveryDays || !trimmedDescription || !trimmedCategory || !price) {
      setError('Please complete all the needed fields before publishing your gig. ');
      return;
    }

    if (trimmedTitle.length <5 ) {
      setError('Gig title must be at least 5 characters.');
      return;
    }

    if (trimmedDescription.length <20 ) {
      setError('Gig description must be at least 20 characters.');
      return;
    }

    const numericPrice = Number(price);
    const numericDeliveryDays = Number(deliveryDays);

    if (!Number.isFinite(numericPrice) || numericPrice < 0.01){
      setError('Please enter a valid price greater than R0.00');
      return;
    }

    if (
      !Number.isInteger(numericDeliveryDays) ||
      numericDeliveryDays < 1 ||
      numericDeliveryDays > 365
    ) {
      setError('Delivery days must be a whole number between 1 and 365. ');
      return;
    }

    setLoading(true);

    try {
      const res = await fetch('/api/gigs', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          title: trimmedTitle,
          description: trimmedDescription,
          category: trimmedCategory,
          price: numericPrice,
          deliveryDays: numericDeliveryDays
        })
      });

      const data = await res.json();

      if (res.ok) {
        setSuccess('Gig published successfully!');

        setTitle('');
        setDescription('');
        setCategory('');
        setPrice('');
        setDeliveryDays('');

        if (onGigPublished) {
          // Pass the actual gig, rather than the full API response.
          onGigPublished(data.gig || data);
        }
      } else {
        const validationMessage = data.errors?.length
        ? data.errors.map((item) => item.msg).join(' ')
        : data.message || 'Unable to publish gig. ';

        setError(validationMessage);
      }
    } catch (err) {
      console.error('Network Error:', err);
      setError('Could not connect to the backend server.');
    } finally{
      setLoading(false);
    }
  };

  return (
    <div className="publish-section">
      <h3>Create a New Gig Listing</h3>

      {error && (
        <div className='form-error' role="alert">
          {error}
        </div>
      )}

      {success && (
        <div className='form-success' role="alert">
          {success}
        </div>
      )}
      
      <form onSubmit={handleSubmit} className="publish-form">
        <input
          type="text"
          placeholder="Gig Title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          maxLength={100}
          required
        />

        <textarea
          placeholder="Gig Description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          maxLength={2000}
          required
        />

        <input
          type="text"
          placeholder="Category"
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          maxLength={50}
          required
        />

        <input
          type="number"
          placeholder="Price (R)"
          value={price}
          onChange={(e) => setPrice(e.target.value)}
          min="0.01"
          step="0.01"
          required
        />

        <input
          type="number"
          placeholder="Delivery Days"
          value={deliveryDays}
          onChange={(e) => setDeliveryDays(e.target.value)}
          min="1"
          max="365"
          step="1"
          required
        />

        <button type="submit" disabled={loading}>
          {loading? 'Publishing ... ' : 'Publish Gig'}
        </button>
      </form>
    </div>
  );
}