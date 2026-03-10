const { query } = require("../utils/dbHelpers");

async function queryEventTable(sql, params = []) {
  try {
    console.log('[events] SQL>', sql.trim().replace(/\s+/g, ' '), params);
    return await query(sql, params);
  } catch (err) {
    console.error('[events] SQL error', { err: err && err.message, code: err && err.code, sql, params });
    // attach sql to the error for upstream logging
    err.sql = sql;
    throw err;
  }
}

// Try primary `event` table, if missing fall back to `tea_event` (legacy)
async function getEvents() {
  const primarySql = `SELECT
       e.event_id AS id,
       e.title,
       e.description,
       e.event_date AS date,
       e.location,
       e.max_participant AS slots,
       e.price,
       e.status,
       o.name AS organizer,
       (SELECT img FROM event_images ei WHERE ei.event_id = e.event_id LIMIT 1) AS img
     FROM event e
     LEFT JOIN organizer o ON e.organizer_id = o.organizer_id
     ORDER BY e.event_id DESC`;

  try {
    return await queryEventTable(primarySql);
  } catch (err) {
    if (err && err.code === "ER_NO_SUCH_TABLE") {
      // fallback
      const fallbackSql = `SELECT event_id AS id, title, description, event_date AS date, location, max_participant AS slots, price, status, organizer_id AS organizer, (SELECT img FROM event_images ei WHERE ei.event_id = e.event_id LIMIT 1) AS img FROM tea_event e ORDER BY event_id DESC`;
      const rows = await queryEventTable(fallbackSql);
      // Normalize organizer field (we only have id)
      return rows.map(r => ({
        id: r.id,
        title: r.title,
        description: r.description,
        date: r.date,
        location: r.location,
        slots: r.slots,
        price: r.price,
        status: r.status,
        organizer: r.organizer || r.organizer_id || null,
        img: r.img
      }));
    }
    throw err;
  }
}

async function getEventById(id) {
  const primarySql = `SELECT
       e.event_id AS id,
       e.title,
       e.description,
       e.event_date AS date,
       e.location,
       e.max_participant AS slots,
       e.price,
       e.status,
       o.name AS organizer,
       (SELECT img FROM event_images ei WHERE ei.event_id = e.event_id LIMIT 1) AS img
     FROM event e
     LEFT JOIN organizer o ON e.organizer_id = o.organizer_id
     WHERE e.event_id = ?
     LIMIT 1`;

  try {
    const rows = await queryEventTable(primarySql, [id]);
    if (rows.length === 0) {
      const error = new Error("Event not found");
      error.statusCode = 404;
      throw error;
    }
    return rows[0];
  } catch (err) {
    if (err && err.code === "ER_NO_SUCH_TABLE") {
      const fallbackSql = `SELECT event_id AS id, title, description, event_date AS date, location, max_participant AS slots, price, status, organizer_id AS organizer, (SELECT img FROM event_images ei WHERE ei.event_id = e.event_id LIMIT 1) AS img FROM tea_event e WHERE event_id = ? LIMIT 1`;
      const rows = await queryEventTable(fallbackSql, [id]);
      if (rows.length === 0) {
        const error = new Error("Event not found");
        error.statusCode = 404;
        throw error;
      }
      const r = rows[0];
      return {
        id: r.id,
        title: r.title,
        description: r.description,
        date: r.date,
        location: r.location,
        slots: r.slots,
        price: r.price,
        status: r.status,
        organizer: r.organizer || r.organizer_id || null,
        img: r.img
      };
    }
    throw err;
  }
}

module.exports = {
  getEvents,
  getEventById
};
