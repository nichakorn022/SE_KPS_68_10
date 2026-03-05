const db = require("../db");

const allowedStatuses = new Set(["pending", "paid", "cancelled"]);

function beginTransaction() {
  return new Promise((resolve, reject) => {
    db.beginTransaction((err) => {
      if (err) reject(err);
      else resolve();
    });
  });
}

function commit() {
  return new Promise((resolve, reject) => {
    db.commit((err) => {
      if (err) reject(err);
      else resolve();
    });
  });
}

function rollback() {
  return new Promise((resolve) => {
    db.rollback(() => resolve());
  });
}

function query(sql, values = []) {
  return new Promise((resolve, reject) => {
    db.query(sql, values, (err, result) => {
      if (err) reject(err);
      else resolve(result);
    });
  });
}

exports.createOrder = async (req, res) => {
  const { user_id, items } = req.body;

  if (user_id === undefined || user_id === null) {
    return res.status(400).json({ message: "user_id is required" });
  }

  if (!Array.isArray(items) || items.length === 0) {
    return res.status(400).json({ message: "items is required and must not be empty" });
  }

  for (const item of items) {
    if (
      item.product_id === undefined ||
      item.product_id === null ||
      !Number.isInteger(Number(item.quantity)) ||
      Number(item.quantity) <= 0
    ) {
      return res.status(400).json({
        message: "Each item must include product_id and quantity > 0"
      });
    }
  }

  try {
    await beginTransaction();

    let totalAmount = 0;
    const orderItems = [];

    for (const item of items) {
      const productRows = await query(
        "SELECT product_id, price, stock FROM tea_product WHERE product_id = ? FOR UPDATE",
        [item.product_id]
      );

      if (productRows.length === 0) {
        throw new Error(`Product ${item.product_id} not found`);
      }

      const product = productRows[0];
      const qty = Number(item.quantity);

      if (product.stock < qty) {
        throw new Error(`Not enough stock for product ${item.product_id}`);
      }

      const unitPrice = Number(product.price);
      const subtotal = unitPrice * qty;
      totalAmount += subtotal;

      orderItems.push({
        product_id: product.product_id,
        quantity: qty,
        unit_price: unitPrice,
        subtotal
      });
    }

    const orderResult = await query(
      "INSERT INTO orders (user_id, status, total_amount) VALUES (?, 'pending', ?)",
      [user_id, totalAmount]
    );

    const orderId = orderResult.insertId;

    for (const item of orderItems) {
      await query(
        `INSERT INTO order_details (order_id, product_id, quantity, unit_price, subtotal)
         VALUES (?, ?, ?, ?, ?)`,
        [orderId, item.product_id, item.quantity, item.unit_price, item.subtotal]
      );

      await query(
        "UPDATE tea_product SET stock = stock - ? WHERE product_id = ?",
        [item.quantity, item.product_id]
      );
    }

    await commit();

    return res.status(201).json({
      message: "Order created",
      order_id: orderId,
      total_amount: totalAmount
    });
  } catch (error) {
    await rollback();
    return res.status(400).json({ message: "Failed to create order", error: error.message });
  }
};

exports.getOrderById = async (req, res) => {
  const { id } = req.params;

  try {
    const orderRows = await query(
      "SELECT order_id, user_id, order_date, status, total_amount FROM orders WHERE order_id = ?",
      [id]
    );

    if (orderRows.length === 0) {
      return res.status(404).json({ message: "Order not found" });
    }

    const detailRows = await query(
      `SELECT od.order_detail_id, od.product_id, tp.tea_name, od.quantity, od.unit_price, od.subtotal
       FROM order_details od
       JOIN tea_product tp ON tp.product_id = od.product_id
       WHERE od.order_id = ?`,
      [id]
    );

    return res.json({
      ...orderRows[0],
      items: detailRows
    });
  } catch (error) {
    return res.status(500).json({ message: "Failed to fetch order", error });
  }
};

exports.getOrders = async (req, res) => {
  const { status, user_id } = req.query;
  const conditions = [];
  const values = [];

  if (status) {
    conditions.push("status = ?");
    values.push(status);
  }

  if (user_id !== undefined && user_id !== null && user_id !== "") {
    conditions.push("user_id = ?");
    values.push(user_id);
  }

  const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";

  try {
    const rows = await query(
      `SELECT order_id, user_id, order_date, status, total_amount
       FROM orders
       ${whereClause}
       ORDER BY order_date DESC`,
      values
    );

    return res.json(rows);
  } catch (error) {
    return res.status(500).json({ message: "Failed to fetch orders", error });
  }
};

exports.getOrdersByUser = async (req, res) => {
  const { userId } = req.params;

  try {
    const rows = await query(
      "SELECT order_id, user_id, order_date, status, total_amount FROM orders WHERE user_id = ? ORDER BY order_date DESC",
      [userId]
    );

    return res.json(rows);
  } catch (error) {
    return res.status(500).json({ message: "Failed to fetch user orders", error });
  }
};

exports.updateOrderStatus = async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;

  if (!allowedStatuses.has(status)) {
    return res.status(400).json({ message: "status must be pending, paid, or cancelled" });
  }

  try {
    await beginTransaction();

    const orderRows = await query(
      "SELECT order_id, status FROM orders WHERE order_id = ? FOR UPDATE",
      [id]
    );

    if (orderRows.length === 0) {
      await rollback();
      return res.status(404).json({ message: "Order not found" });
    }

    const currentStatus = orderRows[0].status;

    if (currentStatus === "cancelled") {
      await rollback();
      return res.status(400).json({ message: "Cancelled order cannot be updated" });
    }

    if (currentStatus === "paid" && status === "cancelled") {
      await rollback();
      return res.status(400).json({ message: "Paid order cannot be cancelled in this flow" });
    }

    if (currentStatus === status) {
      await rollback();
      return res.json({ message: "Order status unchanged" });
    }

    if (status === "cancelled") {
      const details = await query(
        "SELECT product_id, quantity FROM order_details WHERE order_id = ?",
        [id]
      );

      for (const item of details) {
        await query(
          "UPDATE tea_product SET stock = stock + ? WHERE product_id = ?",
          [item.quantity, item.product_id]
        );
      }
    }

    await query("UPDATE orders SET status = ? WHERE order_id = ?", [status, id]);
    await commit();

    return res.json({ message: "Order status updated" });
  } catch (error) {
    await rollback();
    return res.status(500).json({ message: "Failed to update order status", error });
  }
};
