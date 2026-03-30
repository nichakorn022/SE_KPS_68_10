const reportService = require("../services/reportService");

function ensureUserReporter(req, res) {
  const role = String(req.user?.role || "").toLowerCase();
  const organizerId = req.user?.organizer_id;

  if (role !== "user" || organizerId) {
    res.status(403).json({ message: "Only user accounts can report events" });
    return false;
  }

  return true;
}

exports.createReport = (req, res) => {
  if (!ensureUserReporter(req, res)) return;

  reportService
    .createReport({
      event_id: req.body.event_id,
      user_id: req.user.user_id,
      report_type: req.body.report_type || "event",
      report_detail: req.body.report_detail,
    })
    .then((result) => res.status(201).json(result))
    .catch((error) =>
      res
        .status(error.statusCode || 500)
        .json({ message: error.message || "Failed to submit report", error: error.message })
    );
};

exports.getMyEventReportStatus = (req, res) => {
  if (!ensureUserReporter(req, res)) return;

  reportService
    .getUserReportForEvent({
      event_id: req.params.eventId,
      user_id: req.user.user_id,
    })
    .then((report) =>
      res.json({
        hasReported: Boolean(report),
        report: report || null,
      })
    )
    .catch((error) =>
      res
        .status(error.statusCode || 500)
        .json({ message: "Failed to fetch report status", error: error.message })
    );
};

exports.getReports = (req, res) => {
  reportService
    .getReports()
    .then((result) => res.json(result))
    .catch((error) =>
      res
        .status(error.statusCode || 500)
        .json({ message: "Failed to fetch reports", error: error.message })
    );
};

exports.updateReportStatus = (req, res) => {
  const { id } = req.params;

  reportService
    .updateReportStatus(id, req.body.status)
    .then((result) => res.json(result))
    .catch((error) =>
      res
        .status(error.statusCode || 500)
        .json({ message: "Failed to update report status", error: error.message })
    );
};
