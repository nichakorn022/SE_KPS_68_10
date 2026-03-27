const express = require("express");
const router = express.Router();

const organizerController = require("../controllers/organizerController");
const adminMiddleware = require("../middleware/adminMiddleware");

router.get("/", adminMiddleware, organizerController.getOrganizers);
router.patch("/:id/verification", adminMiddleware, organizerController.updateOrganizerVerification);

module.exports = router;
