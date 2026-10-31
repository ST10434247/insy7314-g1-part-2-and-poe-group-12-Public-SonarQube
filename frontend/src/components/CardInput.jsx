
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

    let sum = 0;
    let shouldDouble = false;

    for (let i = sanitized.length - 1; i >= 0; i--) {
      let digit = Number.parseInt(sanitized.charAt(i), 10);

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

    // Allow digits only and limit the number to 19 digits.
    const sanitized = val.replace(/\D/g, '').slice(0, 19);
    setCardNumber(sanitized);

    let brand = 'Unknown';

    if (/^4/.test(sanitized)) {
      brand = 'Visa';
    } else if (/^(5[1-5]|2[2-7])/.test(sanitized)) {
      brand = 'Mastercard';
    }

    setCardType(brand);

    if (sanitized.length === 0) {
      setIsValid(null);
      onValidCard(null);
      return;
    }

    const accepted = validateLuhn(sanitized) && brand !== 'Unknown';

    setIsValid(accepted);
    onValidCard(accepted ? sanitized : null);
  };

  return (
    <div className="card-input-box">
      <label
        htmlFor="payment-card-number"
        style={{
          display: 'block',
          marginBottom: '8px',
          fontWeight: 'bold'
        }}
      >
        Payment Card Details
      </label>

      <input
        id="payment-card-number"
        type="text"
        inputMode="numeric"
        autoComplete="off"
        maxLength={19}
        value={cardNumber}
        onChange={handleChange}
        placeholder="4000000000000002"
        aria-invalid={isValid === false}
        aria-describedby="card-status"
        style={{
          width: '100%',
          boxSizing: 'border-box'
        }}
      />

      <div className="card-status-row" id="card-status">
        <span>
          Brand: <strong>{cardType}</strong>
        </span>

        {isValid !== null && (
          <span className={isValid ? 'valid-status' : 'invalid-status'}>
            {isValid
              ? '✓ Valid Card Number'
              : '✗ Invalid Card Number'}
          </span>
        )}
      </div>
    </div>
  );
}