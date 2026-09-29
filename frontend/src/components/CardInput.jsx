import React, { useState } from 'react';

export default function CardInput({ onValidCard }) {
  const [cardNumber, setCardNumber] = useState('');
  const [cardType, setCardType] = useState('Unknown');
  const [isValid, setIsValid] = useState(null);

  const validateLuhn = (number) => {
    const sanitized = number.replace(/\D/g, '');
    if (sanitized.length < 13 || sanitized.length > 19) {
      return false;
    }
    
    let sum = 0, shouldDouble = false;
    for (let i = sanitized.length - 1; i >= 0; i--) {
      let digit = parseInt(sanitized.charAt(i), 10);
      if (shouldDouble) {
        digit *= 2;
        if (digit > 9) {
          digit -= 9;
        }
      }
      sum += digit;
      shouldDouble = !shouldDouble;
    }
    return sum % 10 === 0;
  };

  const handleChange = (e) => {
    const val = e.target.value.replace(/\s+/g, '');
    setCardNumber(val);

    if (/^4/.test(val)) {
      setCardType('Visa');
    } else if (/^(5[1-5]|2[2-7])/.test(val)) {
      setCardType('Mastercard');
    } else {
      setCardType('Unknown');
    }

    const valid = validateLuhn(val);
    setIsValid(valid);
    onValidCard(valid ? val : null);
  };

  return (
    <div className="card-input-box">
      <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold' }}>
        Payment Card Details
      </label>
      <input
        type="text"
        maxLength="19"
        value={cardNumber}
        onChange={handleChange}
        placeholder="4000 0000 0000 0002"
        style={{ width: '100%', boxSizing: 'border-box' }}
      />
      <div className="card-status-row">
        <span>Brand: <strong>{cardType}</strong></span>
        {isValid !== null && (
          <span className={isValid ? 'valid-status' : 'invalid-status'}>
            {isValid ? '✓ Valid Card' : '✗ Invalid Card Number'}
          </span>
        )}
      </div>
    </div>
  );
}