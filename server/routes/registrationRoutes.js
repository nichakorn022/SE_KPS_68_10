const express = require("express");
const router = express.Router();

const RegistrationController = require("../controllers/RegistrationController");

router.get("/", RegistrationController.getRegistrations);
router.post("/", RegistrationController.registerEvent);
router.delete("/:id", RegistrationController.cancelRegistration);
router.get("/user/:userId", RegistrationController.getUserRegistrations);

module.exports = router;
