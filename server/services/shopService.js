const { query } = require("../utils/dbHelpers");

async function getShops() {
  return query(
    `SELECT ts.shop_id, ts.user_id, u.email, ts.shop_name, ts.description, ts.contact_info, ts.phone, ts.address,
            ts.province, ts.district, ts.subdistrict, ts.national_id, ts.verified_status, ts.admin_note
     FROM tea_shop ts
     LEFT JOIN users u ON u.user_id = ts.user_id
     ORDER BY shop_id DESC`
  );
}

async function getShopById(id) {
  const rows = await query(
    `SELECT ts.shop_id, ts.user_id, u.email, ts.shop_name, ts.description, ts.contact_info, ts.phone, ts.address,
            ts.province, ts.district, ts.subdistrict, ts.national_id, ts.verified_status, ts.admin_note
     FROM tea_shop ts
     LEFT JOIN users u ON u.user_id = ts.user_id
     WHERE ts.shop_id = ?`,
    [id]
  );

  if (rows.length === 0) {
    const error = new Error("Shop not found");
    error.statusCode = 404;
    throw error;
  }

  return rows[0];
}

async function createShop({
  user_id,
  shop_name,
  description,
  contact_info,
  phone,
  address,
  province,
  district,
  subdistrict,
  national_id
}) {
  if (user_id === undefined || user_id === null || !shop_name || !String(shop_name).trim()) {
    const error = new Error("user_id and shop_name are required");
    error.statusCode = 400;
    throw error;
  }

  const result = await query(
    `INSERT INTO tea_shop (
      user_id, shop_name, description, contact_info, phone, address,
      province, district, subdistrict, national_id
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      user_id,
      shop_name,
      description ?? null,
      contact_info ?? null,
      phone ?? null,
      address ?? null,
      province ?? null,
      district ?? null,
      subdistrict ?? null,
      national_id ?? null
    ]
  );

  return {
    message: "Shop created",
    shop_id: result.insertId
  };
}

async function updateShopByOwner(userId, shopId, payload) {
  const rows = await query(
    `SELECT shop_id, user_id
     FROM tea_shop
     WHERE shop_id = ?
     LIMIT 1`,
    [shopId]
  );

  if (rows.length === 0) {
    const error = new Error("Shop not found");
    error.statusCode = 404;
    throw error;
  }

  if (String(rows[0].user_id) !== String(userId)) {
    const error = new Error("Forbidden");
    error.statusCode = 403;
    throw error;
  }

  const normalized = {
    shop_name: String(payload.shop_name || "").trim(),
    description: String(payload.description || "").trim(),
    contact_info: String(payload.contact_info || "").trim(),
    phone: String(payload.phone || "").trim(),
    address: String(payload.address || "").trim(),
    province: String(payload.province || "").trim(),
    district: String(payload.district || "").trim(),
    subdistrict: String(payload.subdistrict || "").trim(),
  };

  if (!normalized.shop_name) {
    const error = new Error("shop_name is required");
    error.statusCode = 400;
    throw error;
  }

  await query(
    `UPDATE tea_shop
     SET shop_name = ?,
         description = ?,
         contact_info = ?,
         phone = ?,
         address = ?,
         province = ?,
         district = ?,
         subdistrict = ?
     WHERE shop_id = ?`,
    [
      normalized.shop_name,
      normalized.description || null,
      normalized.contact_info || null,
      normalized.phone || null,
      normalized.address || null,
      normalized.province || null,
      normalized.district || null,
      normalized.subdistrict || null,
      shopId,
    ]
  );

  return getShopById(shopId);
}

async function updateShopVerification(shopId, verifiedStatus, adminNote) {
  const result = await query(
    `UPDATE tea_shop
     SET verified_status = ?, admin_note = ?
     WHERE shop_id = ?`,
    [verifiedStatus ? 1 : 0, adminNote ?? null, shopId]
  );

  if (result.affectedRows === 0) {
    const error = new Error("Shop not found");
    error.statusCode = 404;
    throw error;
  }

  return {
    message: "Shop verification updated"
  };
}

module.exports = {
  getShops,
  getShopById,
  createShop,
  updateShopByOwner,
  updateShopVerification
};
