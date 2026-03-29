const { query } = require("../utils/dbHelpers");

async function getReports() {
  return query(
    `SELECT r.report_id, r.event_id, r.user_id, r.report_type, r.report_detail, r.status, r.created_at,
            e.title AS event_title, e.status AS event_status,
            u.username, u.email
     FROM report r
     LEFT JOIN event e ON e.event_id = r.event_id
     LEFT JOIN users u ON u.user_id = r.user_id
     ORDER BY r.created_at DESC, r.report_id DESC`
  );
}

async function updateReportStatus(reportId, status) {
  const result = await query(
    `UPDATE report
     SET status = ?
     WHERE report_id = ?`,
    [status, reportId]
  );

  if (result.affectedRows === 0) {
    const error = new Error("Report not found");
    error.statusCode = 404;
    throw error;
  }

  return {
    message: "Report status updated"
  };
}

module.exports = {
  getReports,
  updateReportStatus
};
