const db = require("../db");

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

exports.getOrderDetailsByOrderId = async (req, res) => {
  const { orderId } = req.params;

  try {
    const rows = await query(
      `SELECT od.order_detail_id, od.order_id, od.product_id, tp.tea_name,
              od.quantity, od.unit_price, od.subtotal
       FROM order_details od
       JOIN tea_product tp ON tp.product_id = od.product_id
       WHERE od.order_id = ?
       ORDER BY od.order_detail_id ASC`,
      [orderId]
    );

    return res.json(rows);
  } catch (error) {
    return res.status(500).json({ message: "Failed to fetch order details", error });
  }
};

exports.getOrderDetailById = async (req, res) => {
  const { orderDetailId } = req.params;

  try {
    const rows = await query(
      `SELECT od.order_detail_id, od.order_id, od.product_id, tp.tea_name,
              od.quantity, od.unit_price, od.subtotal
       FROM order_details od
       JOIN tea_product tp ON tp.product_id = od.product_id
       WHERE od.order_detail_id = ?`,
      [orderDetailId]
    );

    if (rows.length === 0) {
      return res.status(404).json({ message: "Order detail not found" });
    }

    return res.json(rows[0]);
  } catch (error) {
    return res.status(500).json({ message: "Failed to fetch order detail", error });
  }
};

exports.updateOrderDetail = async (req, res) => {
  const { orderDetailId } = req.params;
  const { quantity } = req.body;

  const newQuantity = Number(quantity);
  if (!Number.isInteger(newQuantity) || newQuantity <= 0) {
    return res.status(400).json({ message: "quantity must be an integer greater than 0" });
  }

  try {
    await beginTransaction();

    const detailRows = await query(
      `SELECT od.order_detail_id, od.order_id, od.product_id, od.quantity, od.unit_price, o.status
       FROM order_details od
       JOIN orders o ON o.order_id = od.order_id
       WHERE od.order_detail_id = ?
       FOR UPDATE`,
      [orderDetailId]
    );

    if (detailRows.length === 0) {
      await rollback();
      return res.status(404).json({ message: "Order detail not found" });
    }

    const detail = detailRows[0];
    if (detail.status !== "pending") {
      await rollback();
      return res.status(400).json({ message: "Only pending orders can be edited" });
    }

    const productRows = await query(
      "SELECT stock FROM tea_product WHERE product_id = ? FOR UPDATE",
      [detail.product_id]
    );

    if (productRows.length === 0) {
      await rollback();
      return res.status(404).json({ message: "Product not found" });
    }

    const oldQuantity = Number(detail.quantity);
    const quantityDiff = newQuantity - oldQuantity;

    if (quantityDiff > 0 && productRows[0].stock < quantityDiff) {
      await rollback();
      return res.status(400).json({ message: "Not enough stock to increase quantity" });
    }

    const newSubtotal = Number(detail.unit_price) * newQuantity;
    const subtotalDiff = newSubtotal - Number(detail.unit_price) * oldQuantity;

    await query(
      "UPDATE order_details SET quantity = ?, subtotal = ? WHERE order_detail_id = ?",
      [newQuantity, newSubtotal, orderDetailId]
    );

    if (quantityDiff !== 0) {
      await query(
        "UPDATE tea_product SET stock = stock - ? WHERE product_id = ?",
        [quantityDiff, detail.product_id]
      );
    }

    await query(
      "UPDATE orders SET total_amount = total_amount + ? WHERE order_id = ?",
      [subtotalDiff, detail.order_id]
    );

    await commit();
    return res.json({ message: "Order detail updated" });
  } catch (error) {
    await rollback();
    return res.status(500).json({ message: "Failed to update order detail", error });
  }
};

exports.deleteOrderDetail = async (req, res) => {
  const { orderDetailId } = req.params;

  try {
    await beginTransaction();

    const detailRows = await query(
      `SELECT od.order_detail_id, od.order_id, od.product_id, od.quantity, od.subtotal, o.status
       FROM order_details od
       JOIN orders o ON o.order_id = od.order_id
       WHERE od.order_detail_id = ?
       FOR UPDATE`,
      [orderDetailId]
    );

    if (detailRows.length === 0) {
      await rollback();
      return res.status(404).json({ message: "Order detail not found" });
    }

    const detail = detailRows[0];
    if (detail.status !== "pending") {
      await rollback();
      return res.status(400).json({ message: "Only pending orders can be edited" });
    }

    await query(
      "UPDATE tea_product SET stock = stock + ? WHERE product_id = ?",
      [detail.quantity, detail.product_id]
    );

    await query("DELETE FROM order_details WHERE order_detail_id = ?", [orderDetailId]);

    await query(
      "UPDATE orders SET total_amount = total_amount - ? WHERE order_id = ?",
      [detail.subtotal, detail.order_id]
    );

    const remainingRows = await query(
      "SELECT COUNT(*) AS count_items FROM order_details WHERE order_id = ?",
      [detail.order_id]
    );

    if (remainingRows[0].count_items === 0) {
      await query("DELETE FROM orders WHERE order_id = ?", [detail.order_id]);
      await commit();
      return res.json({ message: "Order detail deleted and empty order removed" });
    }

    await commit();
    return res.json({ message: "Order detail deleted" });
  } catch (error) {
    await rollback();
    return res.status(500).json({ message: "Failed to delete order detail", error });
  }
};
