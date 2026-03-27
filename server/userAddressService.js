const { beginTransaction, commit, rollback, query } = require("./utils/dbHelpers");

function normalizeRow(row) {
  return {
    address_id: row.address_id,
    user_id: row.user_id,
    recipient_name: row.recipient_name,
    phone: row.phone,
    address_line: row.address_line,
    subdistrict: row.subdistrict,
    district: row.district,
    province: row.province,
    postal_code: row.postal_code,
    note: row.note,
    is_default: Number(row.is_default) === 1,
    created_at: row.created_at,
    updated_at: row.updated_at,
  };
}

function validateAddressInput(payload) {
  const requiredFields = ["recipient_name", "phone", "address_line"];
  const missing = requiredFields.filter((field) => !String(payload[field] ?? "").trim());

  if (missing.length > 0) {
    const error = new Error(`Missing required fields: ${missing.join(", ")}`);
    error.statusCode = 400;
    throw error;
  }
}

async function getAddressesByUser(userId) {
  const rows = await query(
    `SELECT address_id, user_id, recipient_name, phone, address_line, subdistrict, district,
            province, postal_code, note, is_default, created_at, updated_at
     FROM user_address
     WHERE user_id = ?
     ORDER BY is_default DESC, updated_at DESC, address_id DESC`,
    [userId]
  );

  return rows.map(normalizeRow);
}

async function getAddressById(userId, addressId) {
  const rows = await query(
    `SELECT address_id, user_id, recipient_name, phone, address_line, subdistrict, district,
            province, postal_code, note, is_default, created_at, updated_at
     FROM user_address
     WHERE user_id = ? AND address_id = ?`,
    [userId, addressId]
  );

  if (rows.length === 0) {
    const error = new Error("Address not found");
    error.statusCode = 404;
    throw error;
  }

  return normalizeRow(rows[0]);
}

async function getDefaultAddressByUser(userId) {
  const rows = await query(
    `SELECT address_id, user_id, recipient_name, phone, address_line, subdistrict, district,
            province, postal_code, note, is_default, created_at, updated_at
     FROM user_address
     WHERE user_id = ?
     ORDER BY is_default DESC, updated_at DESC, address_id DESC
     LIMIT 1`,
    [userId]
  );

  return rows.length > 0 ? normalizeRow(rows[0]) : null;
}

async function createAddress(userId, payload) {
  validateAddressInput(payload);

  try {
    await beginTransaction();

    const existingRows = await query(
      "SELECT address_id FROM user_address WHERE user_id = ? LIMIT 1",
      [userId]
    );
    const isDefault = Boolean(payload.is_default) || existingRows.length === 0;

    if (isDefault) {
      await query("UPDATE user_address SET is_default = 0 WHERE user_id = ?", [userId]);
    }

    const result = await query(
      `INSERT INTO user_address (
        user_id, recipient_name, phone, address_line, subdistrict, district, province,
        postal_code, note, is_default
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        userId,
        payload.recipient_name.trim(),
        payload.phone.trim(),
        payload.address_line.trim(),
        payload.subdistrict?.trim() || null,
        payload.district?.trim() || null,
        payload.province?.trim() || null,
        payload.postal_code?.trim() || null,
        payload.note?.trim() || null,
        isDefault ? 1 : 0,
      ]
    );

    await commit();
    return getAddressById(userId, result.insertId);
  } catch (error) {
    await rollback();
    throw error;
  }
}

async function updateAddress(userId, addressId, payload) {
  validateAddressInput(payload);

  try {
    await beginTransaction();
    await getAddressById(userId, addressId);

    if (payload.is_default) {
      await query("UPDATE user_address SET is_default = 0 WHERE user_id = ?", [userId]);
    }

    const result = await query(
      `UPDATE user_address
       SET recipient_name = ?, phone = ?, address_line = ?, subdistrict = ?, district = ?,
           province = ?, postal_code = ?, note = ?, is_default = ?
       WHERE user_id = ? AND address_id = ?`,
      [
        payload.recipient_name.trim(),
        payload.phone.trim(),
        payload.address_line.trim(),
        payload.subdistrict?.trim() || null,
        payload.district?.trim() || null,
        payload.province?.trim() || null,
        payload.postal_code?.trim() || null,
        payload.note?.trim() || null,
        payload.is_default ? 1 : 0,
        userId,
        addressId,
      ]
    );

    if (result.affectedRows === 0) {
      const error = new Error("Address not found");
      error.statusCode = 404;
      throw error;
    }

    await commit();
    return getAddressById(userId, addressId);
  } catch (error) {
    await rollback();
    throw error;
  }
}

async function setDefaultAddress(userId, addressId) {
  try {
    await beginTransaction();
    await getAddressById(userId, addressId);

    await query("UPDATE user_address SET is_default = 0 WHERE user_id = ?", [userId]);
    await query(
      "UPDATE user_address SET is_default = 1 WHERE user_id = ? AND address_id = ?",
      [userId, addressId]
    );

    await commit();
    return getAddressById(userId, addressId);
  } catch (error) {
    await rollback();
    throw error;
  }
}

module.exports = {
  getAddressesByUser,
  getAddressById,
  getDefaultAddressByUser,
  createAddress,
  updateAddress,
  setDefaultAddress,
};
