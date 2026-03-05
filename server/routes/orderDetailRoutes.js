const express = require("express");
const router = express.Router();

const orderDetailController = require("../controllers/orderDetailController");

router.get("/order/:orderId", orderDetailController.getOrderDetailsByOrderId);
router.get("/:orderDetailId", orderDetailController.getOrderDetailById);
router.patch("/:orderDetailId", orderDetailController.updateOrderDetail);
router.delete("/:orderDetailId", orderDetailController.deleteOrderDetail);

module.exports = router;
