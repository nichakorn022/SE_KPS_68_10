const express = require("express");
const router = express.Router();
const { query } = require("../utils/dbHelpers");
const SponsorController = require("../controllers/SponsorController");
const authMiddleware = require("../middleware/authMiddleware");
const adminMiddleware = require("../middleware/adminMiddleware");

router.post("/request", authMiddleware, SponsorController.requestSponsor);
router.get("/my", authMiddleware, SponsorController.getMySponsorRequests);
router.get("/my-requests", authMiddleware, SponsorController.getIncomingSponsorRequestsForShop);
router.get("/check", authMiddleware, async (req, res) => {
  const { shop_id, event_id } = req.query;

  const rows = await query(
    "SELECT sponsor_id, status FROM sponsor WHERE shop_id = ? AND event_id = ?",
    [shop_id, event_id]
  );

  if (rows.length === 0) {
    return res.json({ exists: false });
  }

  res.json({
    exists: true,
    sponsor_id: rows[0].sponsor_id || null,
    status: rows[0].status,
  });
});

router.patch("/:id/cancel", authMiddleware, SponsorController.cancelSponsorRequestByOrganizer);

router.put("/:id/approve", authMiddleware, (req, res) => {
  req.body = { ...(req.body || {}), status: "approved" };
  return SponsorController.updateSponsorStatusByShop(req, res);
});

router.put("/:id/reject", authMiddleware, (req, res) => {
  req.body = { ...(req.body || {}), status: "rejected" };
  return SponsorController.updateSponsorStatusByShop(req, res);
});

router.get("/", adminMiddleware, SponsorController.getSponsorRequests);
router.patch("/:id/status", adminMiddleware, SponsorController.updateSponsorStatus);
router.delete("/:id", adminMiddleware, SponsorController.deleteSponsorRequest);

// Backward-compatible admin aliases.
router.get("/requests", adminMiddleware, SponsorController.getSponsorRequests);
router.put("/approve/:id", adminMiddleware, (req, res) => {
  req.body = { ...(req.body || {}), status: "approved" };
  return SponsorController.updateSponsorStatus(req, res);
});

module.exports = router;
