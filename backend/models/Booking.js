// Import Mongoose to define the booking schema and interact with MongoDB.
const mongoose = require('mongoose');

// Define the allowed booking statuses.
// These represent the booking's lifecycle.
const BOOKING_STATUSES = [
    'pending',
    'accepted',
    'rejected',
    'cancelled',
    'awaiting_confirmation',
    'completed',
    'disputed'
];


// Define the structure of a booking document.
const bookingSchema = new mongoose.Schema(
  {
    // The gig being booked.
    // A booking must reference an existing gig.
    gig: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Gig',
      required: [true, 'A gig is required.']
    },

    // The client who requested the booking.
    client: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'A client is required.']
    },

    // The freelancer providing the service.
    // Stored separately so ownership can be checked easily.
    freelancer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'A freelancer is required.']
    },

    // The price agreed to when the booking was created.
    // This should not change if the gig's advertised price changes.
    price: {
      type: Number,
      required: [true, 'A booking price is required.'],
      min: [0.01, 'Booking price must be greater than zero.']
    },

    // Additional details supplied by the client.
    requirements: {
      type: String,
      trim: true,
      maxlength: [2000, 'Requirements cannot exceed 2000 characters.'],
      default: ''
    },

    // The current state of the booking.
    // New bookings begin as pending.
    status: {
      type: String,
      enum: {
        values: BOOKING_STATUSES,
        message: 'Invalid booking status.'
      },
      default: 'pending',
      required: true
    },
    
    // Indicates whether the freelancer has requested admin review
    // after a client disputes the submitted work.
    adminReviewRequested: {
      type: Boolean,
      default: false
    },

    // Records when the admin review was requested.
    adminReviewRequestedAt: {
      type: Date,
      default: null
    }
  },
  {
    // Automatically add createdAt and updatedAt fields.
    timestamps: true
  }
);

// Export the model so routes and other modules can use it.
module.exports = mongoose.model('Booking', bookingSchema);