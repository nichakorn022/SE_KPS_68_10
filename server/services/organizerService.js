const { query } = require("../utils/dbHelpers");
const { sendApprovalDecisionEmail } = require("../utils/mailer");

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
  const normalizedVerifiedStatus =
    Number(verifiedStatus) === 1 ? 1 : Number(verifiedStatus) === 2 ? 2 : 0;

  const organizerRows = await query(
    `SELECT o.organizer_id, o.user_id, o.organization_name, o.first_name, o.last_name, u.email, u.username
     FROM organizer o
     LEFT JOIN users u ON u.user_id = o.user_id
     WHERE o.organizer_id = ?
     LIMIT 1`,
    [organizerId]
  );

  if (organizerRows.length === 0) {
    const error = new Error("Organizer not found");
    error.statusCode = 404;
    throw error;
  }

  const userId = organizerRows[0].user_id;

  const result = await query(
    `UPDATE organizer
     SET verified_status = ?
     WHERE organizer_id = ?`,
    [normalizedVerifiedStatus, organizerId]
  );

  if (normalizedVerifiedStatus === 1) {
    await query(
      `UPDATE users
       SET role = 'organizer'
       WHERE user_id = ? AND role <> 'admin'`,
      [userId]
    );

    await sendApprovalDecisionEmail({
      to: organizerRows[0].email,
      username: organizerRows[0].username,
      subjectType: "organizer request",
      subjectName:
        [organizerRows[0].first_name, organizerRows[0].last_name].filter(Boolean).join(" ") ||
        organizerRows[0].organization_name ||
        `Organizer ${organizerId}`,
      approved: true,
    });
  }

  return {
    message: "Organizer verification updated"
  };
}

async function deleteOrganizerRequest(organizerId) {
  const organizerRows = await query(
    `SELECT o.organizer_id, o.user_id, o.organization_name, o.first_name, o.last_name, u.email, u.username
     FROM organizer o
     LEFT JOIN users u ON u.user_id = o.user_id
     WHERE o.organizer_id = ?
     LIMIT 1`,
    [organizerId]
  );

  if (organizerRows.length === 0) {
    const error = new Error("Organizer not found");
    error.statusCode = 404;
    throw error;
  }

  const userId = organizerRows[0].user_id;

  const result = await query("DELETE FROM organizer WHERE organizer_id = ?", [organizerId]);

  await query(
    `UPDATE users
     SET role = 'user'
     WHERE user_id = ? AND role = 'organizer'`,
    [userId]
  );

  await sendApprovalDecisionEmail({
    to: organizerRows[0].email,
    username: organizerRows[0].username,
    subjectType: "organizer request",
    subjectName:
      [organizerRows[0].first_name, organizerRows[0].last_name].filter(Boolean).join(" ") ||
      organizerRows[0].organization_name ||
      `Organizer ${organizerId}`,
    approved: false,
  });

  return {
    message: "Organizer request removed"
  };
}

module.exports = {
  getOrganizers,
  updateOrganizerVerification,
  deleteOrganizerRequest
};
