const express = require("express");
const router = express.Router();
const reviewController = require("../controllers/reviewController");
const authMiddleware = require("../middleware/authMiddleware");
const adminMiddleware = require("../middleware/adminMiddleware");

router.get("/admin/all", adminMiddleware, reviewController.getAdminReviews);
router.delete("/admin/:contentType/:review_id", adminMiddleware, reviewController.deleteAdminReview);

router.get("/events/:event_id", reviewController.getEventReviews);
router.post("/events/:event_id", authMiddleware, reviewController.createEventReview);
router.patch("/events/:event_id/:review_id", authMiddleware, reviewController.updateEventReview);
router.delete("/events/:event_id/:review_id", authMiddleware, reviewController.deleteEventReview);

// GET /api/reviews/:product_id - Get reviews for a product
router.get("/:product_id", reviewController.getReviews);

// POST /api/reviews/:product_id - Create a review for a product
router.post("/:product_id", authMiddleware, reviewController.createReview);

// PATCH /api/reviews/:product_id/:review_id - Update your review
router.patch("/:product_id/:review_id", authMiddleware, reviewController.updateReview);

// DELETE /api/reviews/:product_id/:review_id - Delete your review
router.delete("/:product_id/:review_id", authMiddleware, reviewController.deleteReview);

module.exports = router;
