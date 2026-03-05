const db = require("../db");

exports.getProducts = (req, res) => {
  const sql = `
    SELECT product_id, shop_id, tea_name, tea_type, description, price, stock
    FROM tea_product
    ORDER BY product_id DESC
  `;

  db.query(sql, (err, result) => {
    if (err) {
      return res.status(500).json({ message: "Failed to fetch products", error: err });
    }

    return res.json(result);
  });
};

exports.getProductById = (req, res) => {
  const { id } = req.params;

  const sql = `
    SELECT product_id, shop_id, tea_name, tea_type, description, price, stock
    FROM tea_product
    WHERE product_id = ?
  `;

  db.query(sql, [id], (err, result) => {
    if (err) {
      return res.status(500).json({ message: "Failed to fetch product", error: err });
    }

    if (result.length === 0) {
      return res.status(404).json({ message: "Product not found" });
    }

    return res.json(result[0]);
  });
};

exports.createProduct = (req, res) => {
  const { shop_id, tea_name, tea_type, description, price, stock } = req.body;

  if (
    shop_id === undefined ||
    shop_id === null ||
    !tea_name ||
    !String(tea_name).trim() ||
    price === undefined ||
    price === null
  ) {
    return res.status(400).json({
      message: "shop_id, tea_name, and price are required"
    });
  }

  const safeStock = stock ?? 0;

  const sql = `
    INSERT INTO tea_product (shop_id, tea_name, tea_type, description, price, stock)
    VALUES (?, ?, ?, ?, ?, ?)
  `;

  db.query(
    sql,
    [shop_id, tea_name, tea_type ?? null, description ?? null, price, safeStock],
    (err, result) => {
      if (err) {
        return res.status(500).json({ message: "Failed to create product", error: err });
      }

      return res.status(201).json({
        message: "Product created",
        product_id: result.insertId
      });
    }
  );
};

exports.updateProduct = (req, res) => {
  const { id } = req.params;
  const { tea_name, tea_type, description, price, stock } = req.body;

  const sql = `
    UPDATE tea_product
    SET tea_name = ?, tea_type = ?, description = ?, price = ?, stock = ?
    WHERE product_id = ?
  `;

  db.query(
    sql,
    [tea_name, tea_type ?? null, description ?? null, price, stock, id],
    (err, result) => {
      if (err) {
        return res.status(500).json({ message: "Failed to update product", error: err });
      }

      if (result.affectedRows === 0) {
        return res.status(404).json({ message: "Product not found" });
      }

      return res.json({ message: "Product updated" });
    }
  );
};

exports.deleteProduct = (req, res) => {
  const { id } = req.params;

  const sql = "DELETE FROM tea_product WHERE product_id = ?";

  db.query(sql, [id], (err, result) => {
    if (err) {
      return res.status(500).json({ message: "Failed to delete product", error: err });
    }

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "Product not found" });
    }

    return res.json({ message: "Product deleted" });
  });
};
