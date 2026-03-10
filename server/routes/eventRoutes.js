const express = require("express");
const router = express.Router();

const {
  getAllEvents,
  getEventById
} = require("../controllers/eventController");

router.get("/", getAllEvents);      // สำคัญ
router.get("/:id", getEventById);

module.exports = router;