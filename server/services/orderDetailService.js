const { beginTransaction, commit, rollback, query } = require("../utils/dbHelpers");

async function getOrderDetailsByOrderId(orderId) {
  return query(
    `SELECT od.order_detail_id, od.order_id, od.product_id, tp.tea_name,
            od.quantity, od.unit_price, od.subtotal
     FROM order_details od
     JOIN tea_product tp ON tp.product_id = od.product_id
     WHERE od.order_id = ?
     ORDER BY od.order_detail_id ASC`,
    [orderId]
  );
}

async function getOrderDetailById(orderDetailId) {
  const rows = await query(
    `SELECT od.order_detail_id, od.order_id, od.product_id, tp.tea_name,
            od.quantity, od.unit_price, od.subtotal
     FROM order_details od
     JOIN tea_product tp ON tp.product_id = od.product_id
     WHERE od.order_detail_id = ?`,
    [orderDetailId]
  );

  if (rows.length === 0) {
    const error = new Error("Order detail not found");
    error.statusCode = 404;
    throw error;
  }

  return rows[0];
}

async function updateOrderDetail(orderDetailId, quantity) {
  const newQuantity = Number(quantity);
  if (!Number.isInteger(newQuantity) || newQuantity <= 0) {
    const error = new Error("quantity must be an integer greater than 0");
    error.statusCode = 400;
    throw error;
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
      const error = new Error("Order detail not found");
      error.statusCode = 404;
      throw error;
    }

    const detail = detailRows[0];
    if (detail.status !== "pending") {
      const error = new Error("Only pending orders can be edited");
      error.statusCode = 400;
      throw error;
    }

    const productRows = await query(
      "SELECT stock FROM tea_product WHERE product_id = ? FOR UPDATE",
      [detail.product_id]
    );

    if (productRows.length === 0) {
      const error = new Error("Product not found");
      error.statusCode = 404;
      throw error;
    }

    const oldQuantity = Number(detail.quantity);
    const quantityDiff = newQuantity - oldQuantity;

    if (quantityDiff > 0 && productRows[0].stock < quantityDiff) {
      const error = new Error("Not enough stock to increase quantity");
      error.statusCode = 400;
      throw error;
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
    return { message: "Order detail updated" };
  } catch (error) {
    await rollback();
    throw error;
  }
}

async function deleteOrderDetail(orderDetailId) {
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
      const error = new Error("Order detail not found");
      error.statusCode = 404;
      throw error;
    }

    const detail = detailRows[0];
    if (detail.status !== "pending") {
      const error = new Error("Only pending orders can be edited");
      error.statusCode = 400;
      throw error;
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
      return { message: "Order detail deleted and empty order removed" };
    }

    await commit();
    return { message: "Order detail deleted" };
  } catch (error) {
    await rollback();
    throw error;
  }
}

module.exports = {
  getOrderDetailsByOrderId,
  getOrderDetailById,
  updateOrderDetail,
  deleteOrderDetail
};
