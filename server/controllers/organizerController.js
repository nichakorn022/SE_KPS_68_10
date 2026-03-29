const organizerService = require("../services/organizerService");

exports.getOrganizers = (req, res) => {
  organizerService
    .getOrganizers()
    .then((result) => res.json(result))
    .catch((error) =>
      res
        .status(error.statusCode || 500)
        .json({ message: "Failed to fetch organizers", error: error.message })
    );
};

exports.updateOrganizerVerification = (req, res) => {
  const { id } = req.params;

  organizerService
    .updateOrganizerVerification(id, req.body.verified_status)
    .then((result) => res.json(result))
    .catch((error) =>
      res
        .status(error.statusCode || 500)
        .json({ message: "Failed to update organizer verification", error: error.message })
    );
};

exports.deleteOrganizerRequest = (req, res) => {
  const { id } = req.params;

  organizerService
    .deleteOrganizerRequest(id)
    .then((result) => res.json(result))
    .catch((error) =>
      res.status(error.statusCode || 500).json({ message: error.message || "Failed to delete organizer request" })
    );
};
