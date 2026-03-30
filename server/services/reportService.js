const { query } = require("../utils/dbHelpers");

async function getUserReportForEvent({ event_id, user_id }) {
  if (!event_id || !user_id) {
    const error = new Error("event_id and user_id are required");
    error.statusCode = 400;
    throw error;
  }

  const rows = await query(
    `SELECT report_id, event_id, user_id, report_type, report_detail, status, created_at
     FROM report
     WHERE event_id = ? AND user_id = ?
     ORDER BY report_id DESC
     LIMIT 1`,
    [event_id, user_id]
  );

  return rows[0] || null;
}

async function createReport({ event_id, user_id, report_type, report_detail }) {
  if (!event_id || !user_id || !String(report_detail || "").trim()) {
    const error = new Error("event_id, user_id, and report_detail are required");
    error.statusCode = 400;
    throw error;
  }

  const eventRows = await query(
    `SELECT event_id
     FROM event
     WHERE event_id = ?
     LIMIT 1`,
    [event_id]
  );

  if (eventRows.length === 0) {
    const error = new Error("Event not found");
    error.statusCode = 404;
    throw error;
  }

  const existingReport = await getUserReportForEvent({ event_id, user_id });

  if (existingReport) {
    const error = new Error("You have already reported this event");
    error.statusCode = 409;
    throw error;
  }

  const result = await query(
    `INSERT INTO report (event_id, user_id, report_type, report_detail, status)
     VALUES (?, ?, ?, ?, 'pending')`,
    [event_id, user_id, report_type || "event", String(report_detail).trim()]
  );

  return {
    message: "Report submitted successfully",
    report_id: result.insertId,
    status: "pending",
  };
}

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
  createReport,
  getUserReportForEvent,
  getReports,
  updateReportStatus
};
