const express = require("express");
const router = express.Router();

const reportController = require("../controllers/reportController");
const authMiddleware = require("../middleware/authMiddleware");
const adminMiddleware = require("../middleware/adminMiddleware");

router.post("/", authMiddleware, reportController.createReport);
router.get("/events/:eventId/mine", authMiddleware, reportController.getMyEventReportStatus);
router.get("/", adminMiddleware, reportController.getReports);
router.patch("/:id/status", adminMiddleware, reportController.updateReportStatus);

module.exports = router;
