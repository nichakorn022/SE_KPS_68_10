const { beginTransaction, commit, rollback, query } = require("../utils/dbHelpers");

async function getUsers() {
  return query(
    `SELECT user_id, username, email, role, avatar, created_at
     FROM users
     ORDER BY user_id DESC`
  );
}

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

async function updateUser(userId, payload) {
  const username = String(payload.username || "").trim();
  const email = String(payload.email || "").trim();

  if (!username || !email) {
    const error = new Error("username and email are required");
    error.statusCode = 400;
    throw error;
  }

  const duplicateRows = await query(
    `SELECT user_id
     FROM users
     WHERE (username = ? OR email = ?)
       AND user_id <> ?
     LIMIT 1`,
    [username, email, userId]
  );

  if (duplicateRows.length > 0) {
    const error = new Error("Username or email already exists");
    error.statusCode = 400;
    throw error;
  }

  const result = await query(
    `UPDATE users
     SET username = ?, email = ?
     WHERE user_id = ?`,
    [username, email, userId]
  );

  if (result.affectedRows === 0) {
    const error = new Error("User not found");
    error.statusCode = 404;
    throw error;
  }

  return getUserById(userId);
}

async function deleteUser(userId) {
  try {
    await beginTransaction();

    const userRows = await query(
      `SELECT user_id, role
       FROM users
       WHERE user_id = ?
       LIMIT 1`,
      [userId]
    );

    if (userRows.length === 0) {
      const error = new Error("User not found");
      error.statusCode = 404;
      throw error;
    }

    if (String(userRows[0].role).toLowerCase() === "admin") {
      const error = new Error("Admin user cannot be deleted");
      error.statusCode = 400;
      throw error;
    }

    const organizerRows = await query(
      `SELECT organizer_id
       FROM organizer
       WHERE user_id = ?
       LIMIT 1`,
      [userId]
    );

    if (organizerRows.length > 0) {
      const organizerId = organizerRows[0].organizer_id;
      const eventRows = await query(
        `SELECT event_id
         FROM event
         WHERE organizer_id = ?
         LIMIT 1`,
        [organizerId]
      );

      if (eventRows.length > 0) {
        const error = new Error("Cannot delete organizer account with existing events");
        error.statusCode = 400;
        throw error;
      }

      await query("DELETE FROM organizer WHERE organizer_id = ?", [organizerId]);
    }

    const orderRows = await query(
      `SELECT order_id
       FROM orders
       WHERE user_id = ?`,
      [userId]
    );

    if (orderRows.length > 0) {
      const orderIds = orderRows.map((row) => row.order_id);
      const orderDetailRows = await query(
        `SELECT order_detail_id
         FROM order_details
         WHERE order_id IN (?)`,
        [orderIds]
      );
      if (orderDetailRows.length > 0) {
        const orderDetailIds = orderDetailRows.map((row) => row.order_detail_id);
        await query(`DELETE FROM product_review WHERE order_detail_id IN (?)`, [orderDetailIds]);
      }
      await query(`DELETE FROM order_details WHERE order_id IN (?)`, [orderIds]);
      await query(`DELETE FROM orders WHERE order_id IN (?)`, [orderIds]);
    }

    const registrationRows = await query(
      `SELECT registration_id
       FROM event_registration
       WHERE user_id = ?`,
      [userId]
    );

    if (registrationRows.length > 0) {
      const registrationIds = registrationRows.map((row) => row.registration_id);
      await query(`DELETE FROM event_payment WHERE registration_id IN (?)`, [registrationIds]);
      await query(`DELETE FROM event_registration WHERE registration_id IN (?)`, [registrationIds]);
    }

    await query("DELETE FROM event_interested WHERE user_id = ?", [userId]);
    await query("DELETE FROM report WHERE user_id = ?", [userId]);
    await query("DELETE FROM user_address WHERE user_id = ?", [userId]);
    await query("DELETE FROM users WHERE user_id = ?", [userId]);

    await commit();
    return { message: "User deleted" };
  } catch (error) {
    await rollback();
    throw error;
  }
}

module.exports = {
  getUsers,
  getUserById,
  updateUserAvatar,
  updateUser,
  deleteUser,
};
