const orderService = require("../services/orderService");
const { query } = require("../utils/dbHelpers");
const { sendOrderPlacedEmail, sendOrderPaidEmail } = require("../utils/mailer");

async function fetchUserEmail(userId) {
  const rows = await query("SELECT username, email FROM users WHERE user_id = ? LIMIT 1", [userId]);
  return rows[0] || null;
}

async function fetchOrderItems(orderId) {
  return query(
    `SELECT od.product_id, tp.tea_name, od.quantity, od.unit_price, od.subtotal
     FROM order_details od
     JOIN tea_product tp ON tp.product_id = od.product_id
     WHERE od.order_id = ?`,
    [orderId]
  );
}

exports.createOrder = async (req, res) => {
  try {
    const result = await orderService.createOrder(req.body);

    // Send "order placed – please pay" email
    try {
      const userInfo = await fetchUserEmail(req.body.user_id);
      if (userInfo?.email) {
        const items = await fetchOrderItems(result.order_id);
        await sendOrderPlacedEmail({
          to: userInfo.email,
          username: userInfo.username,
          orderId: result.order_id,
          items,
          totalAmount: result.total_amount,
        });
      }
    } catch (emailError) {
      console.error("Failed to send order placed email:", emailError.message);
    }

    return res.status(201).json(result);
  } catch (error) {
    return res.status(error.statusCode || 400).json({
      message: "Failed to create order",
      error: error.message,
    });
  }
};

exports.getOrderById = async (req, res) => {
  const { id } = req.params;

  try {
    const result = await orderService.getOrderById(id);
    if (req.user?.role !== "admin" && Number(result.user_id) !== Number(req.user?.user_id)) {
      return res.status(403).json({
        message: "You do not have access to this order",
      });
    }
    return res.json(result);
  } catch (error) {
    return res.status(error.statusCode || 500).json({
      message: "Failed to fetch order",
      error,
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
    if (req.user?.role !== "admin" && Number(userId) !== Number(req.user?.user_id)) {
      return res.status(403).json({
        message: "You do not have access to these orders",
      });
    }
    const rows = await orderService.getOrdersByUser(userId);
    return res.json(rows);
  } catch (error) {
    return res.status(500).json({ message: "Failed to fetch user orders", error });
  }
};

exports.getSellerRevenueTrend = async (req, res) => {
  try {
    if (req.user?.role !== "shop") {
      return res.status(403).json({
        message: "This dashboard is available only for shop accounts",
      });
    }

    const days = Number(req.query.days || 7);
    const result = await orderService.getSellerRevenueTrend(req.user.user_id, days);
    return res.json(result);
  } catch (error) {
    const statusCode = error.statusCode || 500;
    return res.status(statusCode).json({
      message: statusCode >= 400 && statusCode < 500 ? error.message : "Failed to fetch seller revenue trend",
      error: error.message,
    });
  }
};

exports.getSellerWorkspaceSummary = async (req, res) => {
  try {
    if (req.user?.role !== "shop") {
      return res.status(403).json({
        message: "This workspace is available only for shop accounts",
      });
    }

    const result = await orderService.getSellerWorkspaceSummary(req.user.user_id);
    return res.json(result);
  } catch (error) {
    const statusCode = error.statusCode || 500;
    return res.status(statusCode).json({
      message: statusCode >= 400 && statusCode < 500 ? error.message : "Failed to fetch seller workspace summary",
      error: error.message,
    });
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
      error,
    });
  }
};

exports.mockMarkOrderPaid = async (req, res) => {
  const { id } = req.params;

  try {
    const order = await orderService.getOrderById(id);
    if (req.user?.role !== "admin" && Number(order.user_id) !== Number(req.user?.user_id)) {
      return res.status(403).json({ message: "You do not have access to this order" });
    }

    const result = await orderService.markOrderPaid(id);

    // Send "payment success" email
    if (result.message !== "Order already paid") {
      try {
        const userInfo = await fetchUserEmail(order.user_id);
        if (userInfo?.email) {
          const items = await fetchOrderItems(id);
          await sendOrderPaidEmail({
            to: userInfo.email,
            username: userInfo.username,
            orderId: id,
            items,
            totalAmount: order.total_amount,
          });
        }
      } catch (emailError) {
        console.error("Failed to send order paid email:", emailError.message);
      }
    }

    return res.json(result);
  } catch (error) {
    return res.status(error.statusCode || 500).json({
      message: error.message || "Failed to mark order as paid",
    });
  }
};

exports.deleteOrder = async (req, res) => {
  const { id } = req.params;

  try {
    const result = await orderService.deleteOrder(id);
    return res.json(result);
  } catch (error) {
    return res.status(error.statusCode || 500).json({
      message: error.message || "Failed to delete order"
    });
  }
};
