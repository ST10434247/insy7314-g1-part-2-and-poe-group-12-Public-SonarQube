const mongoose = require('mongoose');

// Supported states for a transaction.
const TRANSACTION_STATUSES = [
    'pending',
    'paid',
    'failed',
    'refunded'
];

const transactionSchema = new mongoose.Schema(
    {
        // The booking this transaction pays for.
        // Unique ensures one transaction record per booking in this version.
        booking: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Booking',
            required: [true, 'A booking is required.'],
            unique: true
        },

        // The client who makes the payment.
        client: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: [true, 'A client is required.']
        },

        // The freelancer who receives the payment.
        freelancer: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: [true, 'A freelancer is required.']
        },

        // Store the amount at transaction creation.
        // This avoids later gig price changes affecting the record.
        amount: {
            type: Number,
            required: [true, 'A transaction amount is required.'],
            min: [0.01, 'The amount must be greater than zero.']
        },

        // Payment state is independent of the booking's status.
        status: {
            type: String,
            enum: {
                values: TRANSACTION_STATUSES,
                message: 'Invalid transaction status.'
            },
            default: 'pending',
            required: true
        },

        // Optional reference from a payment provider.
        // This can be populated later if an external payment gateway is added.
        paymentReference: {
            type: String,
            trim: true,
            default: null
        },

        // Record when payment is confirmed.
        paidAt: {
            type: Date,
            default: null
        }
    },
    {
        // Automatically add createdAt and updatedAt.
        timestamps: true
    }
);

module.exports = mongoose.model('Transaction', transactionSchema);