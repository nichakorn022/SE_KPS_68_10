const express = require("express");
const router = express.Router();

const reportController = require("../controllers/reportController");
const adminMiddleware = require("../middleware/adminMiddleware");

router.get("/", adminMiddleware, reportController.getReports);
router.patch("/:id/status", adminMiddleware, reportController.updateReportStatus);

module.exports = router;
