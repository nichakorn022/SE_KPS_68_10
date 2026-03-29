const express = require("express");
const router = express.Router();
const adminMiddleware = require("../middleware/adminMiddleware");
const authMiddleware = require("../middleware/authMiddleware");
const SponsorController = require("../controllers/SponsorController");
const { query } = require("../utils/dbHelpers");

const {
  getAllEvents,
  getEventById,
  createEvent,
  updateEvent,
  deleteEvent,
  searchEvents,
  addInterested,
  removeInterested,
  checkInterested,
  getUserInterested,
  registerEvent,
  cancelRegistration,
  checkRegistration
} = require("../controllers/eventController");

// ---------------- EVENTS ----------------
router.get("/", getAllEvents);
router.get("/search", searchEvents);

router.get("/interested/me", authMiddleware, getUserInterested);

router.get("/:id", getEventById);

router.post("/", adminMiddleware, createEvent);
router.put("/:id", adminMiddleware, updateEvent);
router.delete("/:id", adminMiddleware, deleteEvent);

// ---------------- INTEREST ----------------
router.get("/:id/interested/check", authMiddleware, checkInterested);
router.post("/:id/interested", authMiddleware, addInterested);
router.delete("/:id/interested", authMiddleware, removeInterested);

// ---------------- REGISTER ----------------
router.get("/:id/register/check", authMiddleware, checkRegistration);
router.post("/:id/register", authMiddleware, registerEvent);
router.delete("/:id/register", authMiddleware, cancelRegistration);

router.post("/:id/sponsor", authMiddleware, async (req, res) => {
  try {
    // 🟢 1. เอา event_id จาก URL
    req.body.event_id = req.params.id;
    req.body.request_by = "shop";

    // 🟢 2. map user → shop
    const rows = await query(
      `SELECT shop_id FROM tea_shop WHERE user_id = ?`,
      [req.user.user_id]
    );

    if (rows.length === 0) {
      return res.status(400).json({ message: "User is not a shop" });
    }

    req.body.shop_id = rows[0].shop_id;

    // 🟢 3. เรียก sponsorController เดิม
    return SponsorController.requestSponsor(req, res);

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Sponsor error" });
  }
});

router.get("/:id/sponsor/check", authMiddleware, async (req, res) => {
  try {
    const rows = await query(
      `SELECT shop_id FROM tea_shop WHERE user_id = ?`,
      [req.user.user_id]
    );

    if (rows.length === 0) {
      return res.json({ exists: false });
    }

    const shopId = rows[0].shop_id;

    const sponsor = await query(
      `SELECT status FROM sponsor WHERE event_id = ? AND shop_id = ? LIMIT 1`,
      [req.params.id, shopId]
    );

    if (sponsor.length === 0) {
      return res.json({ exists: false });
    }

    res.json({
      exists: true,
      status: sponsor[0].status
    });

  } catch (err) {
    res.status(500).json({ message: "Check sponsor error" });
  }
});


//เช็คshop sponอะไรไปจะได้แสดงผลถูก
router.get("/shop/available", authMiddleware, async (req, res) => {
  try {
    const rows = await query(
      `SELECT shop_id FROM tea_shop WHERE user_id = ?`,
      [req.user.user_id]
    );

    if (rows.length === 0) {
      return res.json([]);
    }

    const shopId = rows[0].shop_id;

    const events = await query(`
      SELECT * FROM event
      WHERE event_id NOT IN (
        SELECT event_id FROM sponsor WHERE shop_id = ?
      )
    `, [shopId]);

    res.json(events);

  } catch (err) {
    res.status(500).json({ message: "Error fetching events" });
  }
});


// 🔥 GET MY EVENTS (organizer)
router.get("/my-events", authMiddleware, async (req, res) => {
  try {
    const userId = req.user.user_id;

    const org = await query(
      "SELECT organizer_id FROM organizer WHERE user_id = ? AND verified_status = 1",
      [userId]
    );

    if (org.length === 0) {
      return res.json([]);
    }

    const events = await query(
      "SELECT * FROM event WHERE organizer_id = ? ORDER BY event_id DESC",
      [org[0].organizer_id]
    );

    res.json(events);

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Error" });
  }
});



module.exports = router;