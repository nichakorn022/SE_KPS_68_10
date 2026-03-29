const { query } = require("../utils/dbHelpers");

const baseSelect = `
  SELECT event_id, title, description, event_date, location, max_participant, price, status, organizer_id
`;

// ---------------- GET ALL EVENTS ----------------
async function getEvents() {
  return query(`
    ${baseSelect}
    FROM event
    ORDER BY event_id DESC
  `);
}

// ---------------- GET EVENT BY ID ----------------
async function getEventById(id) {

  const rows = await query(`
    ${baseSelect}
    FROM event
    WHERE event_id = ?
    LIMIT 1
  `,[id]);

  if(rows.length === 0){
    const err = new Error("Event not found");
    err.statusCode = 404;
    throw err;
  }

  return rows[0];
}

// ---------------- CREATE EVENT ----------------
async function createEvent(data){

  const {
    organizer_id,
    title,
    description,
    event_date,
    location,
    price,
    max_participant,
    status
  } = data;

  const result = await query(`
    INSERT INTO event
    (organizer_id,title,description,event_date,location,price,max_participant,status)
    VALUES (?,?,?,?,?,?,?,?)
  `,[
    organizer_id,
    title,
    description,
    event_date,
    location,
    price,
    max_participant,
    status || "draft"
  ]);

  return result.insertId;
}

// ---------------- UPDATE EVENT ----------------
async function updateEvent(id,data){
  const existing = await getEventById(id);

  const {
    organizer_id,
    title,
    description,
    event_date,
    location,
    price,
    max_participant,
    status
  } = data;

  await query(`
    UPDATE event
    SET organizer_id=?,
        title=?,
        description=?,
        event_date=?,
        location=?,
        price=?,
        max_participant=?,
        status=?
    WHERE event_id=?
  `,[
    organizer_id ?? existing.organizer_id,
    title ?? existing.title,
    description ?? existing.description,
    event_date ?? existing.event_date,
    location ?? existing.location,
    price ?? existing.price,
    max_participant ?? existing.max_participant,
    status ?? existing.status ?? "draft",
    id
  ]);

}

// ---------------- DELETE EVENT ----------------
async function deleteEvent(id){

  // ตรวจสอบว่ามีคนสมัครกี่คน (ไม่รวม cancelled)
  const registrations = await query(
    `SELECT COUNT(*) as count FROM event_registration 
     WHERE event_id = ? AND registration_status != 'cancelled'`,
    [id]
  );

  if (registrations[0].count > 0) {
    const error = new Error(`Cannot delete event with ${registrations[0].count} active registrations`);
    error.statusCode = 409;
    throw error;
  }

  await query(`
    DELETE FROM event
    WHERE event_id=?
  `,[id]);

}

// ---------------- SEARCH EVENT ----------------
async function searchEvents(keyword){

  return query(`
    SELECT *
    FROM event
    WHERE title LIKE ?
    OR description LIKE ?
  `,[
    `%${keyword}%`,
    `%${keyword}%`
  ]);

}

// ---------------- INTEREST ----------------
async function addInterested(userId, eventId) {
  return query(
    `INSERT INTO event_interested (user_id, event_id)
     VALUES (?, ?)`,
    [userId, eventId]
  );
}

async function removeInterested(userId, eventId) {
  return query(
    `DELETE FROM event_interested
     WHERE user_id = ? AND event_id = ?`,
    [userId, eventId]
  );
}

async function checkInterested(userId, eventId) {
  const rows = await query(
    `SELECT id FROM event_interested
     WHERE user_id = ? AND event_id = ?
     LIMIT 1`,
    [userId, eventId]
  );

  return rows.length > 0;
}

async function getUserInterested(userId) {
  return query(
    `SELECT event_id
     FROM event_interested
     WHERE user_id = ?`,
    [userId]
  );
}


// ---------------- REGISTER / PAYMENT ----------------
async function registerEvent(userId, eventId) {
  // หา event เพื่อเอาราคา
  const eventRows = await query(
    `SELECT event_id, price
     FROM event
     WHERE event_id = ?
     LIMIT 1`,
    [eventId]
  );

  if (eventRows.length === 0) {
    throw new Error("Event not found");
  }

  const event = eventRows[0];

  // เช็คว่ามี registration เดิมไหม
  const registrationRows = await query(
    `SELECT registration_id, registration_status
     FROM event_registration
     WHERE user_id = ? AND event_id = ?
     LIMIT 1`,
    [userId, eventId]
  );

  let registrationId;

  if (registrationRows.length > 0) {
    registrationId = registrationRows[0].registration_id;

    // ถ้ามีอยู่แล้ว ให้เปลี่ยนกลับเป็น pending
    await query(
      `UPDATE event_registration
       SET registration_status = 'pending'
       WHERE registration_id = ?`,
      [registrationId]
    );
  } else {
    // ยังไม่มี -> สร้างใหม่
    const result = await query(
      `INSERT INTO event_registration (event_id, user_id, registration_status)
       VALUES (?, ?, 'pending')`,
      [eventId, userId]
    );

    registrationId = result.insertId;
  }

  // เช็คว่ามี payment เดิมไหม
  const paymentRows = await query(
    `SELECT payment_id
     FROM event_payment
     WHERE registration_id = ?
     LIMIT 1`,
    [registrationId]
  );

  if (paymentRows.length > 0) {
    await query(
      `UPDATE event_payment
       SET amount = ?, payment_status = 'pending', paid_at = NULL
       WHERE registration_id = ?`,
      [event.price, registrationId]
    );
  } else {
    await query(
      `INSERT INTO event_payment (registration_id, amount, payment_method, payment_status)
       VALUES (?, ?, 'promptpay', 'pending')`,
      [registrationId, event.price]
    );
  }

  return registrationId;
}

async function cancelRegistration(userId, eventId) {
  await query(
    `UPDATE event_registration
     SET registration_status = 'cancelled'
     WHERE user_id = ? AND event_id = ?`,
    [userId, eventId]
  );
}

async function checkRegistration(userId, eventId) {
  const rows = await query(
    `SELECT registration_id, registration_status
     FROM event_registration
     WHERE user_id = ? AND event_id = ?
     LIMIT 1`,
    [userId, eventId]
  );

  if (rows.length === 0) {
    return {
      exists: false,
      registration_status: null
    };
  }

  return {
    exists: true,
    registration_id: rows[0].registration_id,
    registration_status: rows[0].registration_status
  };
}

// =========== CHECK VERIFIED ORGANIZER ===========
async function getVerifiedOrganizer(userId) {
  const rows = await query(
    `SELECT organizer_id FROM organizer 
     WHERE user_id = ? AND verified_status = 1 
     LIMIT 1`,
    [userId]
  );
  return rows.length > 0 ? rows[0] : null;
}

// =========== GET EVENT REGISTRATION COUNT ===========
async function getEventRegistrationCount(eventId) {
  const rows = await query(
    `SELECT COUNT(*) as count FROM event_registration 
     WHERE event_id = ? AND registration_status != 'cancelled'`,
    [eventId]
  );
  return rows[0].count;
}

module.exports = {
  getEvents,
  getEventById,
  createEvent,
  updateEvent,
  deleteEvent,
  searchEvents,
  addInterested,
  removeInterested,
  checkInterested,
  getUserInterested,
  registerEvent,
  cancelRegistration,
  checkRegistration,
  getVerifiedOrganizer,
  getEventRegistrationCount
};
