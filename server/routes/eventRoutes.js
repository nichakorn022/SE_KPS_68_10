const express = require("express");
const router = express.Router();

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
router.post("/", createEvent);
router.put("/:id", updateEvent);
router.delete("/:id", deleteEvent);

module.exports = router;