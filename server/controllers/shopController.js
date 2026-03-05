const db = require("../db");

exports.getShops = (req, res) => {
  const sql = `
    SELECT shop_id, user_id, email, shop_name, description, contact_info, phone, address,
           province, district, subdistrict, national_id, verified_status
    FROM tea_shop
    ORDER BY shop_id DESC
  `;

  db.query(sql, (err, result) => {
    if (err) {
      return res.status(500).json({ message: "Failed to fetch shops", error: err });
    }

    return res.json(result);
  });
};

exports.getShopById = (req, res) => {
  const { id } = req.params;

  const sql = `
    SELECT shop_id, user_id, email, shop_name, description, contact_info, phone, address,
           province, district, subdistrict, national_id, verified_status
    FROM tea_shop
    WHERE shop_id = ?
  `;

  db.query(sql, [id], (err, result) => {
    if (err) {
      return res.status(500).json({ message: "Failed to fetch shop", error: err });
    }

    if (result.length === 0) {
      return res.status(404).json({ message: "Shop not found" });
    }

    return res.json(result[0]);
  });
};

exports.createShop = (req, res) => {
  const {
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
  } = req.body;

  if (user_id === undefined || user_id === null || !shop_name || !String(shop_name).trim()) {
    return res.status(400).json({ message: "user_id and shop_name are required" });
  }

  const sql = `
    INSERT INTO tea_shop (
      user_id, email, shop_name, description, contact_info, phone, address,
      province, district, subdistrict, national_id
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `;

  const values = [
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
  ];

  db.query(sql, values, (err, result) => {
    if (err) {
      return res.status(500).json({ message: "Failed to create shop", error: err });
    }

    return res.status(201).json({
      message: "Shop created",
      shop_id: result.insertId
    });
  });
};
