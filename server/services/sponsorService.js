const { query } = require("../utils/dbHelpers");
const { sendApprovalDecisionEmail } = require("../utils/mailer");

const allowedStatuses = new Set(["pending", "approved", "rejected", "cancelled"]);

function normalizeStatus(status, fallback = "pending") {
  const normalized = String(status || fallback).trim().toLowerCase();
  return allowedStatuses.has(normalized) ? normalized : fallback;
}

async function createOrRefreshSponsorRequest({ eventId, shopId, productId = null, quantity = null, requestBy, status }) {
  const existing = await query(
    `SELECT sponsor_id, status
     FROM sponsor
     WHERE event_id = ? AND shop_id = ?
     LIMIT 1`,
    [eventId, shopId]
  );

  if (existing.length > 0) {
    const currentStatus = normalizeStatus(existing[0].status);

    if (currentStatus === "pending" || currentStatus === "approved") {
      const error = new Error("A sponsor request already exists for this event and shop");
      error.statusCode = 400;
      throw error;
    }

    await query(
      `UPDATE sponsor
       SET product_id = ?, quantity = ?, request_by = ?, status = ?, updated_at = CURRENT_TIMESTAMP
       WHERE sponsor_id = ?`,
      [productId, quantity, requestBy, status, existing[0].sponsor_id]
    );

    return {
      message: "Sponsor request re-sent",
      sponsor_id: existing[0].sponsor_id,
    };
  }

  const result = await query(
    `INSERT INTO sponsor (event_id, shop_id, product_id, quantity, request_by, status)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [eventId, shopId, productId, quantity, requestBy, status]
  );

  return {
    message: "Sponsor request created",
    sponsor_id: result.insertId,
  };
}

async function requestSponsor(data, requesterUserId) {
  const eventId = Number(data.event_id);
  const shopId = Number(data.shop_id);
  const requestBy = data.request_by ? String(data.request_by).trim().toLowerCase() : "shop";
  const status = normalizeStatus(data.status, "pending");

  if (!eventId || !shopId) {
    const error = new Error("event_id and shop_id are required");
    error.statusCode = 400;
    throw error;
  }

  if (requestBy === "organizer") {
    const organizerRows = await query(
      `SELECT organizer_id
       FROM organizer
       WHERE user_id = ? AND verified_status = 1
       LIMIT 1`,
      [requesterUserId]
    );

    if (organizerRows.length === 0) {
      const error = new Error("You must be a verified organizer to send sponsor requests");
      error.statusCode = 403;
      throw error;
    }

    const eventRows = await query(
      `SELECT event_id, organizer_id
       FROM event
       WHERE event_id = ?
       LIMIT 1`,
      [eventId]
    );

    if (eventRows.length === 0) {
      const error = new Error("Event not found");
      error.statusCode = 404;
      throw error;
    }

    if (Number(eventRows[0].organizer_id) !== Number(organizerRows[0].organizer_id)) {
      const error = new Error("You can only request sponsors for your own events");
      error.statusCode = 403;
      throw error;
    }

    const shopRows = await query(
      `SELECT shop_id
       FROM tea_shop
       WHERE shop_id = ?
       LIMIT 1`,
      [shopId]
    );

    if (shopRows.length === 0) {
      const error = new Error("Shop not found");
      error.statusCode = 404;
      throw error;
    }

    return createOrRefreshSponsorRequest({
      eventId,
      shopId,
      requestBy: "organizer",
      status,
    });
  }

  const shopRows = await query(
    `SELECT shop_id
     FROM tea_shop
     WHERE user_id = ?
     LIMIT 1`,
    [requesterUserId]
  );

  if (shopRows.length === 0) {
    const error = new Error("You must be a shop account to sponsor an event");
    error.statusCode = 403;
    throw error;
  }

  const resolvedShopId = Number(shopRows[0].shop_id);
  const productId = Number(data.product_id);
  const quantity = Number(data.quantity);

  if (resolvedShopId !== shopId) {
    const error = new Error("You can only send sponsor requests from your own shop");
    error.statusCode = 403;
    throw error;
  }

  if (!productId || !quantity) {
    const error = new Error("product_id and quantity are required");
    error.statusCode = 400;
    throw error;
  }

  const productRows = await query(
    `SELECT shop_id
     FROM tea_product
     WHERE product_id = ?`,
    [productId]
  );

  if (productRows.length === 0 || Number(productRows[0].shop_id) !== resolvedShopId) {
    const error = new Error("This product does not belong to your shop");
    error.statusCode = 403;
    throw error;
  }

  return createOrRefreshSponsorRequest({
    eventId,
    shopId: resolvedShopId,
    productId,
    quantity,
    requestBy: "shop",
    status,
  });
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
        s.created_at,
        s.updated_at,
        e.title AS event_title,
        ts.shop_name,
        tp.tea_name AS product_name,
        u.email,
        u.username
     FROM sponsor s
     LEFT JOIN event e ON e.event_id = s.event_id
     LEFT JOIN tea_shop ts ON ts.shop_id = s.shop_id
     LEFT JOIN users u ON u.user_id = ts.user_id
     LEFT JOIN tea_product tp ON tp.product_id = s.product_id
     ORDER BY s.created_at DESC, s.sponsor_id DESC`
  );
}

async function getShopSponsorRequests(userId) {
  return query(
    `SELECT s.*, e.title AS event_title
     FROM sponsor s
     JOIN tea_shop ts ON ts.shop_id = s.shop_id
     JOIN event e ON e.event_id = s.event_id
     WHERE ts.user_id = ? AND LOWER(COALESCE(s.request_by, 'shop')) = 'shop'
     ORDER BY s.created_at DESC`,
    [userId]
  );
}

async function getIncomingSponsorRequestsForShop(userId) {
  return query(
    `SELECT s.*, e.title AS event_title, e.description
     FROM sponsor s
     JOIN tea_shop ts ON ts.shop_id = s.shop_id
     JOIN event e ON e.event_id = s.event_id
     WHERE ts.user_id = ? AND LOWER(COALESCE(s.request_by, '')) = 'organizer'
     ORDER BY s.created_at DESC`,
    [userId]
  );
}

async function updateSponsorStatus(id, status) {
  const nextStatus = normalizeStatus(status);
  const rows = await query(
    `SELECT s.sponsor_id, s.status, e.title AS event_title, ts.shop_name, u.email, u.username
     FROM sponsor s
     LEFT JOIN event e ON e.event_id = s.event_id
     LEFT JOIN tea_shop ts ON ts.shop_id = s.shop_id
     LEFT JOIN users u ON u.user_id = ts.user_id
     WHERE s.sponsor_id = ?
     LIMIT 1`,
    [id]
  );

  if (rows.length === 0) {
    const error = new Error("Sponsor request not found");
    error.statusCode = 404;
    throw error;
  }

  await query(
    `UPDATE sponsor
     SET status = ?, updated_at = CURRENT_TIMESTAMP
     WHERE sponsor_id = ?`,
    [nextStatus, id]
  );

  if ((nextStatus === "approved" || nextStatus === "rejected") && rows[0].email) {
    await sendApprovalDecisionEmail({
      to: rows[0].email,
      username: rows[0].username,
      subjectType: "sponsor request",
      subjectName: rows[0].event_title || rows[0].shop_name || `Sponsor ${id}`,
      approved: nextStatus === "approved",
    });
  }

  return {
    message: "Sponsor status updated",
  };
}

async function updateSponsorStatusByShop(id, status, userId) {
  const nextStatus = normalizeStatus(status);
  const rows = await query(
    `SELECT s.sponsor_id, s.request_by, e.title AS event_title, u.email, u.username
     FROM sponsor s
     JOIN tea_shop ts ON ts.shop_id = s.shop_id
     LEFT JOIN event e ON e.event_id = s.event_id
     LEFT JOIN organizer o ON o.organizer_id = e.organizer_id
     LEFT JOIN users u ON u.user_id = o.user_id
     WHERE s.sponsor_id = ? AND ts.user_id = ?
     LIMIT 1`,
    [id, userId]
  );

  if (rows.length === 0) {
    const error = new Error("Sponsor request not found");
    error.statusCode = 404;
    throw error;
  }

  if (String(rows[0].request_by || "").toLowerCase() !== "organizer") {
    const error = new Error("Only organizer requests can be updated from this page");
    error.statusCode = 400;
    throw error;
  }

  await query(
    `UPDATE sponsor
     SET status = ?, updated_at = CURRENT_TIMESTAMP
     WHERE sponsor_id = ?`,
    [nextStatus, id]
  );

  if ((nextStatus === "approved" || nextStatus === "rejected") && rows[0].email) {
    await sendApprovalDecisionEmail({
      to: rows[0].email,
      username: rows[0].username,
      subjectType: "sponsor request",
      subjectName: rows[0].event_title || `Sponsor ${id}`,
      approved: nextStatus === "approved",
    });
  }

  return {
    message: "Sponsor request updated",
  };
}

async function deleteSponsorRequest(id) {
  const rows = await query(
    `SELECT s.sponsor_id, e.title AS event_title, ts.shop_name, u.email, u.username
     FROM sponsor s
     LEFT JOIN event e ON e.event_id = s.event_id
     LEFT JOIN tea_shop ts ON ts.shop_id = s.shop_id
     LEFT JOIN users u ON u.user_id = ts.user_id
     WHERE s.sponsor_id = ?
     LIMIT 1`,
    [id]
  );

  if (rows.length === 0) {
    const error = new Error("Sponsor request not found");
    error.statusCode = 404;
    throw error;
  }

  await query("DELETE FROM sponsor WHERE sponsor_id = ?", [id]);

  if (rows[0].email) {
    await sendApprovalDecisionEmail({
      to: rows[0].email,
      username: rows[0].username,
      subjectType: "sponsor request",
      subjectName: rows[0].event_title || rows[0].shop_name || `Sponsor ${id}`,
      approved: false,
    });
  }

  return {
    message: "Sponsor request deleted",
  };
}

module.exports = {
  requestSponsor,
  getSponsorRequests,
  getShopSponsorRequests,
  getIncomingSponsorRequestsForShop,
  updateSponsorStatus,
  updateSponsorStatusByShop,
  deleteSponsorRequest,
};
