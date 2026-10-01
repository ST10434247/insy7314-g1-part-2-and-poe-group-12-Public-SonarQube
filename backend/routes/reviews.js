const express = require('express');
const mongoose = require('mongoose');

const Review = require('../models/Review');
const Booking = require('../models/Booking');
const { authenticateToken, authorizeRoles } = require('../middleware/auth');

const router = express.Router();

/*
 * POST /api/reviews
 *
 * Allows a client to review a completed booking.
 * The booking determines which freelancer receives the review.
 */
router.post(
    '/',
    authenticateToken,
    authorizeRoles('client'),
    async (req, res) => {
        try {
            const { bookingId, rating, comment = '' } = req.body;

            // Validate the booking ID before querying the database.
            if (!mongoose.isValidObjectId(bookingId)) {
                return res.status(400).json({
                    error: 'A valid bookingId is required.'
                });
            }

            // Ensure the rating is a whole number between one and five.
            if (
                !Number.isInteger(rating) ||
                rating < 1 ||
                rating > 5
            ) {
                return res.status(400).json({
                    error: 'Rating must be a whole number between 1 and 5.'
                });
            }

            // Validate optional written feedback.
            if (
                typeof comment !== 'string' ||
                comment.length > 1000
            ) {
                return res.status(400).json({
                    error: 'Comment must be text of at most 1000 characters.'
                });
            }

            // Only the client who owns the booking can review it.
            const booking = await Booking.findOne({
                _id: bookingId,
                client: req.user.id
            });

            if (!booking) {
                return res.status(404).json({
                    error: 'Booking not found.'
                });
            }

            // Reviews are only permitted after work is completed.
            if (booking.status !== 'completed') {
                return res.status(400).json({
                    error: 'Only completed bookings can be reviewed.'
                });
            }

            // Prevent a second review for the same booking.
            const existingReview = await Review.findOne({
                booking: booking._id
            });

            if (existingReview) {
                return res.status(409).json({
                    error: 'This booking has already been reviewed.'
                });
            }

            const review = await Review.create({
                booking: booking._id,
                client: booking.client,
                freelancer: booking.freelancer,
                rating,
                comment: comment.trim()
            });

            return res.status(201).json({
                message: 'Review submitted successfully.',
                review
            });
        } catch (error) {
            // The unique booking index also prevents duplicate reviews
            // if two requests arrive at nearly the same time.
            if (error.code === 11000) {
                return res.status(409).json({
                    error: 'This booking has already been reviewed.'
                });
            }

            console.error('Create review error:', error);

            return res.status(500).json({
                error: 'Unable to submit review.'
            });
        }
    }
);

/*
 * GET /api/reviews/freelancer/:id
 *
 * Returns reviews and rating statistics for a freelancer.
 * This endpoint is public so users can view ratings before booking.
 */
router.get('/freelancer/:id', async (req, res) => {
    try {
        const { id } = req.params;

        if (!mongoose.isValidObjectId(id)) {
            return res.status(400).json({
                error: 'Invalid freelancer ID.'
            });
        }

        const reviews = await Review.find({ freelancer: id })
            .populate('client', 'name')
            .sort({ createdAt: -1 });

        // Calculate the average rating from the returned reviews.
        const totalReviews = reviews.length;
        const averageRating =
            totalReviews === 0
                ? 0
                : reviews.reduce((sum, review) => sum + review.rating, 0) /
                  totalReviews;

        return res.status(200).json({
            freelancer: id,
            totalReviews,
            averageRating: Number(averageRating.toFixed(2)),
            reviews
        });
    } catch (error) {
        console.error('Get freelancer reviews error:', error);

        return res.status(500).json({
            error: 'Unable to retrieve freelancer reviews.'
        });
    }
});

/*
 * GET /api/reviews/:id
 *
 * Returns a single review.
 */
router.get('/:id', async (req, res) => {
    try {
        const { id } = req.params;

        if (!mongoose.isValidObjectId(id)) {
            return res.status(400).json({
                error: 'Invalid review ID.'
            });
        }

        const review = await Review.findById(id)
            .populate('client', 'name')
            .populate('freelancer', 'name');

        if (!review) {
            return res.status(404).json({
                error: 'Review not found.'
            });
        }

        return res.status(200).json({ review });
    } catch (error) {
        console.error('Get review error:', error);

        return res.status(500).json({
            error: 'Unable to retrieve review.'
        });
    }
});

module.exports = router;