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
    'completed'
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
 */
router.patch(
    '/:id/status',
    authenticateToken,
    authorizeRoles('client', 'freelancer'),
    async (req, res) => {
        try {
            const { id } = req.params;
            const { status } = req.body;

            if (!mongoose.isValidObjectId(id)) {
                return res.status(400).json({
                    error: 'Invalid booking ID.'
                });
            }

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

            const isClient = booking.client.toString() === req.user.id;
            const isFreelancer =
                booking.freelancer.toString() === req.user.id;

            // Only participants may change a booking.
            if (!isClient && !isFreelancer) {
                return res.status(404).json({
                    error: 'Booking not found.'
                });
            }

            let permitted = false;

            // While pending, the freelancer decides whether to accept or reject.
            if (
                booking.status === 'pending' &&
                isFreelancer &&
                ['accepted', 'rejected'].includes(status)
            ) {
                permitted = true;
            }

            // A client can cancel a booking that has not been accepted yet.
            if (
                booking.status === 'pending' &&
                isClient &&
                status === 'cancelled'
            ) {
                permitted = true;
            }

            // Either participant may cancel or complete an accepted booking.
            if (
                booking.status === 'accepted' &&
                ['cancelled', 'completed'].includes(status)
            ) {
                permitted = true;
            }

            if (!permitted) {
                return res.status(403).json({
                    error: 'This status change is not permitted.'
                });
            }

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

module.exports = router;