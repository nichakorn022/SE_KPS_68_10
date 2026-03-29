const express = require("express");
const router = express.Router();

const RegistrationController = require("../controllers/RegistrationController");
const authMiddleware = require("../middleware/authMiddleware");

router.get("/", RegistrationController.getRegistrations);
router.post("/", RegistrationController.registerEvent);
router.delete("/:id", RegistrationController.cancelRegistration);
router.get("/user/:userId", authMiddleware, RegistrationController.getUserRegistrations);

module.exports = router;
