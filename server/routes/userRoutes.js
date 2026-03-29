const express = require("express");
const router = express.Router();

const UserController = require("../controllers/userController");

const authMiddleware = require("../middleware/authMiddleware");
const adminMiddleware = require("../middleware/adminMiddleware");
const { uploadImage } = require("../middleware/uploadMiddleware");

router.get("/", adminMiddleware, UserController.getUsers);
router.get("/:id", authMiddleware, UserController.getUserById);
router.patch("/:id", adminMiddleware, UserController.updateUser);
router.delete("/:id", adminMiddleware, UserController.deleteUser);

// upload avatar (multipart/form-data) - field name: avatar
router.post("/:id/avatar", authMiddleware, uploadImage.single("avatar"), UserController.uploadAvatar);

module.exports = router;
