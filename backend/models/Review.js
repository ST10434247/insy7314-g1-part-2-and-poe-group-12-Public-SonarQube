const mongoose = require('mongoose');

const reviewSchema = new mongoose.Schema(
    {
        // The completed booking being reviewed.
        // A unique booking reference prevents duplicate reviews.
        booking: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Booking',
            required: [true, 'A booking is required.'],
            unique: true
        },

        // The client who submitted the review.
        client: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: [true, 'A client is required.']
        },

        // The freelancer receiving the review.
        freelancer: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: [true, 'A freelancer is required.']
        },

        // Rating from one to five stars.
        rating: {
            type: Number,
            required: [true, 'A rating is required.'],
            min: [1, 'Rating must be at least 1.'],
            max: [5, 'Rating cannot exceed 5.'],
            validate: {
                validator: Number.isInteger,
                message: 'Rating must be a whole number.'
            }
        },

        // Optional written feedback from the client.
        comment: {
            type: String,
            trim: true,
            maxlength: [1000, 'Review cannot exceed 1000 characters.'],
            default: ''
        }
    },
    {
        // Automatically record when the review was created or updated.
        timestamps: true
    }
);

module.exports = mongoose.model('Review', reviewSchema);