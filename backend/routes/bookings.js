const express = require('express');
const mongoose = require('mongoose');

const Booking = require('../models/Booking');
const Gig = require('../models/Gig');
const { authenticateToken, authorizeRoles } = require('../middleware/auth');

const router = express.Router();

// Only these statuses can be requested through the status endpoint.
const ALLOWED_STATUSES = [
    'accepted',
    'rejected',
    'cancelled',
    'awaiting_confirmation',
    'completed',
    'disputed'
];

/*
 * POST /api/bookings
 *
 * A client books an active gig.
 * The server determines the freelancer and price from the gig document.
 * This prevents clients from changing the booking's price or assigning
 * the booking to a different freelancer.
 */
router.post(
    '/',
    authenticateToken,
    authorizeRoles('client'),
    async (req, res) => {
        try {
            const { gigId, requirements = '' } = req.body;

            // Validate the gig ID before querying MongoDB.
            if (!mongoose.isValidObjectId(gigId)) {
                return res.status(400).json({
                    error: 'A valid gigId is required.'
                });
            }

            // Requirements are optional, but must be a string of reasonable length.
            if (
                typeof requirements !== 'string' ||
                requirements.length > 2000
            ) {
                return res.status(400).json({
                    error: 'Requirements must be text of at most 2000 characters.'
                });
            }

            // Only active gigs can receive new bookings.
            const gig = await Gig.findOne({
                _id: gigId,
                status: 'active'
            });

            if (!gig) {
                return res.status(404).json({
                    error: 'Active gig not found.'
                });
            }

            // A freelancer cannot book their own gig using a client account.
            if (gig.freelancer.toString() === req.user.id) {
                return res.status(403).json({
                    error: 'You cannot book your own gig.'
                });
            }

            // Prevent duplicate pending or accepted bookings for the same gig.
            const existingBooking = await Booking.findOne({
                gig: gig._id,
                client: req.user.id,
                status: { $in: ['pending', 'accepted'] }
            });

            if (existingBooking) {
                return res.status(409).json({
                    error: 'You already have an active booking for this gig.'
                });
            }
            // Create a booking using trusted values from the gig and token.
            const booking = await Booking.create({
                gig: gig._id,
                client: req.user.id,
                freelancer: gig.freelancer,
                price: gig.price,
                requirements: requirements.trim()
            });

            return res.status(201).json({
                message: 'Booking created successfully.',
                booking
            });
        } catch (error) {
            console.error('Create booking error:', error);

            return res.status(500).json({
                error: 'Unable to create booking.'
            });
        }
    }
);

/*
 * GET /api/bookings
 *
 * Clients see bookings they created.
 * Freelancers see bookings for their gigs.
 * The query is scoped to the authenticated user's ID.
 */
router.get(
    '/',
    authenticateToken,
    authorizeRoles('client', 'freelancer'),
    async (req, res) => {
        try {
            const userFilter =
                req.user.role === 'client'
                    ? { client: req.user.id }
                    : { freelancer: req.user.id };

            const bookings = await Booking.find(userFilter)
                .populate('gig', 'title category')
                .populate('client', 'name email')
                .populate('freelancer', 'name email')
                .sort({ createdAt: -1 });

            return res.status(200).json({ bookings });
        } catch (error) {
            console.error('Get bookings error:', error);

            return res.status(500).json({
                error: 'Unable to retrieve bookings.'
            });
        }
    }
);

/*
 * GET /api/bookings/:id
 *
 * A booking can only be viewed by its client or freelancer.
 * Returning 404 for unrelated users avoids revealing whether a booking exists.
 */
router.get(
    '/:id',
    authenticateToken,
    authorizeRoles('client', 'freelancer'),
    async (req, res) => {
        try {
            const { id } = req.params;

            if (!mongoose.isValidObjectId(id)) {
                return res.status(400).json({
                    error: 'Invalid booking ID.'
                });
            }

            const booking = await Booking.findById(id)
                .populate('gig', 'title category')
                .populate('client', 'name email')
                .populate('freelancer', 'name email');

            if (!booking) {
                return res.status(404).json({
                    error: 'Booking not found.'
                });
            }

            // Check whether the authenticated user is one of the participants.
            const isClient = booking.client._id.toString() === req.user.id;
            const isFreelancer =
                booking.freelancer._id.toString() === req.user.id;

            if (!isClient && !isFreelancer) {
                return res.status(404).json({
                    error: 'Booking not found.'
                });
            }

            return res.status(200).json({ booking });
        } catch (error) {
            console.error('Get booking error:', error);

            return res.status(500).json({
                error: 'Unable to retrieve booking.'
            });
        }
    }
);


/*
 * PATCH /api/bookings/:id/status
 *
 * Only valid status transitions are permitted.
 * The user's role and booking participation determine which transitions
 * they are allowed to make.
 *
 * Completion workflow:
 * 1. Freelancer submits completion.
 * 2. Client confirms or disputes completion.
 */
router.patch(
    '/:id/status',
    authenticateToken,
    authorizeRoles('client', 'freelancer'),
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

            // Reject missing or unsupported status values.
            if (!ALLOWED_STATUSES.includes(status)) {
                return res.status(400).json({
                    error: 'A valid status is required.'
                });
            }

            const booking = await Booking.findById(id);

            if (!booking) {
                return res.status(404).json({
                    error: 'Booking not found.'
                });
            }

            // Identify the authenticated user's relationship to the booking.
            const isClient = booking.client.toString() === req.user.id;
            const isFreelancer =
                booking.freelancer.toString() === req.user.id;

            // Only the client or freelancer involved may change the booking.
            if (!isClient && !isFreelancer) {
                return res.status(404).json({
                    error: 'Booking not found.'
                });
            }

            let permitted = false;

            // A freelancer can accept or reject a pending booking.
            if (
                booking.status === 'pending' &&
                isFreelancer &&
                ['accepted', 'rejected'].includes(status)
            ) {
                permitted = true;
            }

            // A client can cancel a booking that is still pending.
            if (
                booking.status === 'pending' &&
                isClient &&
                status === 'cancelled'
            ) {
                permitted = true;
            }

            // Either participant can cancel an accepted booking.
            if (
                booking.status === 'accepted' &&
                ['cancelled'].includes(status)
            ) {
                permitted = true;
            }

            // Only the freelancer can submit work for client confirmation.
            if (
                booking.status === 'accepted' &&
                isFreelancer &&
                status === 'awaiting_confirmation'
            ) {
                permitted = true;
            }

            // Only the client can confirm or dispute submitted work.
            if (
                booking.status === 'awaiting_confirmation' &&
                isClient &&
                ['completed', 'disputed'].includes(status)
            ) {
                permitted = true;
            }

            // A client can withdraw a dispute and confirm completion.
            if (
                booking.status === 'disputed' &&
                isClient &&
                status === 'completed'
            ) {
                permitted = true;
            }

            // Reject transitions that do not match the workflow.
            if (!permitted) {
                return res.status(403).json({
                    error: 'This status change is not permitted.'
                });
            }

            // Save the approved status transition.
            booking.status = status;
            await booking.save();

            return res.status(200).json({
                message: 'Booking status updated successfully.',
                booking
            });
        } catch (error) {
            console.error('Update booking status error:', error);

            return res.status(500).json({
                error: 'Unable to update booking status.'
            });
        }
    }
);

/*
 * POST /api/bookings/:id/request-review
 *
 * A freelancer can request admin review of a disputed booking.
 * Only one review request can be submitted per booking.
 */
router.post(
    '/:id/request-review',
    authenticateToken,
    authorizeRoles('freelancer'),
    async (req, res) => {
        try {
            const { id } = req.params;

            if (!mongoose.isValidObjectId(id)) {
                return res.status(400).json({
                    error: 'Invalid booking ID.'
                });
            }

            const booking = await Booking.findById(id);

            if (!booking) {
                return res.status(404).json({
                    error: 'Booking not found.'
                });
            }

            // Only the freelancer involved in the booking can request review.
            if (booking.freelancer.toString() !== req.user.id) {
                return res.status(404).json({
                    error: 'Booking not found.'
                });
            }

            // Admin review is only available for disputed bookings.
            if (booking.status !== 'disputed') {
                return res.status(400).json({
                    error: 'Only disputed bookings can be escalated.'
                });
            }

            // Prevent duplicate review requests.
            if (booking.adminReviewRequested) {
                return res.status(409).json({
                    error: 'Admin review has already been requested.'
                });
            }

            booking.adminReviewRequested = true;
            booking.adminReviewRequestedAt = new Date();

            await booking.save();

            return res.status(200).json({
                message: 'Admin review requested successfully.',
                booking
            });
        } catch (error) {
            console.error('Request admin review error:', error);

            return res.status(500).json({
                error: 'Unable to request admin review.'
            });
        }
    }
);

module.exports = router;