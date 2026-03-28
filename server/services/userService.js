const { query } = require("../utils/dbHelpers");

async function getUserById(userId) {
  const rows = await query(
    `SELECT user_id, username, email, role, created_at
     FROM users
     WHERE user_id = ?
     LIMIT 1`,
    [userId]
  );

  return rows && rows.length ? rows[0] : null;
}

async function updateUserAvatar(userId, avatarPath) {
  await query(
    `UPDATE users SET avatar = ? WHERE user_id = ?`,
    [avatarPath, userId]
  );
}

module.exports = {
  getUserById,
  updateUserAvatar,
};
