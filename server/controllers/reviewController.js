const { query } = require("../utils/dbHelpers");
const jwt = require("jsonwebtoken");

function getUserIdFromToken(token) {
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    return decoded.user_id;
  } catch (err) {
    return null;
  }
}

exports.getReviews = async (req, res) => {
  try {
    const { product_id } = req.params;

    if (!product_id) {
      return res.status(400).json({ message: "Product ID is required" });
    }

    const reviews = await query(`
      SELECT
        pr.review_id,
        pr.rating,
        pr.comment,
        pr.created_at,
        u.username,
        u.imageprofile as avatar
      FROM product_review pr
      JOIN users u ON pr.user_id = u.user_id
      WHERE pr.product_id = ?
      ORDER BY pr.created_at DESC
    `, [product_id]);

    // Format the reviews
    const formattedReviews = reviews.map(review => ({
      id: review.review_id,
      name: review.username,
      rating: review.rating,
      text: review.comment,
      date: new Date(review.created_at).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      }),
      avatar: review.avatar || null,
      verified: true, // Assume all reviews are from verified buyers
      helpful: 0, // Placeholder
      featured: false, // Placeholder
      photo: null // Placeholder
    }));

    res.json(formattedReviews);
  } catch (error) {
    console.error("Error fetching reviews:", error);
    res.status(500).json({ message: "Failed to fetch reviews" });
  }
};

exports.createReview = async (req, res) => {
  try {
    const { product_id } = req.params;
    const { rating, comment } = req.body;
    const token = req.headers.authorization?.replace("Bearer ", "");

    if (!token) {
      return res.status(401).json({ message: "Authentication required" });
    }

    const userId = getUserIdFromToken(token);
    if (!userId) {
      return res.status(401).json({ message: "Invalid token" });
    }

    if (!product_id || !rating || !comment) {
      return res.status(400).json({ message: "Product ID, rating, and comment are required" });
    }

    if (rating < 1 || rating > 5) {
      return res.status(400).json({ message: "Rating must be between 1 and 5" });
    }

    // Check if user already reviewed this product
    const existing = await query(
      "SELECT review_id FROM product_review WHERE user_id = ? AND product_id = ?",
      [userId, product_id]
    );

    if (existing.length > 0) {
      return res.status(409).json({ message: "You have already reviewed this product" });
    }

    await query(
      "INSERT INTO product_review (user_id, product_id, rating, comment, created_at) VALUES (?, ?, ?, ?, NOW())",
      [userId, product_id, rating, comment]
    );

    res.json({ message: "Review submitted successfully" });
  } catch (error) {
    console.error("Error creating review:", error);
    res.status(500).json({ message: "Failed to submit review" });
  }
};