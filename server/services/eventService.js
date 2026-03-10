const { query } = require("../utils/dbHelpers");

const baseSelect = `
  SELECT event_id, title, description, event_date, location, max_participant, price, status, organizer_id
`;

async function queryEvents(sql, values = []) {
  try {
    return await query(sql, values);
  } catch (error) {
    if (error.code === "ER_NO_SUCH_TABLE" && sql.includes(" FROM event")) {
      const fallbackSql = sql.replace(" FROM event", " FROM tea_event");
      return query(fallbackSql, values);
    }

    throw error;
  }
}

async function getEvents() {
  return queryEvents(
    `${baseSelect}
     FROM event
     ORDER BY event_id DESC`
  );
}

async function getEventById(id) {
  const rows = await queryEvents(
    `${baseSelect}
     FROM event
     WHERE event_id = ?
     LIMIT 1`,
    [id]
  );

  if (rows.length === 0) {
    const error = new Error("Event not found");
    error.statusCode = 404;
    throw error;
  }

  return rows[0];
}

module.exports = {
  getEvents,
  getEventById
};
