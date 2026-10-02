const express = require('express');
const mongoose = require('mongoose');

const Booking = require('../models/Booking');
const { authenticateToken, authorizeRoles } = require('../middleware/auth');

const router = express.Router();

// These are the only outcomes an admin can assign to a disputed booking.
const RESOLUTION_STATUSES = [
    'completed',
    'accepted',
    'cancelled'
];

/*
 * GET /api/admin/disputes
 *
 * Returns disputed bookings that have been escalated for admin review.
 * Only administrators may access this endpoint.
 */
router.get(
    '/disputes',
    authenticateToken,
    authorizeRoles('admin'),
    async (req, res) => {
        try {
            const disputes = await Booking.find({
                status: 'disputed',
                adminReviewRequested: true
            })
                .populate('gig', 'title category')
                .populate('client', 'email')
                .populate('freelancer', 'email')
                .sort({ adminReviewRequestedAt: 1 });

            return res.status(200).json({ disputes });
        } catch (error) {
            console.error('Get admin disputes error:', error);

            return res.status(500).json({
                error: 'Unable to retrieve disputes.'
            });
        }
    }
);

/*
 * PATCH /api/admin/disputes/:id/resolve
 *
 * Allows an administrator to resolve an escalated dispute.
 *
 * completed = work is accepted and the booking is completed.
 * accepted  = dispute is rejected and the booking is reopened.
 * cancelled = booking is cancelled.
 */
router.patch(
    '/disputes/:id/resolve',
    authenticateToken,
    authorizeRoles('admin'),
    async (req, res) => {
        try {
            const { id } = req.params;
            const { status } = req.body;

            // Validate the booking ID before querying MongoDB.
            if (!mongoose.isValidObjectId(id)) {
                return res.status(400).json({
                    error: 'Invalid booking ID.'
                });
            }

            // Only the three defined resolution outcomes are permitted.
            if (!RESOLUTION_STATUSES.includes(status)) {
                return res.status(400).json({
                    error: 'A valid resolution status is required.'
                });
            }

            const booking = await Booking.findById(id);

            if (!booking) {
                return res.status(404).json({
                    error: 'Booking not found.'
                });
            }

            // An admin may only resolve an active disputed booking
            // that has actually been escalated for review.
            if (
                booking.status !== 'disputed' ||
                !booking.adminReviewRequested
            ) {
                return res.status(400).json({
                    error: 'This booking is not awaiting admin review.'
                });
            }

            booking.status = status;

            // The dispute has now been resolved, so it should no longer
            // appear in the list of pending admin disputes.
            booking.adminReviewRequested = false;
            booking.adminReviewRequestedAt = null;

            await booking.save();

            return res.status(200).json({
                message: 'Dispute resolved successfully.',
                booking
            });
        } catch (error) {
            console.error('Resolve admin dispute error:', error);

            return res.status(500).json({
                error: 'Unable to resolve dispute.'
            });
        }
    }
);

module.exports = router;