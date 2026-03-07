const orderService = require("../services/orderService");

exports.createOrder = async (req, res) => {
  try {
    const result = await orderService.createOrder(req.body);
    return res.status(201).json(result);
  } catch (error) {
    return res.status(error.statusCode || 400).json({
      message: "Failed to create order",
      error: error.message
    });
  }
};

exports.getOrderById = async (req, res) => {
  const { id } = req.params;

  try {
    const result = await orderService.getOrderById(id);
    return res.json(result);
  } catch (error) {
    return res.status(error.statusCode || 500).json({
      message: "Failed to fetch order",
      error
    });
  }
};

exports.getOrders = async (req, res) => {
  try {
    const rows = await orderService.getOrders(req.query);
    return res.json(rows);
  } catch (error) {
    return res.status(500).json({ message: "Failed to fetch orders", error });
  }
};

exports.getOrdersByUser = async (req, res) => {
  const { userId } = req.params;

  try {
    const rows = await orderService.getOrdersByUser(userId);
    return res.json(rows);
  } catch (error) {
    return res.status(500).json({ message: "Failed to fetch user orders", error });
  }
};

exports.updateOrderStatus = async (req, res) => {
  const { id } = req.params;

  try {
    const result = await orderService.updateOrderStatus(id, req.body.status);
    return res.json(result);
  } catch (error) {
    return res.status(error.statusCode || 500).json({
      message: "Failed to update order status",
      error
    });
  }
};
