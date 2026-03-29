const express = require("express");
const cors = require("cors");
const path = require("path");
const fs = require("fs");
require("dotenv").config({ path: path.join(__dirname, ".env") });

const authRoutes = require("./routes/authRoutes");
const productRoutes = require("./routes/productRoutes");
const productImageRoutes = require("./routes/productImageRoutes");
const shopRoutes = require("./routes/shopRoutes");
const eventRoutes = require("./routes/eventRoutes");
const eventImageRoutes = require("./routes/eventImageRoutes");
const shopImageRoutes = require("./routes/shopImageRoutes");
const orderRoutes = require("./routes/orderRoutes");
const orderDetailRoutes = require("./routes/orderDetailRoutes");
const registrationRoutes = require("./routes/registrationRoutes");
const userAddressRoutes = require("./routes/userAddressRoutes");
const userRoutes = require("./routes/userRoutes");
const organizerRoutes = require("./routes/organizerRoutes");
const reportRoutes = require("./routes/reportRoutes");
const chatRoutes = require("./routes/chatRoutes");
const sponsorRoutes = require("./routes/sponsorRoutes");
const reviewRoutes = require("./routes/reviewRoutes");

const app = express();
const port = Number(process.env.PORT) || 3001;

// Ensure users.avatar column exists (best-effort)
const { query } = require("./utils/dbHelpers");
(async function ensureTables() {
  try {
    // Ensure users.avatar column exists
    const columns = await query(
      `SELECT COLUMN_NAME
       FROM INFORMATION_SCHEMA.COLUMNS
       WHERE TABLE_SCHEMA = DATABASE()
         AND TABLE_NAME = 'users'
         AND COLUMN_NAME = 'avatar'
       LIMIT 1`
    );

    if (columns.length === 0) {
      await query("ALTER TABLE users ADD COLUMN avatar VARCHAR(255) NULL");
      console.log("Added users.avatar column");
    }

    // Ensure product_review table exists
    const tables = await query(
      `SELECT TABLE_NAME
       FROM INFORMATION_SCHEMA.TABLES
       WHERE TABLE_SCHEMA = DATABASE()
         AND TABLE_NAME = 'product_review'
       LIMIT 1`
    );

    if (tables.length === 0) {
      await query(`
        CREATE TABLE product_review (
          review_id INT AUTO_INCREMENT PRIMARY KEY,
          user_id INT NOT NULL,
          product_id INT NOT NULL,
          rating INT NOT NULL CHECK (rating >= 1 AND rating <= 5),
          comment TEXT,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE,
          FOREIGN KEY (product_id) REFERENCES tea_product(product_id) ON DELETE CASCADE,
          UNIQUE KEY unique_user_product (user_id, product_id)
        )
      `);
      console.log("Created product_review table");
    }
  } catch (err) {
    console.warn("Could not ensure tables:", err.message);
  }
})();

(async function ensureAdminNoteColumns() {
  const targets = [
    { table: "tea_shop", column: "admin_note" },
    { table: "organizer", column: "admin_note" },
    { table: "report", column: "admin_note" },
    { table: "sponsor", column: "admin_note" },
  ];

  for (const target of targets) {
    try {
      const rows = await query(
        `SELECT COLUMN_NAME
         FROM INFORMATION_SCHEMA.COLUMNS
         WHERE TABLE_SCHEMA = DATABASE()
           AND TABLE_NAME = ?
           AND COLUMN_NAME = ?
         LIMIT 1`,
        [target.table, target.column]
      );

      if (rows.length === 0) {
        await query(`ALTER TABLE ${target.table} ADD COLUMN ${target.column} TEXT NULL`);
      }
    } catch (err) {
      console.warn(`Could not ensure ${target.table}.${target.column} column:`, err.message);
    }
  }
})();

(async function ensureTeaShopOpeningHoursColumn() {
  try {
    const rows = await query(
      `SELECT COLUMN_NAME
       FROM INFORMATION_SCHEMA.COLUMNS
       WHERE TABLE_SCHEMA = DATABASE()
         AND TABLE_NAME = 'tea_shop'
         AND COLUMN_NAME = 'opening_hours'
       LIMIT 1`
    );

    if (rows.length === 0) {
      await query("ALTER TABLE tea_shop ADD COLUMN opening_hours TEXT NULL");
    }
  } catch (err) {
    console.warn("Could not ensure tea_shop.opening_hours column:", err.message);
  }
})();

(async function ensureReviewStatusColumns() {
  const targets = [
    { table: "tea_shop", verifiedColumn: "verified_status" },
    { table: "organizer", verifiedColumn: "verified_status" },
  ];

  for (const target of targets) {
    try {
      const rows = await query(
        `SELECT COLUMN_NAME
         FROM INFORMATION_SCHEMA.COLUMNS
         WHERE TABLE_SCHEMA = DATABASE()
           AND TABLE_NAME = ?
           AND COLUMN_NAME = 'review_status'
         LIMIT 1`,
        [target.table]
      );

      if (rows.length === 0) {
        await query(
          `ALTER TABLE ${target.table}
           ADD COLUMN review_status VARCHAR(20) NOT NULL DEFAULT 'pending'`
        );
        await query(
          `UPDATE ${target.table}
           SET review_status = CASE
             WHEN ${target.verifiedColumn} = 1 THEN 'approved'
             ELSE 'pending'
           END`
        );
      }
    } catch (err) {
      console.warn(`Could not ensure ${target.table}.review_status column:`, err.message);
    }
  }
})();

(async function ensureShopImagesIdentity() {
  try {
    const imageIdRows = await query(
      `SELECT COLUMN_KEY, EXTRA
       FROM INFORMATION_SCHEMA.COLUMNS
       WHERE TABLE_SCHEMA = DATABASE()
         AND TABLE_NAME = 'shop_images'
         AND COLUMN_NAME = 'image_id'
       LIMIT 1`
    );

    if (imageIdRows.length === 0) return;

    const imageIdMeta = imageIdRows[0];
    if (imageIdMeta.COLUMN_KEY !== "PRI") {
      try {
        await query("ALTER TABLE shop_images ADD PRIMARY KEY (image_id)");
      } catch (err) {
        console.warn("Could not add shop_images primary key:", err.message);
      }
    }

    if (!String(imageIdMeta.EXTRA || "").toLowerCase().includes("auto_increment")) {
      await query("ALTER TABLE shop_images MODIFY image_id INT(10) NOT NULL AUTO_INCREMENT");
    }
  } catch (err) {
    console.warn("Could not ensure shop_images.image_id identity:", err.message);
  }
})();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

app.use("/api/auth", authRoutes);
app.use("/api/products", productRoutes);
app.use("/api/product-images", productImageRoutes);
app.use("/api/shops", shopRoutes);
app.use("/api/events", eventRoutes);
app.use("/api/event-images", eventImageRoutes);
app.use("/api/shop-images", shopImageRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/order-details", orderDetailRoutes);
app.use("/api/registrations", registrationRoutes);
app.use("/api/user-addresses", userAddressRoutes);
app.use("/api/users", userRoutes);
app.use("/api/organizers", organizerRoutes);
app.use("/api/reports", reportRoutes);
app.use("/api/chat", chatRoutes);
app.use("/api/sponsors", sponsorRoutes);
app.use("/api/reviews", reviewRoutes);

// Serve built frontend (dist) so `/api/*` works even without Vite proxy (e.g. static hosting / file preview).
const distPath = path.join(__dirname, "..", "dist");
if (fs.existsSync(distPath)) {
  app.use(express.static(distPath));
  app.get("*", (req, res, next) => {
    if (req.path.startsWith("/api") || req.path.startsWith("/uploads")) return next();
    return res.sendFile(path.join(distPath, "index.html"));
  });
}

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
