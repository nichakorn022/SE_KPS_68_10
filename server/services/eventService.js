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
    organizer_id,
    title,
    description,
    event_date,
    location,
    price,
    max_participant,
    status,
    id
  ]);

}

// ---------------- DELETE EVENT ----------------
async function deleteEvent(id){

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

module.exports = {
  getEvents,
  getEventById,
  createEvent,
  updateEvent,
  deleteEvent,
  searchEvents
};
