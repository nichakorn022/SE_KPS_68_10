const { query } = require("../utils/dbHelpers");

async function getRegistrations() {
  return query(
    `SELECT registration_id, event_id, user_id, registration_status
     FROM event_registration
     ORDER BY registration_id DESC`
  );
}

async function registerEvent(data) {
  const { event_id, user_id } = data;

  const result = await query(
    `INSERT INTO event_registration (event_id, user_id, registration_status)
     VALUES (?, ?, 'REGISTERED')`,
    [event_id, user_id]
  );

  return result.insertId;
}

async function cancelRegistration(id) {
  await query(
    `UPDATE event_registration
     SET registration_status = 'CANCELLED'
     WHERE registration_id = ?`,
    [id]
  );
}

async function getUserRegistrations(userId) {
  return query(
    `SELECT e.title, e.event_date, r.registration_id, r.registration_status
     FROM event_registration r
     JOIN event e ON e.event_id = r.event_id
     WHERE r.user_id = ?
     ORDER BY e.event_date DESC`,
    [userId]
  );
}

module.exports = {
  getRegistrations,
  registerEvent,
  cancelRegistration,
  getUserRegistrations,
};
