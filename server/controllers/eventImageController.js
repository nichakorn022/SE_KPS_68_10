const eventImageService = require("../services/eventImageService");
const { uploadImageFile, deleteImageByPath } = require("../utils/r2Storage");

exports.getEventImages = async (req, res) => {
  try {
    const rows = await eventImageService.getEventImages();
    return res.json(rows);
  } catch (error) {
    return res.status(500).json({ message: "Failed to fetch event images", error });
  }
};

exports.getEventImageById = async (req, res) => {
  try {
    const result = await eventImageService.getEventImageById(req.params.id);
    return res.json(result);
  } catch (error) {
    return res.status(error.statusCode || 500).json({
      message: "Failed to fetch event image",
      error
    });
  }
};

exports.getEventImagesByEventId = async (req, res) => {
  try {
    const rows = await eventImageService.getEventImagesByEventId(req.params.eventId);
    return res.json(rows);
  } catch (error) {
    return res.status(500).json({ message: "Failed to fetch images for event", error });
  }
};

exports.createEventImage = async (req, res) => {
  try {
    const payload = { ...req.body };

    if (req.file && (payload.event_id === undefined || payload.event_id === null || payload.event_id === "")) {
      const error = new Error("event_id is required");
      error.statusCode = 400;
      throw error;
    }

    if (req.file) {
      const uploadResult = await uploadImageFile({
        file: req.file,
        folder: "events",
        entityId: payload.event_id
      });
      payload.image_path = uploadResult.imageUrl;
    }

    const result = await eventImageService.createEventImage(payload);
    return res.status(201).json(result);
  } catch (error) {
    return res.status(error.statusCode || 500).json({
      message: "Failed to create event image",
      error: error.message || error
    });
  }
};

exports.deleteEventImage = async (req, res) => {
  try {
    const result = await eventImageService.deleteEventImage(req.params.id);
    await deleteImageByPath(result.image_path);
    return res.json(result);
  } catch (error) {
    return res.status(error.statusCode || 500).json({
      message: "Failed to delete event image",
      error: error.message || error
    });
  }
};
