const { query } = require("../utils/dbHelpers");

async function getShops() {
  return query(
    `SELECT ts.shop_id, ts.user_id, u.email, ts.shop_name, ts.description, ts.contact_info, ts.phone, ts.address,
            ts.province, ts.district, ts.subdistrict, ts.national_id, ts.verified_status
     FROM tea_shop ts
     LEFT JOIN users u ON u.user_id = ts.user_id
     ORDER BY shop_id DESC`
  );
}

async function getShopById(id) {
  const rows = await query(
    `SELECT ts.shop_id, ts.user_id, u.email, ts.shop_name, ts.description, ts.contact_info, ts.phone, ts.address,
            ts.province, ts.district, ts.subdistrict, ts.national_id, ts.verified_status
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

async function updateShopVerification(shopId, verifiedStatus) {
  const result = await query(
    `UPDATE tea_shop
     SET verified_status = ?
     WHERE shop_id = ?`,
    [verifiedStatus ? 1 : 0, shopId]
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
  updateShopVerification
};
