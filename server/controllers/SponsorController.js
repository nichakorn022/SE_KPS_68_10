const sponsorService = require("../services/sponsorService");

class SponsorController {
  static async requestSponsor(req, res) {
    try {
      const result = await sponsorService.requestSponsor(req.body);
      res.status(201).json(result);
    } catch (error) {
      res
        .status(error.statusCode || 500)
        .json({ message: error.message || "Failed to create sponsor request" });
    }
  }

  static async getSponsorRequests(req, res) {
    try {
      const data = await sponsorService.getSponsorRequests();
      res.json(data);
    } catch (error) {
      res
        .status(error.statusCode || 500)
        .json({ message: error.message || "Failed to fetch sponsor requests" });
    }
  }

  static async updateSponsorStatus(req, res) {
    try {
      const result = await sponsorService.updateSponsorStatus(req.params.id, req.body.status);
      res.json(result);
    } catch (error) {
      res
        .status(error.statusCode || 500)
        .json({ message: error.message || "Failed to update sponsor status" });
    }
  }

  static async deleteSponsorRequest(req, res) {
    try {
      const result = await sponsorService.deleteSponsorRequest(req.params.id);
      res.json(result);
    } catch (error) {
      res
        .status(error.statusCode || 500)
        .json({ message: error.message || "Failed to delete sponsor request" });
    }
  }
}

module.exports = SponsorController;
