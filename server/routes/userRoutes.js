const express = require("express");
const router = express.Router();

const UserController = require("../controllers/userController");

const authMiddleware = require("../middleware/authMiddleware");
const { uploadImage } = require("../middleware/uploadMiddleware");

router.get("/:id", authMiddleware, UserController.getUserById);

// upload avatar (multipart/form-data) - field name: avatar
router.post("/:id/avatar", authMiddleware, uploadImage.single("avatar"), UserController.uploadAvatar);

module.exports = router;
