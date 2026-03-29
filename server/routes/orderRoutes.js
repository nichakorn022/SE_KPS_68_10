const express = require("express");
const router = express.Router();

const orderController = require("../controllers/orderController");
const authMiddleware = require("../middleware/authMiddleware");
const adminMiddleware = require("../middleware/adminMiddleware");

router.post("/", orderController.createOrder);
router.get("/", adminMiddleware, orderController.getOrders);
router.get("/seller/trend", authMiddleware, orderController.getSellerRevenueTrend);
router.get("/seller/summary", authMiddleware, orderController.getSellerWorkspaceSummary);
router.get("/user/:userId", authMiddleware, orderController.getOrdersByUser);
router.get("/:id", authMiddleware, orderController.getOrderById);
router.patch("/:id/mock-pay", authMiddleware, orderController.mockMarkOrderPaid);
router.patch("/:id/status", adminMiddleware, orderController.updateOrderStatus);
router.delete("/:id", adminMiddleware, orderController.deleteOrder);

module.exports = router;
