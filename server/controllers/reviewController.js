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

    let reviews;
    try {
      reviews = await query(
        `SELECT
          pr.review_id,
          pr.rating,
          pr.comment,
          pr.created_at,
          u.user_id as user_id,
          u.username,
          u.imageprofile as avatar,
          rr.reply_text,
          rr.created_at AS reply_created_at,
          rr.updated_at AS reply_updated_at
        FROM product_review pr
        JOIN order_details od ON pr.order_detail_id = od.order_detail_id
        JOIN orders o ON od.order_id = o.order_id
        JOIN users u ON o.user_id = u.user_id
        LEFT JOIN product_review_reply rr ON rr.review_id = pr.review_id
        WHERE od.product_id = ?
        ORDER BY pr.created_at DESC`,
        [product_id]
      );
    } catch (err) {
      // Backward compatible: if the reply table doesn't exist yet, still return reviews.
      if (String(err?.message || "").toLowerCase().includes("product_review_reply")) {
        reviews = await query(
          `SELECT
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
          ORDER BY pr.created_at DESC`,
          [product_id]
        );
      } else {
        throw err;
      }
    }

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
      reply: review.reply_text
        ? {
            text: repairLikelyMojibake(review.reply_text),
            date: review.reply_updated_at
              ? new Date(review.reply_updated_at).toLocaleDateString("en-US", {
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })
              : new Date(review.reply_created_at).toLocaleDateString("en-US", {
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                }),
            createdAt: review.reply_created_at || null,
            updatedAt: review.reply_updated_at || null,
          }
        : null,
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

exports.getAdminReviews = async (req, res) => {
  try {
    const productReviews = await query(`
      SELECT
        pr.review_id,
        pr.rating,
        pr.comment,
        pr.created_at,
        od.product_id,
        od.order_detail_id,
        o.order_id,
        o.user_id,
        u.username,
        u.email,
        u.imageprofile AS avatar,
        tp.tea_name,
        tp.tea_type,
        ts.shop_id,
        ts.shop_name
      FROM product_review pr
      JOIN order_details od ON pr.order_detail_id = od.order_detail_id
      JOIN orders o ON od.order_id = o.order_id
      JOIN users u ON o.user_id = u.user_id
      LEFT JOIN tea_product tp ON od.product_id = tp.product_id
      LEFT JOIN tea_shop ts ON tp.shop_id = ts.shop_id
    `);

    const eventReviews = await query(`
      SELECT
        er.review_id,
        er.registration_id,
        er.overall_rating,
        er.location_rating,
        er.atmosphere_rating,
        er.value_rating,
        er.comment,
        er.created_at,
        er.updated_at,
        reg.event_id,
        reg.user_id,
        reg.registration_status,
        e.title AS event_title,
        e.location AS event_location,
        e.event_date,
        u.username,
        u.email,
        u.imageprofile AS avatar
      FROM event_review er
      JOIN event_registration reg ON er.registration_id = reg.registration_id
      JOIN event e ON reg.event_id = e.event_id
      JOIN users u ON reg.user_id = u.user_id
    `);

    const rows = [
      ...productReviews.map((review) => ({
        review_id: review.review_id,
        id: `product-${review.review_id}`,
        content_type: "product",
        target_id: review.product_id,
        target_label: review.tea_name || `Product #${review.product_id}`,
        secondary_target_id: review.shop_id || null,
        secondary_target_label: review.shop_name || null,
        product_id: review.product_id,
        order_id: review.order_id,
        order_detail_id: review.order_detail_id,
        user_id: review.user_id,
        username: review.username,
        email: review.email,
        avatar: review.avatar || null,
        tea_name: review.tea_name || null,
        tea_type: review.tea_type || null,
        shop_id: review.shop_id || null,
        shop_name: review.shop_name || null,
        event_id: null,
        event_title: null,
        event_location: null,
        event_date: null,
        registration_id: null,
        registration_status: null,
        rating: Number(review.rating || 0),
        overall_rating: null,
        location_rating: null,
        atmosphere_rating: null,
        value_rating: null,
        comment: repairLikelyMojibake(review.comment),
        created_at: review.created_at,
        updated_at: review.created_at,
      })),
      ...eventReviews.map((review) => ({
        review_id: review.review_id,
        id: `event-${review.review_id}`,
        content_type: "event",
        target_id: review.event_id,
        target_label: review.event_title || `Event #${review.event_id}`,
        secondary_target_id: null,
        secondary_target_label: review.event_location || null,
        product_id: null,
        order_id: null,
        order_detail_id: null,
        user_id: review.user_id,
        username: review.username,
        email: review.email,
        avatar: review.avatar || null,
        tea_name: null,
        tea_type: null,
        shop_id: null,
        shop_name: null,
        event_id: review.event_id,
        event_title: review.event_title || null,
        event_location: review.event_location || null,
        event_date: review.event_date || null,
        registration_id: review.registration_id,
        registration_status: review.registration_status || null,
        rating: Number(review.overall_rating || 0),
        overall_rating: Number(review.overall_rating || 0),
        location_rating: Number(review.location_rating || 0),
        atmosphere_rating: Number(review.atmosphere_rating || 0),
        value_rating: Number(review.value_rating || 0),
        comment: repairLikelyMojibake(review.comment),
        created_at: review.created_at,
        updated_at: review.updated_at,
      })),
    ]
      .sort((a, b) => new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime());

    res.json(rows);
  } catch (error) {
    console.error("Error fetching admin reviews:", error);
    res.status(500).json({ message: "Failed to fetch reviews" });
  }
};

exports.deleteAdminReview = async (req, res) => {
  try {
    const { contentType, review_id } = req.params;

    if (!review_id || !contentType) {
      return res.status(400).json({ message: "Review ID and content type are required" });
    }

    const normalizedType = String(contentType).trim().toLowerCase();
    const tableName = normalizedType === "event" ? "event_review" : normalizedType === "product" ? "product_review" : null;

    if (!tableName) {
      return res.status(400).json({ message: "Unsupported content type" });
    }

    const existing = await query(`SELECT review_id FROM ${tableName} WHERE review_id = ? LIMIT 1`, [review_id]);

    if (existing.length === 0) {
      return res.status(404).json({ message: "Review not found" });
    }

    await query(`DELETE FROM ${tableName} WHERE review_id = ?`, [review_id]);

    res.json({ message: "Review deleted successfully" });
  } catch (error) {
    console.error("Error deleting admin review:", error);
    res.status(500).json({ message: "Failed to delete review" });
  }
};

exports.getEventReviews = async (req, res) => {
  try {
    const { event_id } = req.params;

    if (!event_id) {
      return res.status(400).json({ message: "Event ID is required" });
    }

    const reviews = await query(
      `SELECT
         er.review_id,
         er.registration_id,
         er.overall_rating,
         er.location_rating,
         er.atmosphere_rating,
         er.value_rating,
         er.comment,
         er.created_at,
         reg.user_id,
         u.username,
         u.imageprofile AS avatar
       FROM event_review er
       JOIN event_registration reg ON er.registration_id = reg.registration_id
       JOIN users u ON reg.user_id = u.user_id
       WHERE reg.event_id = ?
       ORDER BY er.created_at DESC, er.review_id DESC`,
      [event_id]
    );

    res.json(
      reviews.map((review) => ({
        id: review.review_id,
        userId: review.user_id,
        registrationId: review.registration_id,
        name: review.username,
        rating: Number(review.overall_rating || 0),
        overallRating: Number(review.overall_rating || 0),
        locationRating: Number(review.location_rating || 0),
        atmosphereRating: Number(review.atmosphere_rating || 0),
        valueRating: Number(review.value_rating || 0),
        text: repairLikelyMojibake(review.comment),
        date: new Date(review.created_at).toLocaleDateString("en-US", {
          year: "numeric",
          month: "long",
          day: "numeric",
        }),
        avatar: review.avatar || null,
      }))
    );
  } catch (error) {
    console.error("Error fetching event reviews:", error);
    res.status(500).json({ message: "Failed to fetch event reviews" });
  }
};

exports.createEventReview = async (req, res) => {
  try {
    const { event_id } = req.params;
    const { overall_rating, location_rating, atmosphere_rating, value_rating, comment } = req.body;
    const userId = req.user?.user_id;

    if (!userId) return res.status(401).json({ message: "Authentication required" });
    if (!event_id || !overall_rating || !location_rating || !atmosphere_rating || !value_rating || !comment) {
      return res.status(400).json({ message: "Event ID, ratings, and comment are required" });
    }

    const eventRows = await query(`SELECT event_date FROM event WHERE event_id = ? LIMIT 1`, [event_id]);
    if (eventRows.length === 0) {
      return res.status(404).json({ message: "Event not found" });
    }

    const eventDate = eventRows[0].event_date ? new Date(eventRows[0].event_date) : null;
    if (!eventDate || eventDate.getTime() > Date.now()) {
      return res.status(400).json({ message: "You can review an event only after it finishes" });
    }

    const registrationRows = await query(
      `SELECT registration_id
       FROM event_registration
       WHERE event_id = ? AND user_id = ?
       ORDER BY registration_id DESC
       LIMIT 1`,
      [event_id, userId]
    );

    if (registrationRows.length === 0) {
      return res.status(400).json({ message: "You must register for this event before reviewing it" });
    }

    const ratings = [overall_rating, location_rating, atmosphere_rating, value_rating].map((value) => Number(value));
    if (ratings.some((value) => Number.isNaN(value) || value < 1 || value > 5)) {
      return res.status(400).json({ message: "Ratings must be between 1 and 5" });
    }

    const registrationId = registrationRows[0].registration_id;
    const existing = await query(`SELECT review_id FROM event_review WHERE registration_id = ? LIMIT 1`, [registrationId]);
    if (existing.length > 0) {
      return res.status(409).json({ message: "You have already reviewed this event" });
    }

    await query(
      `INSERT INTO event_review
       (registration_id, overall_rating, location_rating, atmosphere_rating, value_rating, comment, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, NOW(), NOW())`,
      [registrationId, ratings[0], ratings[1], ratings[2], ratings[3], comment]
    );

    res.json({ message: "Event review submitted successfully" });
  } catch (error) {
    console.error("Error creating event review:", error);
    res.status(500).json({ message: "Failed to submit event review" });
  }
};

exports.updateEventReview = async (req, res) => {
  try {
    const { event_id, review_id } = req.params;
    const { overall_rating, location_rating, atmosphere_rating, value_rating, comment } = req.body;
    const userId = req.user?.user_id;

    if (!userId) return res.status(401).json({ message: "Authentication required" });
    if (!event_id || !review_id || !overall_rating || !location_rating || !atmosphere_rating || !value_rating || !comment) {
      return res.status(400).json({ message: "Event ID, review ID, ratings, and comment are required" });
    }

    const ratings = [overall_rating, location_rating, atmosphere_rating, value_rating].map((value) => Number(value));
    if (ratings.some((value) => Number.isNaN(value) || value < 1 || value > 5)) {
      return res.status(400).json({ message: "Ratings must be between 1 and 5" });
    }

    const existing = await query(
      `SELECT er.review_id
       FROM event_review er
       JOIN event_registration reg ON er.registration_id = reg.registration_id
       WHERE er.review_id = ? AND reg.event_id = ? AND reg.user_id = ?
       LIMIT 1`,
      [review_id, event_id, userId]
    );

    if (existing.length === 0) {
      return res.status(404).json({ message: "Event review not found or not owned by user" });
    }

    await query(
      `UPDATE event_review
       SET overall_rating = ?, location_rating = ?, atmosphere_rating = ?, value_rating = ?, comment = ?, updated_at = NOW()
       WHERE review_id = ?`,
      [ratings[0], ratings[1], ratings[2], ratings[3], comment, review_id]
    );

    res.json({ message: "Event review updated successfully" });
  } catch (error) {
    console.error("Error updating event review:", error);
    res.status(500).json({ message: "Failed to update event review" });
  }
};

exports.deleteEventReview = async (req, res) => {
  try {
    const { event_id, review_id } = req.params;
    const userId = req.user?.user_id;

    if (!userId) return res.status(401).json({ message: "Authentication required" });
    if (!event_id || !review_id) {
      return res.status(400).json({ message: "Event ID and review ID are required" });
    }

    const existing = await query(
      `SELECT er.review_id
       FROM event_review er
       JOIN event_registration reg ON er.registration_id = reg.registration_id
       WHERE er.review_id = ? AND reg.event_id = ? AND reg.user_id = ?
       LIMIT 1`,
      [review_id, event_id, userId]
    );

    if (existing.length === 0) {
      return res.status(404).json({ message: "Event review not found or not owned by user" });
    }

    await query("DELETE FROM event_review WHERE review_id = ?", [review_id]);

    res.json({ message: "Event review deleted successfully" });
  } catch (error) {
    console.error("Error deleting event review:", error);
    res.status(500).json({ message: "Failed to delete event review" });
  }
};
