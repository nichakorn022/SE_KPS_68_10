const shopImageService = require("../services/shopImageService");

exports.getShopImages = async (req, res) => {
  try {
    const rows = await shopImageService.getShopImages();
    return res.json(rows);
  } catch (error) {
    return res.status(500).json({ message: "Failed to fetch shop images", error });
  }
};

exports.getShopImageById = async (req, res) => {
  try {
    const result = await shopImageService.getShopImageById(req.params.id);
    return res.json(result);
  } catch (error) {
    return res.status(error.statusCode || 500).json({
      message: "Failed to fetch shop image",
      error
    });
  }
};

exports.getShopImagesByShopId = async (req, res) => {
  try {
    const rows = await shopImageService.getShopImagesByShopId(req.params.shopId);
    return res.json(rows);
  } catch (error) {
    return res.status(500).json({ message: "Failed to fetch images for shop", error });
  }
};

exports.createShopImage = async (req, res) => {
  try {
    const result = await shopImageService.createShopImage(req.body);
    return res.status(201).json(result);
  } catch (error) {
    return res.status(error.statusCode || 500).json({
      message: "Failed to create shop image",
      error
    });
  }
};

exports.deleteShopImage = async (req, res) => {
  try {
    const result = await shopImageService.deleteShopImage(req.params.id);
    return res.json(result);
  } catch (error) {
    return res.status(error.statusCode || 500).json({
      message: "Failed to delete shop image",
      error
    });
  }
};
