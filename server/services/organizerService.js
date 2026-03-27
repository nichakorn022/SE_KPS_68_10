const { query } = require("../utils/dbHelpers");

async function getOrganizers() {
  return query(
    `SELECT o.organizer_id, o.user_id, u.email, u.username, o.first_name, o.last_name,
            o.phone, o.organization_name, o.description, o.verified_status
     FROM organizer o
     LEFT JOIN users u ON u.user_id = o.user_id
     ORDER BY o.organizer_id DESC`
  );
}

async function updateOrganizerVerification(organizerId, verifiedStatus) {
  const result = await query(
    `UPDATE organizer
     SET verified_status = ?
     WHERE organizer_id = ?`,
    [verifiedStatus ? 1 : 0, organizerId]
  );

  if (result.affectedRows === 0) {
    const error = new Error("Organizer not found");
    error.statusCode = 404;
    throw error;
  }

  return {
    message: "Organizer verification updated"
  };
}

module.exports = {
  getOrganizers,
  updateOrganizerVerification
};
