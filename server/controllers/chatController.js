const chatService = require("../services/chatService");

function getUserId(req) {
  return Number(req.user?.user_id);
}

exports.getChatRoomByShop = async (req, res) => {
  try {
    const result = await chatService.getChatRoomByShop(getUserId(req), Number(req.params.shopId));
    return res.json(result);
  } catch (error) {
    return res.status(error.statusCode || 500).json({
      message: "Failed to fetch chat room",
      error: error.message,
    });
  }
};

exports.createChatMessage = async (req, res) => {
  try {
    const result = await chatService.createChatMessage(getUserId(req), Number(req.params.shopId), req.body);
    return res.status(201).json(result);
  } catch (error) {
    return res.status(error.statusCode || 500).json({
      message: "Failed to create chat message",
      error: error.message,
    });
  }
};
