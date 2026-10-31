
const express = require('express');
const mongoose = require('mongoose');
const AuditLog = require('../models/AuditLog');
const logger = require('../config/logger');
const Booking = require('../models/Booking');

const { authenticateToken, authorizeRoles } = require('../middleware/auth');

const router = express.Router();

// (auth0Developers, 2022) RBAC Role Based Access Control

// These are the only outcomes an admin can assign to a disputed booking.
const RESOLUTION_STATUSES = [
    'completed',
    'accepted',
    'cancelled'
];

const parsePositiveInteger = (value, fallback) => {
    if (typeof value !== 'string' || !/^\d+$/.test(value)) {
        return fallback;
    }

    const parsed = Number.parseInt(value, 10);
    return parsed > 0 ? parsed : fallback;
};

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
 * GET /api/admin/audit-logs
 *
 * Returns security audit records for administrative review.
 * Only administrators may access this endpoint.
 *
 * Supports pagination and filtering by action and status.
 */
router.get(
    '/audit-logs',
    authenticateToken,
    authorizeRoles('admin'),
    async (req, res) => {
        try {
            const page = parsePositiveInteger(req.query.page, 1);
            const limit = Math.min(100, parsePositiveInteger(req.query.limit, 20));

            const filter = {};

            // Allow administrators to filter audit records by action.
            if (typeof req.query.action === 'string') {
                const action = req.query.action.trim();

                if (action.length > 0 && action.length <= 100) {
                    filter.action = action;
                }
            }

            // Only valid audit statuses may be used as filters.
            if (req.query.status !== undefined) {
                const validStatuses = ['SUCCESS', 'FAILURE', 'WARNING'];

                if (
                    typeof req.query.status !== 'string' ||
                    !validStatuses.includes(req.query.status)
                ) {
                    return res.status(400).json({
                        error: 'Invalid audit status filter.'
                    });
                }

                const validatedStatus = validStatuses.find(
                    (allowedStatus) => allowedStatus === req.query.status
                );

                filter.status = validatedStatus;
            }

            // Sanitize the filter before passing it to MongoDB.
            const safeFilter = mongoose.sanitizeFilter(filter);

            const skip = (page - 1) * limit;

            const [auditLogs, total] = await Promise.all([
                AuditLog.find(safeFilter)
                    .populate('userId', 'email role')
                    .sort({ createdAt: -1 })
                    .skip(skip)
                    .limit(limit)
                    .lean(),

                AuditLog.countDocuments(safeFilter)
            ]);

            return res.status(200).json({
                auditLogs,
                pagination: {
                    total,
                    page,
                    limit,
                    totalPages: Math.ceil(total / limit)
                }
            });
        } catch (error) {
            logger.error('ADMIN_AUDIT_LOG_RETRIEVAL_FAILED', {
                event: 'ADMIN_AUDIT_LOG_RETRIEVAL_FAILED',
                adminId: req.user?.id,
                error: error.message,
                stack: error.stack
            });

            return res.status(500).json({
                error: 'Unable to retrieve audit logs.'
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
            if (
                typeof status !== 'string' ||
                !RESOLUTION_STATUSES.includes(status)
            ) {
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
