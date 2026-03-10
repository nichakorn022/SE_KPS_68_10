const db = require("../config/db");

async function registerEvent(data){

  const { event_id, user_id } = data;

  const [result] = await db.query(
    `INSERT INTO event_registration
    (event_id,user_id,registration_status)
    VALUES (?,?, 'REGISTERED')`,
    [event_id,user_id]
  );

  return result.insertId;
}

async function cancelRegistration(id){

  await db.query(
    `UPDATE event_registration
     SET registration_status='CANCELLED'
     WHERE registration_id=?`,
    [id]
  );

}

async function getUserRegistrations(userId){

  const [rows] = await db.query(
    `SELECT e.title, e.event_date
     FROM event_registration r
     JOIN event e ON e.event_id=r.event_id
     WHERE r.user_id=?`,
    [userId]
  );

  return rows;

}

module.exports = {
  registerEvent,
  cancelRegistration,
  getUserRegistrations
};