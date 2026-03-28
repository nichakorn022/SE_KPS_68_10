const reportService = require("../services/reportService");

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
    .updateReportStatus(id, req.body.status, req.body.admin_note)
    .then((result) => res.json(result))
    .catch((error) =>
      res
        .status(error.statusCode || 500)
        .json({ message: "Failed to update report status", error: error.message })
    );
};
