const { query } = require("../utils/dbHelpers");
const { repairProductTextFields } = require("../utils/textRepair");

async function getProducts() {
  const rows = await query(
    `SELECT
        tp.product_id,
        tp.shop_id,
        tp.tea_name,
        tp.tea_type,
        tp.description,
        tp.price,
        tp.stock,
        COALESCE(review_stats.avg_rating, 0) AS avg_rating,
        COALESCE(review_stats.review_count, 0) AS review_count,
        COALESCE(SUM(
          CASE
            WHEN o.status = 'paid' AND o.order_date >= DATE_SUB(NOW(), INTERVAL 7 DAY)
            THEN od.quantity
            ELSE 0
          END
        ), 0) AS sales_7d
     FROM tea_product tp
     LEFT JOIN (
       SELECT
         od.product_id,
         AVG(pr.rating) AS avg_rating,
         COUNT(pr.review_id) AS review_count
       FROM product_review pr
       INNER JOIN order_details od ON od.order_detail_id = pr.order_detail_id
       GROUP BY od.product_id
     ) review_stats ON review_stats.product_id = tp.product_id
     LEFT JOIN order_details od ON od.product_id = tp.product_id
     LEFT JOIN orders o ON o.order_id = od.order_id
     GROUP BY
       tp.product_id,
       tp.shop_id,
       tp.tea_name,
       tp.tea_type,
       tp.description,
       tp.price,
       tp.stock,
       review_stats.avg_rating,
       review_stats.review_count
     ORDER BY tp.product_id DESC`
  );

  return rows.map(repairProductTextFields);
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

  return repairProductTextFields(rows[0]);
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

async function getShopByOwnerId(userId) {
  const rows = await query("SELECT shop_id FROM tea_shop WHERE user_id = ? LIMIT 1", [userId]);

  if (rows.length === 0) {
    const error = new Error("Shop profile not found for this account");
    error.statusCode = 404;
    throw error;
  }

  return rows[0];
}

async function getProductsByOwner(userId) {
  const shop = await getShopByOwnerId(userId);

  const rows = await query(
    `SELECT product_id, shop_id, tea_name, tea_type, description, price, stock
     FROM tea_product
     WHERE shop_id = ?
     ORDER BY product_id DESC`,
    [shop.shop_id]
  );

  return rows.map(repairProductTextFields);
}

async function createProductByOwner(userId, payload) {
  const shop = await getShopByOwnerId(userId);
  return createProduct({ ...payload, shop_id: shop.shop_id });
}

async function updateProductByOwner(userId, productId, payload) {
  const shop = await getShopByOwnerId(userId);
  const product = await getProductById(productId);

  if (Number(product.shop_id) !== Number(shop.shop_id)) {
    const error = new Error("You do not have access to this product");
    error.statusCode = 403;
    throw error;
  }

  return updateProduct(productId, payload);
}

async function deleteProductByOwner(userId, productId) {
  const shop = await getShopByOwnerId(userId);
  const product = await getProductById(productId);

  if (Number(product.shop_id) !== Number(shop.shop_id)) {
    const error = new Error("You do not have access to this product");
    error.statusCode = 403;
    throw error;
  }

  return deleteProduct(productId);
}

module.exports = {
  getProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
  getProductsByOwner,
  createProductByOwner,
  updateProductByOwner,
  deleteProductByOwner
};

