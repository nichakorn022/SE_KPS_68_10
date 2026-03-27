const express = require("express");
const router = express.Router();

const authMiddleware = require("../middleware/authMiddleware");
const chatController = require("../controllers/chatController");

router.use(authMiddleware);
router.get("/shops/:shopId", chatController.getChatRoomByShop);
router.post("/shops/:shopId/messages", chatController.createChatMessage);

module.exports = router;
