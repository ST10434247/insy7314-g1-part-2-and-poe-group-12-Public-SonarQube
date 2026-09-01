const express = require('express');
const router = express.Router();
const Gig = require('../models/Gig');
const { authenticateToken, authorizeRoles } = require('../middleware/auth');

// 1. READ ALL (Public: No login required to browse)
router.get('/', async (req, res) => {
  try {
    const gigs = await Gig.find().populate('freelancerId', 'email');
    res.json(gigs);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch gigs.' });
  }
});

// READ ONE (Public)
router.get('/:id', async (req, res) => {
  try {
    const gig = await Gig.findById(req.params.id).populate('freelancerId', 'email');
    if (!gig) return res.status(404).json({ error: 'Gig not found.' });
    res.json(gig);
  } catch (err) {
    res.status(500).json({ error: 'Error fetching gig details.' });
  }
});

// CREATE (Protected: Freelancers only)
router.post('/', authenticateToken, authorizeRoles('freelancer'), async (req, res) => {
  try {
    const newGig = new Gig({
      ...req.body,
      freelancerId: req.user.id
    });
    await newGig.save();
    res.status(201).json(newGig);
  } catch (err) {
    res.status(400).json({ error: 'Error creating gig.' });
  }
});

// UPDATE (Protected: Owner freelancer only)
router.put('/:id', authenticateToken, authorizeRoles('freelancer'), async (req, res) => {
  try {
    const gig = await Gig.findById(req.params.id);
    if (!gig) return res.status(404).json({ error: 'Gig not found.' });

    // Resource Ownership Check
    if (gig.freelancerId.toString() !== req.user.id) {
      return res.status(403).json({ error: 'Unauthorized: You can only update your own gigs.' });
    }

    const updatedGig = await Gig.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json(updatedGig);
  } catch (err) {
    res.status(500).json({ error: 'Error updating gig.' });
  }
});

// DELETE (Protected: Owner freelancer only)
router.delete('/:id', authenticateToken, authorizeRoles('freelancer'), async (req, res) => {
  try {
    const gig = await Gig.findById(req.params.id);
    if (!gig) return res.status(404).json({ error: 'Gig not found.' });

    // Resource Ownership Check
    if (gig.freelancerId.toString() !== req.user.id) {
      return res.status(403).json({ error: 'Unauthorized: You can only delete your own gigs.' });
    }

    await gig.deleteOne();
    res.json({ message: 'Gig deleted successfully.' });
  } catch (err) {
    res.status(500).json({ error: 'Error deleting gig.' });
  }
});

module.exports = router;