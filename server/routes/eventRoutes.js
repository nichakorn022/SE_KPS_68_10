const express = require("express");
const router = express.Router();
const adminMiddleware = require("../middleware/adminMiddleware");
const authMiddleware = require("../middleware/authMiddleware");

const {
  getAllEvents,
  getEventById,
  createEvent,
  updateEvent,
  deleteEvent,
  searchEvents,
  addInterested,
  removeInterested,
  checkInterested,
  getUserInterested,
  registerEvent,
  cancelRegistration,
  checkRegistration
} = require("../controllers/eventController");

// ---------------- EVENTS ----------------
router.get("/", getAllEvents);
router.get("/search", searchEvents);

router.get("/interested/me", authMiddleware, getUserInterested);

router.get("/:id", getEventById);

router.post("/", adminMiddleware, createEvent);
router.put("/:id", adminMiddleware, updateEvent);
router.delete("/:id", adminMiddleware, deleteEvent);

// ---------------- INTEREST ----------------
router.get("/:id/interested/check", authMiddleware, checkInterested);
router.post("/:id/interested", authMiddleware, addInterested);
router.delete("/:id/interested", authMiddleware, removeInterested);

// ---------------- REGISTER ----------------
router.get("/:id/register/check", authMiddleware, checkRegistration);
router.post("/:id/register", authMiddleware, registerEvent);
router.delete("/:id/register", authMiddleware, cancelRegistration);

module.exports = router;