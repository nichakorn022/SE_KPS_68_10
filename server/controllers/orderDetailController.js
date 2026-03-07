const orderDetailService = require("../services/orderDetailService");

exports.getOrderDetailsByOrderId = async (req, res) => {
  const { orderId } = req.params;

  try {
    const rows = await orderDetailService.getOrderDetailsByOrderId(orderId);
    return res.json(rows);
  } catch (error) {
    return res.status(500).json({ message: "Failed to fetch order details", error });
  }
};

exports.getOrderDetailById = async (req, res) => {
  const { orderDetailId } = req.params;

  try {
    const result = await orderDetailService.getOrderDetailById(orderDetailId);
    return res.json(result);
  } catch (error) {
    return res.status(error.statusCode || 500).json({
      message: "Failed to fetch order detail",
      error
    });
  }
};

exports.updateOrderDetail = async (req, res) => {
  const { orderDetailId } = req.params;

  try {
    const result = await orderDetailService.updateOrderDetail(orderDetailId, req.body.quantity);
    return res.json(result);
  } catch (error) {
    return res.status(error.statusCode || 500).json({
      message: "Failed to update order detail",
      error
    });
  }
};

exports.deleteOrderDetail = async (req, res) => {
  const { orderDetailId } = req.params;

  try {
    const result = await orderDetailService.deleteOrderDetail(orderDetailId);
    return res.json(result);
  } catch (error) {
    return res.status(error.statusCode || 500).json({
      message: "Failed to delete order detail",
      error
    });
  }
};
