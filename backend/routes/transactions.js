const express = require('express');
const mongoose = require('mongoose');

const Transaction = require('../models/Transaction');
const Booking = require('../models/Booking');
const { authenticateToken, authorizeRoles } = require('../middleware/auth');

const router = express.Router();

/*
 * POST /api/transactions
 *
 * Creates a pending transaction for an accepted booking.
 * The amount and participants are taken from the booking, not the request body.
 */
router.post(
    '/',
    authenticateToken,
    authorizeRoles('client'),
    async (req, res) => {
        try {
            const { bookingId } = req.body;

            if (!mongoose.isValidObjectId(bookingId)) {
                return res.status(400).json({
                    error: 'A valid bookingId is required.'
                });
            }

            // Only the client who owns the booking can create its transaction.
            const booking = await Booking.findOne({
                _id: bookingId,
                client: req.user.id
            });

            if (!booking) {
                return res.status(404).json({
                    error: 'Booking not found.'
                });
            }

            // Payment is only available after the client confirms the work.
            if (booking.status !== 'payment_pending') {
                return res.status(400).json({
                    error: 'Payment is only available after the client confirms the work.'
                });
            }

            // Prevent duplicate transaction records for the same booking.
            const existingTransaction = await Transaction.findOne({
                booking: booking._id
            });

            if (existingTransaction) {
                return res.status(409).json({
                    error: 'A transaction already exists for this booking.'
                });
            }

            const transaction = await Transaction.create({
                booking: booking._id,
                client: booking.client,
                freelancer: booking.freelancer,
                amount: booking.price
            });

            return res.status(201).json({
                message: 'Transaction created successfully.',
                transaction
            });
        } catch (error) {
            // The unique booking index also protects against simultaneous requests.
            if (error.code === 11000) {
                return res.status(409).json({
                    error: 'A transaction already exists for this booking.'
                });
            }

            console.error('Create transaction error:', error);

            return res.status(500).json({
                error: 'Unable to create transaction.'
            });
        }
    }
);

/*
 * GET /api/transactions
 *
 * Clients see their payments.
 * Freelancers see transactions associated with their bookings.
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

            const transactions = await Transaction.find(userFilter)
                .populate('booking', 'status')
                .populate('client', 'name email')
                .populate('freelancer', 'name email')
                .sort({ createdAt: -1 });

            return res.status(200).json({ transactions });
        } catch (error) {
            console.error('Get transactions error:', error);

            return res.status(500).json({
                error: 'Unable to retrieve transactions.'
            });
        }
    }
);

/*
 * GET /api/transactions/income
 *
 * Returns income earned by the authenticated freelancer.
 * Only transactions confirmed as paid are included.
 */
router.get(
    '/income',
    authenticateToken,
    authorizeRoles('freelancer'),
    async (req, res) => {
        try {
            // Aggregate paid transactions for this freelancer.
            const [summary] = await Transaction.aggregate([
                {
                    $match: {
                        freelancer: new mongoose.Types.ObjectId(req.user.id),
                        status: 'paid'
                    }
                },
                {
                    $group: {
                        _id: null,
                        totalIncome: { $sum: '$amount' },
                        paidTransactions: { $sum: 1 }
                    }
                }
            ]);

            // Retrieve the individual paid transactions for the breakdown.
            const transactions = await Transaction.find({
                freelancer: req.user.id,
                status: 'paid'
            })
                .populate('booking', 'status')
                .populate('client', 'name')
                .sort({ paidAt: -1 });

            return res.status(200).json({
                totalIncome: summary?.totalIncome || 0,
                paidTransactions: summary?.paidTransactions || 0,
                transactions
            });
        } catch (error) {
            console.error('Get freelancer income error:', error);

            return res.status(500).json({
                error: 'Unable to retrieve income.'
            });
        }
    }
);

/*
 * GET /api/transactions/:id
 *
 * Only the client or freelancer involved in the transaction can view it.
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
                    error: 'Invalid transaction ID.'
                });
            }

            const transaction = await Transaction.findById(id)
                .populate('booking', 'status')
                .populate('client', 'name email')
                .populate('freelancer', 'name email');

            if (!transaction) {
                return res.status(404).json({
                    error: 'Transaction not found.'
                });
            }

            const isClient =
                transaction.client._id.toString() === req.user.id;
            const isFreelancer =
                transaction.freelancer._id.toString() === req.user.id;

            if (!isClient && !isFreelancer) {
                return res.status(404).json({
                    error: 'Transaction not found.'
                });
            }

            return res.status(200).json({ transaction });
        } catch (error) {
            console.error('Get transaction error:', error);

            return res.status(500).json({
                error: 'Unable to retrieve transaction.'
            });
        }
    }
);

/*
 * PATCH /api/transactions/:id/status
 *
 * Allows the client to mark a pending transaction as paid or failed.
 * This simulates payment confirmation for the university project.
 */
router.patch(
    '/:id/status',
    authenticateToken,
    authorizeRoles('client'),
    async (req, res) => {
        try {
            const { id } = req.params;
            const { status } = req.body;

            if (!mongoose.isValidObjectId(id)) {
                return res.status(400).json({
                    error: 'Invalid transaction ID.'
                });
            }

            // Clients can only select these statuses.
            if (!['paid', 'failed'].includes(status)) {
                return res.status(400).json({
                    error: 'Status must be paid or failed.'
                });
            }

            // Only the client who owns the transaction can update it.
            const transaction = await Transaction.findOne({
                _id: id,
                client: req.user.id
            });

            if (!transaction) {
                return res.status(404).json({
                    error: 'Transaction not found.'
                });
            }

            // Prevent changing a transaction after it has been processed.
            if (transaction.status !== 'pending') {
                return res.status(400).json({
                    error: 'Only pending transactions can be updated.'
                });
            }
            // Retrieve the associated booking and verify client ownership.
            const booking = await Booking.findOne({
                _id: transaction.booking,
                client: req.user.id
            });

            if (!booking) {
                return res.status(404).json({
                    error: 'Booking not found.'
                });
            }

            // A booking can only be completed after payment succeeds.
            if (status === 'paid' && booking.status !== 'payment_pending') {
                return res.status(400).json({
                    error: 'Payment requires a booking awaiting payment.'
                });
            }

            transaction.status = status;

            if (status === 'paid') {
                transaction.paidAt = new Date();
                booking.status = 'completed';
                await booking.save();
            }

            await transaction.save();

            return res.status(200).json({
                message: `Transaction marked as ${status}.`,
                transaction
            });
        } catch (error) {
            console.error('Update transaction error:', error);

            return res.status(500).json({
                error: 'Unable to update transaction.'
            });
        }
    }
);

module.exports = router;