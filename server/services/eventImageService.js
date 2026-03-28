const { query } = require("../utils/dbHelpers");

async function getEventImages() {
  return query(
    `SELECT image_id, event_id, image_path, uploaded_at
     FROM event_images
     ORDER BY image_id DESC`
  );
}

async function getEventImageById(id) {
  const rows = await query(
    `SELECT image_id, event_id, image_path, uploaded_at
     FROM event_images
     WHERE image_id = ?`,
    [id]
  );

  if (rows.length === 0) {
    const error = new Error("Event image not found");
    error.statusCode = 404;
    throw error;
  }

  return rows[0];
}

async function getEventImagesByEventId(eventId) {
  return query(
    `SELECT image_id, event_id, image_path, uploaded_at
     FROM event_images
     WHERE event_id = ?
     ORDER BY image_id DESC`,
    [eventId]
  );
}

async function createEventImage({ event_id, image_path }) {
  if (event_id === undefined || event_id === null || !String(image_path || "").trim()) {
    const error = new Error("event_id and image_path are required");
    error.statusCode = 400;
    throw error;
  }

  const result = await query(
    "INSERT INTO event_images (event_id, image_path) VALUES (?, ?)",
    [event_id, image_path]
  );

  return {
    message: "Event image created",
    image_id: result.insertId
  };
}

async function deleteEventImage(id) {
  const existing = await getEventImageById(id);
  const result = await query("DELETE FROM event_images WHERE image_id = ?", [id]);

  if (result.affectedRows === 0) {
    const error = new Error("Event image not found");
    error.statusCode = 404;
    throw error;
  }

  return {
    message: "Event image deleted",
    image_path: existing.image_path
  };
}

module.exports = {
  getEventImages,
  getEventImageById,
  getEventImagesByEventId,
  createEventImage,
  deleteEventImage
};
