const express = require("express");
const router = express.Router();
const adminMiddleware = require("../middleware/adminMiddleware");

const {
  getAllEvents,
  getEventById,
  createEvent,
  updateEvent,
  deleteEvent,
  searchEvents
} = require("../controllers/eventController");

router.get("/", getAllEvents);
router.get("/search", searchEvents);
router.get("/:id", getEventById);
router.post("/", adminMiddleware, createEvent);
router.put("/:id", adminMiddleware, updateEvent);
router.delete("/:id", adminMiddleware, deleteEvent);

module.exports = router;
