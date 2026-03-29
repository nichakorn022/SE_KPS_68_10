const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const { query, beginTransaction, commit, rollback } = require("../utils/dbHelpers");
const { sendWelcomeEmail } = require("../utils/mailer");

function getAdminEmails() {
  return (process.env.ADMIN_EMAILS || "")
    .split(",")
    .map((email) => email.trim().toLowerCase())
    .filter(Boolean);
}

function isAdminUser(user) {
  if (!user) return false;
  if (user.role && String(user.role).toLowerCase() === "admin") return true;
  if (user.user_role && String(user.user_role).toLowerCase() === "admin") return true;
  if (Number(user.is_admin) === 1) return true;
  if (Number(user.isAdmin) === 1) return true;
  return getAdminEmails().includes(String(user.email || "").toLowerCase());
}

function sanitizeText(value) {
  if (value === undefined || value === null) return null;
  const trimmed = String(value).trim();
  return trimmed ? trimmed : null;
}

async function buildAuthPayload(user) {
  const adminUser = isAdminUser(user);
  const role = adminUser ? "admin" : String(user.role || "user").toLowerCase();

  // Fetch organizer_id if user is an organizer
  let organizer_id = null;
  if (role === "user" || role !== "admin") {
    try {
      const orgResult = await query(
        "SELECT organizer_id FROM organizer WHERE user_id = ? LIMIT 1",
        [user.user_id]
      );
      if (orgResult.length > 0) {
        organizer_id = orgResult[0].organizer_id;
      }
    } catch (err) {
      // Silently ignore if organizer lookup fails
      console.warn(`Could not fetch organizer_id for user ${user.user_id}:`, err.message);
    }
  }

  return {
    tokenPayload: {
      user_id: user.user_id,
      email: user.email,
      role,
      username: user.username,
      name: user.username,
      avatar: user.avatar || null,
      organizer_id,
    },
    responseUser: {
      user_id: user.user_id,
      username: user.username,
      email: user.email,
      role,
      avatar: user.avatar || null,
      organizer_id,
    },
    isAdmin: adminUser,
  };
}

async function ensureUniqueUser(username, email) {
  const rows = await query(
    "SELECT user_id, username, email FROM users WHERE username = ? OR email = ? LIMIT 1",
    [username, email]
  );

  if (rows.length === 0) return;

  const duplicate = rows[0];
  if (String(duplicate.username).toLowerCase() === String(username).toLowerCase()) {
    const error = new Error("Username already exists");
    error.statusCode = 409;
    throw error;
  }

  const error = new Error("Email already exists");
  error.statusCode = 409;
  throw error;
}

exports.registerUser = async (req, res) => {
  try {
    const username = sanitizeText(req.body.username);
    const email = sanitizeText(req.body.email);
    const password = String(req.body.password || "");

    if (!username || !email || !password) {
      return res.status(400).json({ message: "Username, email, and password are required" });
    }

    await ensureUniqueUser(username, email);
    const hashedPassword = await bcrypt.hash(password, 10);

    await query("INSERT INTO users (username, email, password, role, imageprofile) VALUES (?, ?, ?, 'user', ?)", [
      username,
      email,
      hashedPassword,
      "",
    ]);

    res.json({ message: "Register success" });

    sendWelcomeEmail({ to: email, username }).catch((err) =>
      console.error("Welcome email failed:", err.message)
    );
  } catch (error) {
    res.status(error.statusCode || 500).json({ message: error.message || "Registration failed" });
  }
};

exports.registerMerchant = async (req, res) => {
  const username = sanitizeText(req.body.username);
  const email = sanitizeText(req.body.email);
  const password = String(req.body.password || "");
  const shopName = sanitizeText(req.body.storeName);
  const address = sanitizeText(req.body.storeAddress);
  const nationalId = sanitizeText(req.body.nationalId);
  const phone = sanitizeText(req.body.phone);
  const description = sanitizeText(req.body.description);
  const contactInfo = sanitizeText(req.body.contactInfo);
  const province = sanitizeText(req.body.province);
  const district = sanitizeText(req.body.district);
  const subdistrict = sanitizeText(req.body.subdistrict);

  if (!username || !email || !password || !shopName) {
    return res.status(400).json({
      message: "Username, email, password, and store name are required",
    });
  }

  try {
    await ensureUniqueUser(username, email);

    const hashedPassword = await bcrypt.hash(password, 10);

    await beginTransaction();

    const userResult = await query(
      "INSERT INTO users (username, email, password, role, imageprofile) VALUES (?, ?, ?, 'shop', ?)",
      [username, email, hashedPassword, ""]
    );

    await query(
      `INSERT INTO tea_shop (
        user_id, shop_name, description, contact_info, phone, address, province, district, subdistrict, national_id
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        userResult.insertId,
        shopName,
        description,
        contactInfo,
        phone,
        address,
        province,
        district,
        subdistrict,
        nationalId,
      ]
    );

    await commit();
    res.json({ message: "Merchant register success" });

    sendWelcomeEmail({ to: email, username }).catch((err) =>
      console.error("Welcome email failed:", err.message)
    );
  } catch (error) {
    await rollback();
    res.status(error.statusCode || 500).json({ message: error.message || "Merchant registration failed" });
  }
};

exports.login = async (req, res) => {
  const email = sanitizeText(req.body.email);
  const password = String(req.body.password || "");

  if (!email || !password) {
    return res.status(400).json({ message: "Email and password are required" });
  }

  try {
    const result = await query("SELECT * FROM users WHERE email = ? LIMIT 1", [email]);

    if (result.length === 0) {
      return res.status(401).json({ message: "User not found" });
    }

    const user = result[0];
    const match = await bcrypt.compare(password, user.password);

    if (!match) {
      return res.status(401).json({ message: "Wrong password" });
    }

    const { tokenPayload, responseUser } = await buildAuthPayload(user);
    const token = jwt.sign(tokenPayload, process.env.JWT_SECRET, { expiresIn: "1d" });

    res.json({
      message: "Login success",
      token,
      user: responseUser,
    });
  } catch (error) {
    res.status(500).json({ message: error.message || "Login failed" });
  }
};

exports.loginAdmin = async (req, res) => {
  const email = sanitizeText(req.body.email);
  const password = String(req.body.password || "");

  if (!email || !password) {
    return res.status(400).json({ message: "Email and password are required" });
  }

  try {
    const result = await query("SELECT * FROM users WHERE email = ? LIMIT 1", [email]);

    if (result.length === 0) {
      return res.status(401).json({ message: "User not found" });
    }

    const user = result[0];
    const match = await bcrypt.compare(password, user.password);

    if (!match) {
      return res.status(401).json({ message: "Wrong password" });
    }

    if (!isAdminUser(user)) {
      return res.status(403).json({ message: "Admin access denied" });
    }

    const token = jwt.sign(
      { user_id: user.user_id, email: user.email, role: "admin" },
      process.env.JWT_SECRET,
      { expiresIn: "1d" }
    );

    res.json({
      message: "Admin login success",
      token,
      user: {
        user_id: user.user_id,
        username: user.username,
        email: user.email,
        role: "admin",
      },
    });
  } catch (error) {
    res.status(500).json({ message: error.message || "Admin login failed" });
  }
};

exports.adminProfile = async (req, res) => {
  try {
    const result = await query("SELECT user_id, username, email FROM users WHERE user_id = ? LIMIT 1", [
      req.user.user_id,
    ]);

    if (result.length === 0) {
      return res.status(404).json({ message: "User not found" });
    }

    const user = result[0];

    res.json({
      user: {
        ...user,
        role: "admin",
      },
    });
  } catch (error) {
    res.status(500).json({ message: error.message || "Failed to fetch admin profile" });
  }
};
