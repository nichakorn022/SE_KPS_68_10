const express = require("express");
const router = express.Router();

const orderController = require("../controllers/orderController");
const adminMiddleware = require("../middleware/adminMiddleware");

router.post("/", orderController.createOrder);
router.get("/", adminMiddleware, orderController.getOrders);
router.get("/user/:userId", orderController.getOrdersByUser);
router.get("/:id", adminMiddleware, orderController.getOrderById);
router.patch("/:id/status", adminMiddleware, orderController.updateOrderStatus);

module.exports = router;
