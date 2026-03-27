const db = require("../db");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

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

// REGISTER
exports.registerUser = async (req, res) => {

  const { username, email, password } = req.body;

  const hashedPassword = await bcrypt.hash(password, 10);

  const sql = `
    INSERT INTO users (username, email, password)
    VALUES (?, ?, ?)
  `;

  db.query(sql, [username, email, hashedPassword], (err, result) => {

    if (err) {
      return res.status(500).json(err);
    }

    res.json({
      message: "Register success"
    });

  });

};


// LOGIN
exports.login = (req, res) => {

  const { email, password } = req.body;

  const sql = "SELECT * FROM users WHERE email = ?";

  db.query(sql, [email], async (err, result) => {

    if (err) {
      return res.status(500).json(err);
    }

    if (result.length === 0) {
      return res.status(401).json({
        message: "User not found"
      });
    }

    const user = result[0];

    const match = await bcrypt.compare(password, user.password);

    if (!match) {
      return res.status(401).json({
        message: "Wrong password"
      });
    }

    const adminUser = isAdminUser(user);
    const tokenPayload = {
      user_id: user.user_id,
    };

    if (adminUser) {
      tokenPayload.email = user.email;
      tokenPayload.role = "admin";
    }

    const token = jwt.sign(tokenPayload, process.env.JWT_SECRET, { expiresIn: "1d" });

    res.json({
      message: "Login success",
      token,
      user: {
        user_id: user.user_id,
        username: user.username,
        email: user.email,
        role: adminUser ? "admin" : "user"
      }
    });

  });

};

exports.loginAdmin = (req, res) => {

  const { email, password } = req.body;

  const sql = "SELECT * FROM users WHERE email = ?";

  db.query(sql, [email], async (err, result) => {

    if (err) {
      return res.status(500).json(err);
    }

    if (result.length === 0) {
      return res.status(401).json({
        message: "User not found"
      });
    }

    const user = result[0];

    const match = await bcrypt.compare(password, user.password);

    if (!match) {
      return res.status(401).json({
        message: "Wrong password"
      });
    }

    if (!isAdminUser(user)) {
      return res.status(403).json({
        message: "Admin access denied"
      });
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
        role: "admin"
      }
    });

  });

};

exports.adminProfile = (req, res) => {

  const sql = "SELECT user_id, username, email FROM users WHERE user_id = ?";

  db.query(sql, [req.user.user_id], (err, result) => {

    if (err) {
      return res.status(500).json(err);
    }

    if (result.length === 0) {
      return res.status(404).json({
        message: "User not found"
      });
    }

    const user = result[0];

    res.json({
      user: {
        ...user,
        role: "admin"
      }
    });

  });

};
