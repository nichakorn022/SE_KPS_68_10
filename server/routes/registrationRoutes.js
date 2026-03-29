const express = require("express");
const router = express.Router();

const RegistrationController = require("../controllers/RegistrationController");
const authMiddleware = require("../middleware/authMiddleware");
const adminMiddleware = require("../middleware/adminMiddleware");

router.get("/", RegistrationController.getRegistrations);
router.post("/", RegistrationController.registerEvent);
router.delete("/:id", RegistrationController.cancelRegistration);
router.get("/user/:userId", authMiddleware, RegistrationController.getUserRegistrations);
router.patch("/:id/status", adminMiddleware, RegistrationController.updateRegistrationStatus);
router.delete("/:id/hard-delete", adminMiddleware, RegistrationController.deleteRegistration);

module.exports = router;
