import { render, screen, fireEvent } from '@testing-library/react';
import CardInput from './CardInput';

test('renders card input field', () => {
  render(<CardInput onValidCard={() => {}} />);
  const inputElement = screen.getByPlaceholderText(/4000 0000 0000 0002/i);
  expect(inputElement).toBeInTheDocument();
});

test('detects Visa brand and validates correct Luhn number', () => {
  render(<CardInput onValidCard={() => {}} />);
  const inputElement = screen.getByPlaceholderText(/4000 0000 0000 0002/i);

  // Simulate user entering a valid Visa card (4000000000000002 passes Luhn test)
  fireEvent.change(inputElement, { target: { value: '4000000000000002' } });

  expect(screen.getByText(/Brand: Visa/i)).toBeInTheDocument();
  expect(screen.getByText(/✓ Valid Card Number/i)).toBeInTheDocument();
});