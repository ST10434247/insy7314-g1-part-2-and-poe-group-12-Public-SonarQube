const mongoose = require('mongoose');

// Defines the structure and validation rules for marketplace gig listings.
const gigSchema = new mongoose.Schema(
  {
    // Short, descriptive title displayed when clients browse gigs.
    title: {
      type: String,
      required: [true, 'Gig title is required.'],
      trim: true,
      minlength: 5,
      maxlength: 100,
    },

    // Detailed description of the service being offered.
    description: {
      type: String,
      required: [true, 'Gig description is required.'],
      trim: true,
      minlength: 20,
      maxlength: 2000,
    },

    // Category helps clients filter and browse available services.
    category: {
      type: String,
      required: [true, 'Gig category is required.'],
      trim: true,
      maxlength: 50,
    },

    // Simulated service price. No real payment processing is required.
    price: {
      type: Number,
      required: [true, 'Gig price is required.'],
      min: [0.01, 'Gig price must be greater than zero.'],
    },

    // Estimated delivery time in days.
    deliveryDays: {
      type: Number,
      required: [true, 'Delivery time is required.'],
      min: 1,
      max: 365,
      validate: {
        validator: Number.isInteger,
        message: 'Delivery time must be a whole number of days.',
      },
    },

    // Reference to the freelancer who owns this listing.
    freelancer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },

    // Allows listings to be made unavailable without deleting them.
    status: {
      type: String,
      enum: ['active', 'inactive'],
      default: 'active',
    },
  },
  {
    // Automatically records when a gig is created and last updated.
    timestamps: true,
  }
);

module.exports = mongoose.model('Gig', gigSchema);