const sponsorService = require("../services/sponsorService");

class SponsorController {
  static async requestSponsor(req, res) {
    try {
      const result = await sponsorService.requestSponsor(req.body, req.user?.user_id);
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

  static async getMySponsorRequests(req, res) {
    try {
      const data = await sponsorService.getShopSponsorRequests(req.user.user_id);
      res.json(data);
    } catch (error) {
      res
        .status(error.statusCode || 500)
        .json({ message: error.message || "Failed to fetch sponsor requests" });
    }
  }

  static async getIncomingSponsorRequestsForShop(req, res) {
    try {
      const data = await sponsorService.getIncomingSponsorRequestsForShop(req.user.user_id);
      res.json(data);
    } catch (error) {
      res
        .status(error.statusCode || 500)
        .json({ message: error.message || "Failed to fetch incoming sponsor requests" });
    }
  }

  static async updateSponsorStatusByShop(req, res) {
    try {
      const result = await sponsorService.updateSponsorStatusByShop(
        req.params.id,
        req.body.status,
        req.user.user_id
      );
      res.json(result);
    } catch (error) {
      res
        .status(error.statusCode || 500)
        .json({ message: error.message || "Failed to update sponsor request" });
    }
  }

  static async cancelSponsorRequestByOrganizer(req, res) {
    try {
      const result = await sponsorService.cancelSponsorRequestByOrganizer(
        req.params.id,
        req.user.user_id
      );
      res.json(result);
    } catch (error) {
      res
        .status(error.statusCode || 500)
        .json({ message: error.message || "Failed to cancel sponsor request" });
    }
  }
}

module.exports = SponsorController;
