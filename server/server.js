const express = require("express");
const cors = require("cors");
const path = require("path");
const fs = require("fs");
const dotenv = require("dotenv");

const localEnvPath = path.join(__dirname, ".env.local");
const envPath = fs.existsSync(localEnvPath) ? localEnvPath : path.join(__dirname, ".env");
dotenv.config({ path: envPath });

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
          rating INT NOT NULL CHECK (rating >= 1 AND rating <= 5),
          comment TEXT,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          order_detail_id INT NOT NULL,
          FOREIGN KEY (order_detail_id) REFERENCES order_details(order_detail_id) ON DELETE CASCADE,
          UNIQUE KEY unique_order_detail (order_detail_id)
        )
      `);
      console.log("Created product_review table");
    }

    const eventReviewTables = await query(
      `SELECT TABLE_NAME
       FROM INFORMATION_SCHEMA.TABLES
       WHERE TABLE_SCHEMA = DATABASE()
         AND TABLE_NAME = 'event_review'
       LIMIT 1`
    );

    if (eventReviewTables.length === 0) {
      await query(`
        CREATE TABLE event_review (
          review_id INT AUTO_INCREMENT PRIMARY KEY,
          registration_id INT NOT NULL,
          overall_rating INT NOT NULL,
          location_rating INT NOT NULL,
          atmosphere_rating INT NOT NULL,
          value_rating INT NOT NULL,
          comment TEXT,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
          CONSTRAINT fk_event_review_registration
            FOREIGN KEY (registration_id) REFERENCES event_registration(registration_id) ON DELETE CASCADE,
          UNIQUE KEY unique_registration_review (registration_id)
        )
      `);
      console.log("Created event_review table");
    }
  } catch (err) {
    console.warn("Could not ensure tables:", err.message);
  }
})();

(async function ensureProductReviewReplyTable() {
  try {
    const tables = await query(
      `SELECT TABLE_NAME
       FROM INFORMATION_SCHEMA.TABLES
       WHERE TABLE_SCHEMA = DATABASE()
         AND TABLE_NAME = 'product_review_reply'
       LIMIT 1`
    );

    if (tables.length === 0) {
      await query(`
        CREATE TABLE product_review_reply (
          reply_id INT AUTO_INCREMENT PRIMARY KEY,
          review_id INT NOT NULL,
          shop_user_id INT NOT NULL,
          reply_text TEXT NOT NULL,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
          UNIQUE KEY unique_review (review_id)
        )
      `);
      console.log("Created product_review_reply table");
    }
  } catch (err) {
    console.warn("Could not ensure product_review_reply table:", err.message);
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

(async function normalizeVerificationStatuses() {
  const targets = [
    { table: "tea_shop" },
    { table: "organizer" },
  ];

  for (const target of targets) {
    try {
      const verifiedRows = await query(
        `SELECT COLUMN_NAME
         FROM INFORMATION_SCHEMA.COLUMNS
         WHERE TABLE_SCHEMA = DATABASE()
           AND TABLE_NAME = ?
           AND COLUMN_NAME = 'verified_status'
         LIMIT 1`,
        [target.table]
      );

      if (verifiedRows.length === 0) {
        continue;
      }

      const reviewRows = await query(
        `SELECT COLUMN_NAME
         FROM INFORMATION_SCHEMA.COLUMNS
         WHERE TABLE_SCHEMA = DATABASE()
           AND TABLE_NAME = ?
           AND COLUMN_NAME = 'review_status'
         LIMIT 1`,
        [target.table]
      );

      if (reviewRows.length > 0) {
        await query(
          `UPDATE ${target.table}
           SET verified_status = CASE
             WHEN LOWER(COALESCE(review_status, '')) = 'approved' THEN 1
             WHEN LOWER(COALESCE(review_status, '')) = 'rejected' THEN 2
             WHEN verified_status NOT IN (0, 1, 2) OR verified_status IS NULL THEN 0
             ELSE verified_status
           END`
        );
      } else {
        await query(
          `UPDATE ${target.table}
           SET verified_status = CASE
             WHEN verified_status IN (0, 1, 2) THEN verified_status
             WHEN verified_status = 1 THEN 1
             ELSE 0
           END`
        );
      }
    } catch (err) {
      console.warn(`Could not normalize ${target.table}.verified_status values:`, err.message);
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
<<<<<<< Updated upstream
  // SPA fallback: serve index.html for non-API, non-upload routes.
  app.get(/^\/(?!api|uploads).*/, (req, res, next) => {
    const accept = String(req.headers.accept || "");
    if (accept && !accept.includes("text/html")) return next();
=======
  app.get("/{*path}", (req, res, next) => {
    if (req.path.startsWith("/api") || req.path.startsWith("/uploads")) return next();
>>>>>>> Stashed changes
    return res.sendFile(path.join(distPath, "index.html"));
  });
}

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
