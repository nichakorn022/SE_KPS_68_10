const { query } = require("../utils/dbHelpers");

const allowedStatuses = new Set(["pending", "approved", "rejected", "cancelled"]);

function normalizeStatus(status, fallback = "pending") {
  const normalized = String(status || fallback).trim().toLowerCase();
  return allowedStatuses.has(normalized) ? normalized : fallback;
}

async function requestSponsor(data) {
  const eventId = Number(data.event_id);
  const shopId = Number(data.shop_id);
  const productId = Number(data.product_id);
  const quantity = Number(data.quantity);
  const requestBy = data.request_by ? String(data.request_by).trim().toLowerCase() : null;
  const status = normalizeStatus(data.status, "pending");

  if (!eventId || !shopId || !productId || !quantity) {
    const error = new Error("event_id, shop_id, product_id, and quantity are required");
    error.statusCode = 400;
    throw error;
  }

  const result = await query(
    `INSERT INTO sponsor (event_id, shop_id, product_id, quantity, request_by, status)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [eventId, shopId, productId, quantity, requestBy, status]
  );

  return {
    message: "Sponsor request created",
    sponsor_id: result.insertId
  };
}

async function getSponsorRequests() {
  return query(
    `SELECT
        s.sponsor_id,
        s.event_id,
        s.shop_id,
        s.product_id,
        s.quantity,
        s.request_by,
        s.status,
        s.admin_note,
        s.created_at,
        s.updated_at,
        e.title AS event_title,
        ts.shop_name,
        tp.tea_name AS product_name
     FROM sponsor s
     LEFT JOIN event e ON e.event_id = s.event_id
     LEFT JOIN tea_shop ts ON ts.shop_id = s.shop_id
     LEFT JOIN tea_product tp ON tp.product_id = s.product_id
     ORDER BY s.created_at DESC, s.sponsor_id DESC`
  );
}

async function updateSponsorStatus(id, status, adminNote) {
  const nextStatus = normalizeStatus(status);
  const result = await query(
    `UPDATE sponsor
     SET status = ?, admin_note = ?, updated_at = CURRENT_TIMESTAMP
     WHERE sponsor_id = ?`,
    [nextStatus, adminNote ?? null, id]
  );

  if (result.affectedRows === 0) {
    const error = new Error("Sponsor request not found");
    error.statusCode = 404;
    throw error;
  }

  return {
    message: "Sponsor status updated"
  };
}

module.exports = {
  requestSponsor,
  getSponsorRequests,
  updateSponsorStatus
};
