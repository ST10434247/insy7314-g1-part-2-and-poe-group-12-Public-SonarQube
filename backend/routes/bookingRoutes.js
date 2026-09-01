const express = require('express');
const router = express.Router();
const Booking = require('../models/Booking');
const Gig = require('../models/Gig');
const { authenticateToken, authorizeRoles } = require('../middleware/auth');
const { validateLuhn } = require('../utils/luhn');
const calculateTax = require('../utils/taxCalculator');

// Simulated Booking Endpoint
router.post('/', authenticateToken, authorizeRoles('client'), async (req, res) => {
  try {
    const { gigId, cardNumber } = req.body;

    // Security Feature 1: Luhn Validation
    if (!validateLuhn(cardNumber)) {
      return res.status(400).json({ error: 'Invalid payment card details.' });
    }

    const gig = await Gig.findById(gigId);
    if (!gig) return res.status(404).json({ error: 'Gig not found.' });

    // Security Feature 2: Data Masking
    const last4 = cardNumber.slice(-4);
    const maskedCard = `****-****-****-${last4}`;

    const booking = new Booking({
      gigId,
      clientId: req.user.id,
      freelancerId: gig.freelancerId,
      amount: gig.price,
      maskedCard
    });

    await booking.save();
    res.status(201).json({ message: 'Booking successful!', booking });
  } catch (err) {
    res.status(500).json({ error: 'Transaction failed.' });
  }
});

// Freelancer Earnings & Tax Route
router.get('/earnings', authenticateToken, authorizeRoles('freelancer'), async (req, res) => {
  try {
    const bookings = await Booking.find({ freelancerId: req.user.id });
    const grossIncome = bookings.reduce((sum, b) => sum + b.amount, 0);
    const estimatedTax = calculateTax(grossIncome);

    res.json({
      grossIncome,
      estimatedTax,
      netIncome: grossIncome - estimatedTax,
      totalBookings: bookings.length
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to compute earnings.' });
  }
});

module.exports = router;