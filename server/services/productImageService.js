const { query } = require("../utils/dbHelpers");

async function getProductImages() {
  return query(
    `SELECT image_id, product_id, image_path, uploaded_at
     FROM product_images
     ORDER BY image_id DESC`
  );
}

async function getProductImageById(id) {
  const rows = await query(
    `SELECT image_id, product_id, image_path, uploaded_at
     FROM product_images
     WHERE image_id = ?`,
    [id]
  );

  if (rows.length === 0) {
    const error = new Error("Product image not found");
    error.statusCode = 404;
    throw error;
  }

  return rows[0];
}

async function getProductImagesByProductId(productId) {
  return query(
    `SELECT image_id, product_id, image_path, uploaded_at
     FROM product_images
     WHERE product_id = ?
     ORDER BY image_id DESC`,
    [productId]
  );
}

async function createProductImage({ product_id, image_path }) {
  if (product_id === undefined || product_id === null || !String(image_path || "").trim()) {
    const error = new Error("product_id and image_path are required");
    error.statusCode = 400;
    throw error;
  }

  const result = await query(
    "INSERT INTO product_images (product_id, image_path) VALUES (?, ?)",
    [product_id, image_path]
  );

  return {
    message: "Product image created",
    image_id: result.insertId
  };
}

async function deleteProductImage(id) {
  const result = await query("DELETE FROM product_images WHERE image_id = ?", [id]);

  if (result.affectedRows === 0) {
    const error = new Error("Product image not found");
    error.statusCode = 404;
    throw error;
  }

  return { message: "Product image deleted" };
}

module.exports = {
  getProductImages,
  getProductImageById,
  getProductImagesByProductId,
  createProductImage,
  deleteProductImage
};
