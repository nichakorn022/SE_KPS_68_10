const express = require("express");
const router = express.Router();
const { query } = require("../utils/dbHelpers");
const SponsorController = require("../controllers/SponsorController");
const authMiddleware = require("../middleware/authMiddleware");
const adminMiddleware = require("../middleware/adminMiddleware");

router.post("/request", authMiddleware, SponsorController.requestSponsor);
router.get("/", adminMiddleware, SponsorController.getSponsorRequests);
router.patch("/:id/status", adminMiddleware, SponsorController.updateSponsorStatus);

// Backward-compatible aliases for the earlier sponsor API shape.
router.get("/requests", adminMiddleware, SponsorController.getSponsorRequests);
router.put("/approve/:id", adminMiddleware, (req, res) => {
  req.body.status = "approved";
  return SponsorController.updateSponsorStatus(req, res);
});

router.get("/my", authMiddleware, async (req, res) => {
  try {
    const rows = await query(
      `SELECT shop_id FROM tea_shop WHERE user_id = ?`,
      [req.user.user_id]
    );

    if (rows.length === 0) {
      return res.json([]);
    }

    const shopId = rows[0].shop_id;

    const data = await query(`
      SELECT s.*, e.title AS event_title
      FROM sponsor s
      JOIN event e ON e.event_id = s.event_id
      WHERE s.shop_id = ?
      ORDER BY s.created_at DESC
    `, [shopId]);

    res.json(data);

  } catch (err) {
    res.status(500).json({ message: "Error" });
  }
});

module.exports = router;
