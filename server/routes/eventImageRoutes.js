const express = require("express");
const router = express.Router();

const eventImageController = require("../controllers/eventImageController");
const { uploadImage } = require("../middleware/uploadMiddleware");

router.get("/", eventImageController.getEventImages);
router.get("/event/:eventId", eventImageController.getEventImagesByEventId);
router.get("/:id", eventImageController.getEventImageById);
router.post("/", uploadImage.single("image"), eventImageController.createEventImage);
router.delete("/:id", eventImageController.deleteEventImage);

module.exports = router;
