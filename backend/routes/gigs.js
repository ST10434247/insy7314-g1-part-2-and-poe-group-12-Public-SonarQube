
// Imports Express so this file can define a separate router for gig-related API endpoints.
const express = require('express');

// Mongoose is used to validate MongoDB document IDs before querying the database.
const mongoose = require('mongoose');

// express-validator provides validation and sanitisation for incoming request data.
const { body, query } = require('express-validator');

// Imports the Mongoose model that represents gig listings in MongoDB.
const Gig = require('../models/Gig');

// Imports middleware for verifying JWTs and restricting endpoints to specific roles.
const {
  authenticateToken,
  authorizeRoles,
} = require('../middleware/auth');

// Imports the shared middleware that returns validation errors to the client.
const handleValidationErrors = require('../middleware/validate');

// Creates a router to group all gig endpoints under one route module.
const router = express.Router();


// -----------------------------------------------------------------------------
// REUSABLE VALIDATION RULES
// -----------------------------------------------------------------------------
// These rules are shared by the create and update endpoints. Keeping them in
// one place avoids inconsistent validation between the two operations.

// Validates the gig title. It must be text and contain between 5 and 100
// characters after trimming leading and trailing whitespace.
const validateTitle = body('title')
  .isString()
  .withMessage('Title must be text.')
  .bail()
  .trim()
  .isLength({ min: 5, max: 100 })
  .withMessage('Title must be between 5 and 100 characters.');

// Validates the gig description. The minimum length encourages enough detail
// for clients to understand the service being offered.
const validateDescription = body('description')
  .isString()
  .withMessage('Description must be text.')
  .bail()
  .trim()
  .isLength({ min: 20, max: 2000 })
  .withMessage('Description must be between 20 and 2000 characters.');

// Validates the service category. Trimming prevents accidental whitespace
// from creating categories that appear identical but are stored differently.
const validateCategory = body('category')
  .isString()
  .withMessage('Category must be text.')
  .bail()
  .trim()
  .isLength({ min: 2, max: 50 })
  .withMessage('Category must be between 2 and 50 characters.');

// Validates the price as a numeric value greater than zero.
// toFloat() converts valid numeric strings into numbers before saving.
const validatePrice = body('price')
  .isFloat({ gt: 0 })
  .withMessage('Price must be a number greater than zero.')
  .toFloat();

// Validates the estimated delivery time as a whole number of days.
// toInt() converts valid numeric strings into integers before saving.
const validateDeliveryDays = body('deliveryDays')
  .isInt({ min: 1, max: 365 })
  .withMessage(
    'Delivery time must be a whole number between 1 and 365 days.'
  )
  .toInt();

// A gig's status can only be one of the supported values.
// This rule is optional because a new gig defaults to active in the model.
const validateStatus = body('status')
  .optional()
  .isIn(['active', 'inactive'])
  .withMessage('Status must be active or inactive.');

// Validates the ID in routes such as /:id.
// Rejecting malformed IDs early prevents unnecessary database queries.
const validateGigId = param('id')
  .isMongoId()
  .withMessage('Invalid gig ID.');

// Required fields for creating a new gig.
// Do not use .optional() here.
const createGigValidators = [
  body('title')
    .trim()
    .isLength({ min: 5, max: 100 })
    .withMessage('Title must be between 5 and 100 characters.'),

  body('description')
    .trim()
    .isLength({ min: 20, max: 2000 })
    .withMessage('Description must be between 20 and 2000 characters.'),

  body('category')
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('Category must be between 2 and 50 characters.'),

  body('price')
    .isFloat({ gt: 0 })
    .withMessage('Price must be a number greater than zero.')
    .toFloat(),

  body('deliveryDays')
    .isInt({ min: 1, max: 365 })
    .withMessage('Delivery time must be a whole number between 1 and 365 days.')
    .toInt()
];


// -----------------------------------------------------------------------------
// GET /api/gigs
// -----------------------------------------------------------------------------
// Public endpoint that returns active gigs.
// Clients and visitors can browse available services without logging in.
// An optional category query parameter can narrow the results.

router.get(
  '/',
  [
    // If a category filter is supplied, it must be a non-empty string
    // within the same maximum length used by the Gig model.
    query('category')
      .optional()
      .isString()
      .trim()
      .isLength({ min: 1, max: 50 })
      .withMessage('Invalid category filter.'),
  ],

  // Stops the request if the category query parameter is invalid.
  handleValidationErrors,

  async (req, res) => {
    try {
      // Only active gigs are visible in the public marketplace.
      // Inactive gigs remain stored but are excluded from browsing.
      const filter = { status: 'active' };

      // Apply the optional category filter when the caller supplies one.
      if (req.query.category) {
        filter.category = req.query.category;
      }

      // Retrieve matching gigs, newest first.
      // populate() replaces the freelancer ID with limited public user data.
      // The password is not selected or returned.
      // lean() returns plain objects because this endpoint only reads data.
      const gigs = await Gig.find(filter)
        .populate('freelancer', 'email')
        .sort({ createdAt: -1 })
        .lean();

      // Return the matching listings as JSON.
      return res.status(200).json({ gigs });
    } catch (error) {
      // Log the technical error on the server for troubleshooting.
      // The response does not expose internal database or stack details.
      console.error('Gig browsing failed:', error.message);

      return res.status(500).json({
        error: 'Unable to retrieve gigs.',
      });
    }
  }
);


// -----------------------------------------------------------------------------
// GET /api/gigs/:id
// -----------------------------------------------------------------------------
// Public endpoint for viewing one active gig.
// Inactive gigs are treated as unavailable and return the same response
// as a gig that does not exist.

router.get(
  '/:id',

  // Validate the URL parameter before querying MongoDB.
  validateGigId,

  // Return a controlled 400 response for invalid IDs.
  handleValidationErrors,

  async (req, res) => {
    try {
      // Find the requested gig only if it is active.
      // Populate only the freelancer's email for public display.
      const gig = await Gig.findOne({
        _id: req.params.id,
        status: 'active',
      })
        .populate('freelancer', 'email')
        .lean();

      // Return 404 if the gig is missing or inactive.
      if (!gig) {
        return res.status(404).json({
          error: 'Gig not found.',
        });
      }

      // Return the requested gig.
      return res.status(200).json({ gig });
    } catch (error) {
      console.error('Gig retrieval failed:', error.message);

      return res.status(500).json({
        error: 'Unable to retrieve gig.',
      });
    }
  }
);


// -----------------------------------------------------------------------------
// POST /api/gigs
// -----------------------------------------------------------------------------
// Creates a new gig listing.
// Only authenticated freelancers may create listings.
// The owner is taken from the verified JWT, not from the request body.
router.post(
  '/',
  authenticateToken,
  authorizeRoles('freelancer'),
  createGigValidators,
  handleValidationErrors,
  async (req, res) => {
    try {
      // Explicitly select the accepted fields instead of passing req.body
      // directly into Mongoose. This prevents mass assignment of fields such
      // as freelancer, status, or arbitrary internal document properties.
      const gig = await Gig.create({
        title: req.body.title,
        description: req.body.description,
        category: req.body.category,
        price: req.body.price,
        deliveryDays: req.body.deliveryDays,

        // The authenticated user's ID determines ownership.
        // A caller cannot claim another freelancer's identity here.
        freelancer: req.user.id,
      });

      // Return 201 because a new resource was successfully created.
      return res.status(201).json({
        message: 'Gig created successfully.',
        gig,
      });
    } catch (error) {
      // Log server-side details without returning internal information.
      console.error('Gig creation failed:', error.message);

      return res.status(500).json({
        error: 'Unable to create gig.',
      });
    }
  }
);


// -----------------------------------------------------------------------------
// PUT /api/gigs/:id
// -----------------------------------------------------------------------------
// Updates an existing gig.
// Only the freelancer who owns the gig may update it.
// Only explicitly permitted fields are accepted.

router.put(
  '/:id',

  // Require a valid JWT before allowing an update.
  authenticateToken,

  // Only freelancers can update gig listings.
  authorizeRoles('freelancer'),

  [
    // Validate the target gig ID.
    validateGigId,

    // All editable fields are optional for an update.
    // This permits partial updates while still validating any supplied value.
    validateTitle.optional(),
    validateDescription.optional(),
    validateCategory.optional(),
    validatePrice.optional(),
    validateDeliveryDays.optional(),
    validateStatus,
  ],

  // Stop invalid update requests before reaching the database.
  handleValidationErrors,

  async (req, res) => {
    try {
      // Define an allowlist of fields that a freelancer may update.
      // Fields such as _id, freelancer, createdAt, and __v are excluded.
      const allowedFields = [
        'title',
        'description',
        'category',
        'price',
        'deliveryDays',
        'status',
      ];

      // Build a new object containing only accepted fields.
      // This prevents clients from assigning arbitrary properties.
      const updates = {};

      for (const field of allowedFields) {
        // Only include fields actually supplied by the caller.
        if (req.body[field] !== undefined) {
          updates[field] = req.body[field];
        }
      }

      // Reject empty requests and requests containing no supported fields.
      if (Object.keys(updates).length === 0) {
        return res.status(400).json({
          error: 'At least one valid field must be provided.',
        });
      }

      // Find the gig using both its ID and the authenticated user's ID.
      // Including the owner in the query enforces ownership at database level.
      const gig = await Gig.findOne({
        _id: req.params.id,
        freelancer: req.user.id,
      });

      // A missing gig and a gig owned by someone else both return 404.
      // This avoids revealing another user's listing through this endpoint.
      if (!gig) {
        return res.status(404).json({
          error: 'Gig not found.',
        });
      }

      // Apply only the validated and allowlisted changes.
      // Mongoose document save() runs schema validation.
      Object.assign(gig, updates);
      await gig.save();

      // Return the updated document.
      return res.status(200).json({
        message: 'Gig updated successfully.',
        gig,
      });
    } catch (error) {
      console.error('Gig update failed:', error.message);

      return res.status(500).json({
        error: 'Unable to update gig.',
      });
    }
  }
);


// -----------------------------------------------------------------------------
// DELETE /api/gigs/:id
// -----------------------------------------------------------------------------
// Deletes an existing gig listing.
// Only the freelancer who owns the gig may delete it.

router.delete(
  '/:id',

  // Require a valid JWT.
  authenticateToken,

  // Only freelancers may delete listings.
  authorizeRoles('freelancer'),

  // Validate the target ID before querying the database.
  validateGigId,

  // Return a 400 response for malformed IDs.
  handleValidationErrors,

  async (req, res) => {
    try {
      // Delete only if both the gig ID and authenticated owner match.
      // This prevents one freelancer from deleting another's listing.
      const gig = await Gig.findOneAndDelete({
        _id: req.params.id,
        freelancer: req.user.id,
      });

      // Return 404 if no owned gig matched the query.
      if (!gig) {
        return res.status(404).json({
          error: 'Gig not found.',
        });
      }

      // Confirm that the deletion succeeded.
      return res.status(200).json({
        message: 'Gig deleted successfully.',
      });
    } catch (error) {
      console.error('Gig deletion failed:', error.message);

      return res.status(500).json({
        error: 'Unable to delete gig.',
      });
    }
  }
);


// Exports the router so server.js can mount it under /api/gigs.
module.exports = router;