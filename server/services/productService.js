const { query } = require("../utils/dbHelpers");

async function getProducts() {
  return query(
    `SELECT product_id, shop_id, tea_name, tea_type, description, price, stock
     FROM tea_product
     ORDER BY product_id DESC`
  );
}

async function getProductById(id) {
  const rows = await query(
    `SELECT product_id, shop_id, tea_name, tea_type, description, price, stock
     FROM tea_product
     WHERE product_id = ?`,
    [id]
  );

  if (rows.length === 0) {
    const error = new Error("Product not found");
    error.statusCode = 404;
    throw error;
  }

  return rows[0];
}

async function createProduct({ shop_id, tea_name, tea_type, description, price, stock }) {
  if (
    shop_id === undefined ||
    shop_id === null ||
    !tea_name ||
    !String(tea_name).trim() ||
    price === undefined ||
    price === null
  ) {
    const error = new Error("shop_id, tea_name, and price are required");
    error.statusCode = 400;
    throw error;
  }

  const safeStock = stock ?? 0;

  const result = await query(
    `INSERT INTO tea_product (shop_id, tea_name, tea_type, description, price, stock)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [shop_id, tea_name, tea_type ?? null, description ?? null, price, safeStock]
  );

  return {
    message: "Product created",
    product_id: result.insertId
  };
}

async function updateProduct(id, { tea_name, tea_type, description, price, stock }) {
  const result = await query(
    `UPDATE tea_product
     SET tea_name = ?, tea_type = ?, description = ?, price = ?, stock = ?
     WHERE product_id = ?`,
    [tea_name, tea_type ?? null, description ?? null, price, stock, id]
  );

  if (result.affectedRows === 0) {
    const error = new Error("Product not found");
    error.statusCode = 404;
    throw error;
  }

  return { message: "Product updated" };
}

async function deleteProduct(id) {
  const result = await query("DELETE FROM tea_product WHERE product_id = ?", [id]);

  if (result.affectedRows === 0) {
    const error = new Error("Product not found");
    error.statusCode = 404;
    throw error;
  }

  return { message: "Product deleted" };
}

module.exports = {
  getProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct
};
