const { query } = require("../utils/dbHelpers");

async function getOrganizers() {
  return query(
    `SELECT o.organizer_id, o.user_id, u.email, u.username, o.first_name, o.last_name,
            o.phone, o.organization_name, o.description, o.verified_status, o.admin_note
     FROM organizer o
     LEFT JOIN users u ON u.user_id = o.user_id
     ORDER BY o.organizer_id DESC`
  );
}

async function updateOrganizerVerification(organizerId, verifiedStatus, adminNote) {
  const normalizedVerifiedStatus =
    Number(verifiedStatus) === 1 ? 1 : Number(verifiedStatus) === 2 ? 2 : 0;

  const result = await query(
    `UPDATE organizer
     SET verified_status = ?, admin_note = ?
     WHERE organizer_id = ?`,
    [normalizedVerifiedStatus, adminNote ?? null, organizerId]
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
