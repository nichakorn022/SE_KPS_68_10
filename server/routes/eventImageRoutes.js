const express = require("express");
const router = express.Router();

const eventImageController = require("../controllers/eventImageController");
const authMiddleware = require("../middleware/authMiddleware");
const { uploadImage } = require("../middleware/uploadMiddleware");

router.get("/", eventImageController.getEventImages);
router.get("/event/:eventId", eventImageController.getEventImagesByEventId);
router.get("/:id", eventImageController.getEventImageById);
router.post("/", authMiddleware, uploadImage.single("image"), eventImageController.createEventImage);
router.delete("/:id", authMiddleware, eventImageController.deleteEventImage);

module.exports = router;
