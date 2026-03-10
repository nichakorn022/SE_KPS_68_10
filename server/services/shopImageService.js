const { query } = require("../utils/dbHelpers");

async function getShopImages() {
  return query(
    `SELECT image_id, shop_id, image_path, uploaded_at
     FROM shop_images
     ORDER BY image_id DESC`
  );
}

async function getShopImageById(id) {
  const rows = await query(
    `SELECT image_id, shop_id, image_path, uploaded_at
     FROM shop_images
     WHERE image_id = ?`,
    [id]
  );

  if (rows.length === 0) {
    const error = new Error("Shop image not found");
    error.statusCode = 404;
    throw error;
  }

  return rows[0];
}

async function getShopImagesByShopId(shopId) {
  return query(
    `SELECT image_id, shop_id, image_path, uploaded_at
     FROM shop_images
     WHERE shop_id = ?
     ORDER BY image_id DESC`,
    [shopId]
  );
}

async function createShopImage({ shop_id, image_path }) {
  if (shop_id === undefined || shop_id === null || !String(image_path || "").trim()) {
    const error = new Error("shop_id and image_path are required");
    error.statusCode = 400;
    throw error;
  }

  const result = await query(
    "INSERT INTO shop_images (shop_id, image_path) VALUES (?, ?)",
    [shop_id, image_path]
  );

  return {
    message: "Shop image created",
    image_id: result.insertId
  };
}

async function deleteShopImage(id) {
  const result = await query("DELETE FROM shop_images WHERE image_id = ?", [id]);

  if (result.affectedRows === 0) {
    const error = new Error("Shop image not found");
    error.statusCode = 404;
    throw error;
  }

  return { message: "Shop image deleted" };
}

module.exports = {
  getShopImages,
  getShopImageById,
  getShopImagesByShopId,
  createShopImage,
  deleteShopImage
};
