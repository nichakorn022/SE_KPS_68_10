const express = require("express");
const router = express.Router();

const organizerController = require("../controllers/organizerController");
const adminMiddleware = require("../middleware/adminMiddleware");
const authMiddleware = require("../middleware/authMiddleware");

const { query } = require("../utils/dbHelpers");

router.get("/", adminMiddleware, organizerController.getOrganizers);
router.patch("/:id/verification", adminMiddleware, organizerController.updateOrganizerVerification);
// 🔥 สมัคร organizer
// ================== REGISTER ORGANIZER (FULL DATA) ==================
router.post("/register", authMiddleware, async (req, res) => {
  try {
    const userId = req.user.user_id;

    const {
      first_name,
      last_name,
      birth_date,
      phone,
      address,
      province,
      district,
      subdistrict,
      national_id,
      organization_name,
      description
    } = req.body;

    // 🔥 กันสมัครซ้ำ
    const existing = await query(
      "SELECT organizer_id FROM organizer WHERE user_id = ? LIMIT 1",
      [userId]
    );

    if (existing.length > 0) {
      return res.status(400).json({ message: "Already registered" });
    }

    // 🔥 insert ครบทุก field
    await query(`
      INSERT INTO organizer
      (user_id, first_name, last_name, birth_date, phone, address, province, district, subdistrict, national_id, organization_name, description, verified_status)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0)
    `, [
  userId,
  first_name || null,
  last_name || null,
  birth_date || null,   // 🔥 สำคัญ
  phone || null,
  address || null,
  province || null,
  district || null,
  subdistrict || null,
  national_id || null,
  organization_name,     // ❗ ต้องมี
  description || null
    ]);

    res.json({ message: "สมัครสำเร็จ รอ admin อนุมัติ" });

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Error" });
  }
});


// ================== GET MY ORGANIZER ==================
router.get("/me", authMiddleware, async (req, res) => {
  try {
    const userId = req.user.user_id;

    const rows = await query(
      "SELECT organizer_id, verified_status FROM organizer WHERE user_id = ? LIMIT 1",
      [userId]
    );

    if (rows.length === 0) {
      return res.json({ exists: false });
    }

    res.json({
      exists: true,
      organizer_id: rows[0].organizer_id,
      verified_status: rows[0].verified_status
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Error fetching organizer" });
  }
});

module.exports = router;
