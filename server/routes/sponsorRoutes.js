const express = require("express");
const router = express.Router();

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

module.exports = router;
