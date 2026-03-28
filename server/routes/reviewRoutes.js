const express = require("express");
const router = express.Router();
const reviewController = require("../controllers/reviewController");

// GET /api/reviews/:product_id - Get reviews for a product
router.get("/:product_id", reviewController.getReviews);

// POST /api/reviews/:product_id - Create a review for a product
router.post("/:product_id", reviewController.createReview);

module.exports = router;