const AuditLog = require('../models/AuditLog');
const logger = require('../config/logger');

// Stores security-related events in MongoDB for administrative review.
const logAudit = async ({
    userId = null,
    userEmail = null,
    action,
    ipAddress = null,
    details = {},
    status
}) => {
    try {
        await AuditLog.create({
            userId,
            userEmail,
            action,
            ipAddress,
            details,
            status
        });

        return true;
    } catch (error) {
        // Audit logging failures must be recorded without exposing details to clients.
        logger.error('AUDIT_LOG_WRITE_FAILED', {
            event: 'AUDIT_LOG_WRITE_FAILED',
            action,
            userId,
            error: error.message,
            stack: error.stack
        });

        return false;
    }
};

module.exports = logAudit;