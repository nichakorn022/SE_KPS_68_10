const { query } = require("../utils/dbHelpers");
const jwt = require("jsonwebtoken");
const { repairLikelyMojibake } = require("../utils/textRepair");

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
        u.user_id as user_id,
        u.username,
        u.imageprofile as avatar
      FROM product_review pr
      JOIN order_details od ON pr.order_detail_id = od.order_detail_id
      JOIN orders o ON od.order_id = o.order_id
      JOIN users u ON o.user_id = u.user_id
      WHERE od.product_id = ?
      ORDER BY pr.created_at DESC
    `, [product_id]);

    // Format the reviews
    const formattedReviews = reviews.map(review => ({
      id: review.review_id,
      userId: review.user_id,
      name: review.username,
      rating: review.rating,
      text: repairLikelyMojibake(review.comment),
      date: new Date(review.created_at).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      }),
      avatar: review.avatar || null,
      verified: true, // Assume all reviews are from verified buyers
      helpful: 0, // Placeholder
      featured: false, // Placeholder
    }));

    res.json(formattedReviews);
  } catch (error) {
    console.error("Error fetching reviews:", error);
    res.status(500).json({ message: "Failed to fetch reviews" });
  }
};

exports.getSellerReviews = async (req, res) => {
  try {
    const userId = req.user?.user_id;
    const role = req.user?.role;

    if (!userId) return res.status(401).json({ message: "Authentication required" });
    if (role !== "shop") {
      return res.status(403).json({ message: "This endpoint is available only for shop accounts" });
    }

    const rows = await query(
      `SELECT
          pr.review_id,
          pr.rating,
          pr.comment,
          pr.created_at,
          u.user_id AS reviewer_user_id,
          u.username AS reviewer_name,
          u.imageprofile AS reviewer_avatar,
          od.product_id,
          tp.tea_name,
          tp.tea_type,
          o.order_id,
          rr.reply_text,
          rr.created_at AS reply_created_at,
          rr.updated_at AS reply_updated_at
       FROM tea_shop ts
       JOIN tea_product tp ON tp.shop_id = ts.shop_id
       JOIN order_details od ON od.product_id = tp.product_id
       JOIN orders o ON o.order_id = od.order_id
       JOIN users u ON u.user_id = o.user_id
       JOIN product_review pr ON pr.order_detail_id = od.order_detail_id
       LEFT JOIN product_review_reply rr ON rr.review_id = pr.review_id
       WHERE ts.user_id = ?
       ORDER BY pr.created_at DESC`,
      [userId]
    );

    const formatted = (Array.isArray(rows) ? rows : []).map((row) => ({
      id: row.review_id,
      rating: row.rating,
      text: repairLikelyMojibake(row.comment),
      createdAt: row.created_at,
      date: new Date(row.created_at).toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
      }),
      productId: row.product_id,
      productName: repairLikelyMojibake(row.tea_name),
      productType: repairLikelyMojibake(row.tea_type),
      orderId: row.order_id,
      reviewer: {
        userId: row.reviewer_user_id,
        name: row.reviewer_name,
        avatar: row.reviewer_avatar || null,
      },
      reply: row.reply_text
        ? {
            text: repairLikelyMojibake(row.reply_text),
            createdAt: row.reply_created_at,
            updatedAt: row.reply_updated_at,
          }
        : null,
    }));

    return res.json(formatted);
  } catch (error) {
    console.error("Error fetching seller reviews:", error);
    return res.status(500).json({ message: "Failed to fetch seller reviews" });
  }
};

exports.replyToReview = async (req, res) => {
  try {
    const userId = req.user?.user_id;
    const role = req.user?.role;
    const reviewId = Number(req.params.review_id);
    const replyText = String(req.body?.reply_text || "").trim();

    if (!userId) return res.status(401).json({ message: "Authentication required" });
    if (role !== "shop") {
      return res.status(403).json({ message: "This endpoint is available only for shop accounts" });
    }

    if (!Number.isInteger(reviewId) || reviewId <= 0) {
      return res.status(400).json({ message: "review_id must be a positive integer" });
    }

    if (!replyText) {
      return res.status(400).json({ message: "reply_text is required" });
    }

    const ownership = await query(
      `SELECT pr.review_id
       FROM tea_shop ts
       JOIN tea_product tp ON tp.shop_id = ts.shop_id
       JOIN order_details od ON od.product_id = tp.product_id
       JOIN product_review pr ON pr.order_detail_id = od.order_detail_id
       WHERE ts.user_id = ?
         AND pr.review_id = ?
       LIMIT 1`,
      [userId, reviewId]
    );

    if (!ownership.length) {
      return res.status(404).json({ message: "Review not found for this shop" });
    }

    await query(
      `INSERT INTO product_review_reply (review_id, shop_user_id, reply_text)
       VALUES (?, ?, ?)
       ON DUPLICATE KEY UPDATE
         reply_text = VALUES(reply_text),
         updated_at = CURRENT_TIMESTAMP`,
      [reviewId, userId, replyText]
    );

    return res.json({ message: "Reply saved" });
  } catch (error) {
    console.error("Error replying to review:", error);
    return res.status(500).json({ message: "Failed to save reply" });
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

    const ratingNum = parseInt(rating, 10);
    if (isNaN(ratingNum) || ratingNum < 1 || ratingNum > 5) {
      return res.status(400).json({ message: "Rating must be between 1 and 5" });
    }

    // Check if user already reviewed this product
    const existing = await query(
      `SELECT pr.review_id
       FROM product_review pr
       JOIN order_details od ON pr.order_detail_id = od.order_detail_id
       JOIN orders o ON od.order_id = o.order_id
       WHERE o.user_id = ? AND od.product_id = ?`,
      [userId, product_id]
    );

    if (existing.length > 0) {
      return res.status(409).json({ message: "You have already reviewed this product" });
    }

    // Ensure user has purchased this product
    const orderDetail = await query(
      `SELECT od.order_detail_id
       FROM order_details od
       JOIN orders o ON od.order_id = o.order_id
       WHERE o.user_id = ? AND od.product_id = ?
       LIMIT 1`,
      [userId, product_id]
    );

    if (orderDetail.length === 0) {
      return res.status(400).json({ message: "You must purchase this product before reviewing it" });
    }

    await query(
      "INSERT INTO product_review (order_detail_id, rating, comment, created_at) VALUES (?, ?, ?, NOW())",
      [orderDetail[0].order_detail_id, ratingNum, comment]
    );

    res.json({ message: "Review submitted successfully" });
  } catch (error) {
    console.error("Error creating review:", error);
    res.status(500).json({ message: "Failed to submit review" });
  }
};

exports.updateReview = async (req, res) => {
  try {
    const { product_id, review_id } = req.params;
    const { rating, comment } = req.body;
    const userId = req.user?.user_id;

    if (!userId) return res.status(401).json({message: "Authentication required"});
    if (!product_id || !review_id || !rating || !comment) {
      return res.status(400).json({ message: "Product ID, review ID, rating, and comment are required" });
    }

    const ratingNum = parseInt(rating, 10);
    if (isNaN(ratingNum) || ratingNum < 1 || ratingNum > 5) {
      return res.status(400).json({ message: "Rating must be between 1 and 5" });
    }

    const existing = await query(
      `SELECT pr.review_id
       FROM product_review pr
       JOIN order_details od ON pr.order_detail_id = od.order_detail_id
       JOIN orders o ON od.order_id = o.order_id
       WHERE pr.review_id = ? AND o.user_id = ? AND od.product_id = ?`,
      [review_id, userId, product_id]
    );

    if (existing.length === 0) {
      return res.status(404).json({ message: "Review not found or not owned by user" });
    }

    await query(
      "UPDATE product_review SET rating = ?, comment = ? WHERE review_id = ?",
      [ratingNum, comment, review_id]
    );

    res.json({ message: "Review updated successfully" });
  } catch (error) {
    console.error("Error updating review:", error);
    res.status(500).json({ message: "Failed to update review" });
  }
};

exports.deleteReview = async (req, res) => {
  try {
    const { product_id, review_id } = req.params;
    const userId = req.user?.user_id;

    if (!userId) return res.status(401).json({message: "Authentication required"});
    if (!product_id || !review_id) {
      return res.status(400).json({ message: "Product ID and review ID are required" });
    }

    const existing = await query(
      `SELECT pr.review_id
       FROM product_review pr
       JOIN order_details od ON pr.order_detail_id = od.order_detail_id
       JOIN orders o ON od.order_id = o.order_id
       WHERE pr.review_id = ? AND o.user_id = ? AND od.product_id = ?`,
      [review_id, userId, product_id]
    );

    if (existing.length === 0) {
      return res.status(404).json({ message: "Review not found or not owned by user" });
    }

    await query("DELETE FROM product_review WHERE review_id = ?", [review_id]);

    res.json({ message: "Review deleted successfully" });
  } catch (error) {
    console.error("Error deleting review:", error);
    res.status(500).json({ message: "Failed to delete review" });
  }
};
