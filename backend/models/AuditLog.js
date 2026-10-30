const mongoose = require('mongoose');

// Defines the structure and validation rules for security audit records.

const auditLogSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        default: null
    },

    userEmail: {
        type: String,
        trim: true,
        lowercase: true,
        default: null
    },

    action: {
        type: String,
        required: true,
        trim: true
    },

    ipAddress: {
        type: String,
        default: null
    },

    details: {
        type: mongoose.Schema.Types.Mixed,
        default: {}
    },

    status: {
        type: String,
        enum: ['SUCCESS', 'FAILURE', 'WARNING'],
        required: true
    }
}, {
    timestamps: true
});

// Index commonly queried audit fields to support admin log retrieval.
auditLogSchema.index({ createdAt: -1 });
auditLogSchema.index({ userId: 1, createdAt: -1 });
auditLogSchema.index({ action: 1, createdAt: -1 });

module.exports = mongoose.model('AuditLog', auditLogSchema);