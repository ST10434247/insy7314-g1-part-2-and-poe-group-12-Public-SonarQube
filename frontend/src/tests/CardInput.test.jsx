import { render, screen, fireEvent } from '@testing-library/react';
import CardInput from '../components/CardInput';

// Ensure card input field shoes correctly.

test('renders card input field', () => {
  render(<CardInput onValidCard={() => {}} />);
  const inputElement = screen.getByPlaceholderText(/4000000000000002/i);
  expect(inputElement).toBeTruthy();
});

test('detects Visa brand and validates correct Luhn number', () => {
  render(<CardInput onValidCard={() => {}} />);
  const inputElement = screen.getByPlaceholderText(/4000000000000002/i);

  // Simulate user entering a valid Visa card (4000000000000002 passes Luhn test)
  fireEvent.change(inputElement, { target: { value: '4000000000000002' } });

  expect(screen.getByText('Visa')).toBeTruthy();
  expect(screen.getByText(/Valid Card Number/i)).toBeTruthy();
});

// (Borenkraout, M.,  2024)
// Luhn algorithm = well know test/algorithm testing if card is valid.