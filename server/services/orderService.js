const { beginTransaction, commit, rollback, query } = require("../utils/dbHelpers");

const allowedStatuses = new Set(["pending", "paid", "cancelled"]);
const orderSelectFields = `
  SELECT order_id, user_id, order_date, status, payment_status, fulfillment_status, total_amount,
         NULL AS address_id, NULL AS recipient_name, NULL AS phone,
         NULL AS shipping_address, NULL AS subdistrict, NULL AS district,
         NULL AS province, NULL AS postal_code, NULL AS address_note
`;

function formatSqlDate(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function buildDailySeries(rows, startDate, endDate) {
  const byDay = new Map(
    (Array.isArray(rows) ? rows : []).map((row) => [
      row.order_day,
      {
        revenue: Number(row.revenue || 0),
        units: Number(row.units || 0),
      },
    ])
  );

  const points = [];
  const cursor = new Date(startDate);

  while (cursor <= endDate) {
    const key = formatSqlDate(cursor);
    const entry = byDay.get(key) || { revenue: 0, units: 0 };
    points.push({
      date: key,
      revenue: entry.revenue,
      units: entry.units,
    });
    cursor.setDate(cursor.getDate() + 1);
  }

  return points;
}

async function ensureShopByOwner(userId) {
  const rows = await query("SELECT shop_id FROM tea_shop WHERE user_id = ? LIMIT 1", [userId]);

  if (rows.length === 0) {
    const error = new Error("Shop profile not found for this account");
    error.statusCode = 404;
    throw error;
  }

  return rows[0];
}

async function createOrder({
  user_id,
  items,
}) {
  if (user_id === undefined || user_id === null) {
    const error = new Error("user_id is required");
    error.statusCode = 400;
    throw error;
  }

  if (!Array.isArray(items) || items.length === 0) {
    const error = new Error("items is required and must not be empty");
    error.statusCode = 400;
    throw error;
  }

  for (const item of items) {
    if (
      item.product_id === undefined ||
      item.product_id === null ||
      !Number.isInteger(Number(item.quantity)) ||
      Number(item.quantity) <= 0
    ) {
      const error = new Error("Each item must include product_id and quantity > 0");
      error.statusCode = 400;
      throw error;
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
        const error = new Error(`Product ${item.product_id} not found`);
        error.statusCode = 404;
        throw error;
      }

      const product = productRows[0];
      const qty = Number(item.quantity);

      if (product.stock < qty) {
        const error = new Error(`Not enough stock for product ${item.product_id}`);
        error.statusCode = 400;
        throw error;
      }

      const unitPrice = Number(product.price);
      const subtotal = unitPrice * qty;
      totalAmount += subtotal;

      orderItems.push({
        product_id: product.product_id,
        quantity: qty,
        unit_price: unitPrice,
        subtotal,
      });
    }

    const orderResult = await query(
      `INSERT INTO orders (user_id, status, payment_status, fulfillment_status, total_amount)
       VALUES (?, 'pending', 'unpaid', 'pending', ?)`,
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

    return {
      message: "Order created",
      order_id: orderId,
      total_amount: totalAmount,
    };
  } catch (error) {
    await rollback();
    throw error;
  }
}

async function getOrderById(id) {
  const orderRows = await query(
    `${orderSelectFields}
     FROM orders
     WHERE order_id = ?`,
    [id]
  );

  if (orderRows.length === 0) {
    const error = new Error("Order not found");
    error.statusCode = 404;
    throw error;
  }

  const detailRows = await query(
    `SELECT od.order_detail_id, od.product_id, tp.tea_name, od.quantity, od.unit_price, od.subtotal
     FROM order_details od
     JOIN tea_product tp ON tp.product_id = od.product_id
     WHERE od.order_id = ?`,
    [id]
  );

  return {
    ...orderRows[0],
    items: detailRows,
  };
}

async function getOrders({ status, user_id }) {
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

  return query(
    `${orderSelectFields}
     FROM orders
     ${whereClause}
     ORDER BY order_date DESC`,
    values
  );
}

async function getOrdersByUser(userId) {
  return query(
    `${orderSelectFields}
     FROM orders
     WHERE user_id = ?
     ORDER BY order_date DESC`,
    [userId]
  );
}

async function getSellerRevenueTrend(userId, days = 7) {
  const safeDays = Number(days);

  if (!Number.isInteger(safeDays) || safeDays <= 0 || safeDays > 365) {
    const error = new Error("days must be an integer between 1 and 365");
    error.statusCode = 400;
    throw error;
  }

  await ensureShopByOwner(userId);

  const endDate = new Date();
  endDate.setHours(0, 0, 0, 0);

  const startDate = new Date(endDate);
  startDate.setDate(endDate.getDate() - safeDays + 1);

  const startKey = formatSqlDate(startDate);
  const endKey = formatSqlDate(endDate);

  const rows = await query(
    `SELECT
        DATE_FORMAT(o.order_date, '%Y-%m-%d') AS order_day,
        COALESCE(SUM(od.subtotal), 0) AS revenue,
        COALESCE(SUM(od.quantity), 0) AS units
     FROM tea_shop ts
     JOIN tea_product tp ON tp.shop_id = ts.shop_id
     JOIN order_details od ON od.product_id = tp.product_id
     JOIN orders o ON o.order_id = od.order_id
     WHERE ts.user_id = ?
       AND o.status = 'paid'
       AND DATE(o.order_date) BETWEEN ? AND ?
     GROUP BY DATE_FORMAT(o.order_date, '%Y-%m-%d')
     ORDER BY order_day ASC`,
    [userId, startKey, endKey]
  );

  const points = buildDailySeries(rows, startDate, endDate);
  const totalRevenue = points.reduce((sum, point) => sum + Number(point.revenue || 0), 0);
  const totalUnits = points.reduce((sum, point) => sum + Number(point.units || 0), 0);

  return {
    days: safeDays,
    start_date: startKey,
    end_date: endKey,
    total_revenue: totalRevenue,
    total_units: totalUnits,
    points,
  };
}

async function updateOrderStatus(id, status) {
  if (!allowedStatuses.has(status)) {
    const error = new Error("status must be pending, paid, or cancelled");
    error.statusCode = 400;
    throw error;
  }

  try {
    await beginTransaction();

    const orderRows = await query(
      "SELECT order_id, status FROM orders WHERE order_id = ? FOR UPDATE",
      [id]
    );

    if (orderRows.length === 0) {
      const error = new Error("Order not found");
      error.statusCode = 404;
      throw error;
    }

    const currentStatus = orderRows[0].status;

    if (currentStatus === "cancelled") {
      const error = new Error("Cancelled order cannot be updated");
      error.statusCode = 400;
      throw error;
    }

    if (currentStatus === "paid" && status === "cancelled") {
      const error = new Error("Paid order cannot be cancelled in this flow");
      error.statusCode = 400;
      throw error;
    }

    if (currentStatus === status) {
      await rollback();
      return { message: "Order status unchanged" };
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

    return { message: "Order status updated" };
  } catch (error) {
    await rollback();
    throw error;
  }
}

async function markOrderPaid(id) {
  try {
    await beginTransaction();

    const orderRows = await query(
      "SELECT order_id, status, payment_status FROM orders WHERE order_id = ? FOR UPDATE",
      [id]
    );

    if (orderRows.length === 0) {
      const error = new Error("Order not found");
      error.statusCode = 404;
      throw error;
    }

    const current = orderRows[0];

    if (current.status === "cancelled") {
      const error = new Error("Cancelled order cannot be marked as paid");
      error.statusCode = 400;
      throw error;
    }

    if (current.status === "paid" && current.payment_status === "paid") {
      await rollback();
      return { message: "Order already paid" };
    }

    await query(
      "UPDATE orders SET status = 'paid', payment_status = 'paid' WHERE order_id = ?",
      [id]
    );

    await commit();
    return { message: "Order marked as paid" };
  } catch (error) {
    await rollback();
    throw error;
  }
}

module.exports = {
  createOrder,
  getOrderById,
  getOrders,
  getOrdersByUser,
  getSellerRevenueTrend,
  updateOrderStatus,
  markOrderPaid,
};

