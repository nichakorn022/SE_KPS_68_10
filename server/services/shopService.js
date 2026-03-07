const { query } = require("../utils/dbHelpers");

async function getShops() {
  return query(
    `SELECT shop_id, user_id, email, shop_name, description, contact_info, phone, address,
            province, district, subdistrict, national_id, verified_status
     FROM tea_shop
     ORDER BY shop_id DESC`
  );
}

async function getShopById(id) {
  const rows = await query(
    `SELECT shop_id, user_id, email, shop_name, description, contact_info, phone, address,
            province, district, subdistrict, national_id, verified_status
     FROM tea_shop
     WHERE shop_id = ?`,
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
  email,
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
      user_id, email, shop_name, description, contact_info, phone, address,
      province, district, subdistrict, national_id
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      user_id,
      email ?? null,
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

module.exports = {
  getShops,
  getShopById,
  createShop
};
