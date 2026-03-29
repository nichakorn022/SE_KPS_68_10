const shopImageService = require("../services/shopImageService");
const shopService = require("../services/shopService");
const { uploadImageFile, deleteImageByPath } = require("../utils/r2Storage");

async function assertCanManageShopImage(req, shopId) {
  if (!req.user) {
    const error = new Error("Unauthorized");
    error.statusCode = 401;
    throw error;
  }

  if (req.user.role === "admin") return;

  const shop = await shopService.getShopById(shopId);
  if (String(shop.user_id) !== String(req.user.user_id)) {
    const error = new Error("Forbidden");
    error.statusCode = 403;
    throw error;
  }
}

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
    const payload = { ...req.body };

    if (req.file && (payload.shop_id === undefined || payload.shop_id === null || payload.shop_id === "")) {
      const error = new Error("shop_id is required");
      error.statusCode = 400;
      throw error;
    }

    await assertCanManageShopImage(req, payload.shop_id);

    if (req.file) {
      const uploadResult = await uploadImageFile({
        file: req.file,
        folder: "shops",
        entityId: payload.shop_id
      });
      payload.image_path = uploadResult.imageUrl;
    }

    const result = await shopImageService.createShopImage(payload);
    return res.status(201).json(result);
  } catch (error) {
    return res.status(error.statusCode || 500).json({
      message: error.message || "Failed to create shop image",
      error: error.message || error
    });
  }
};

exports.deleteShopImage = async (req, res) => {
  try {
    const image = await shopImageService.getShopImageById(req.params.id);
    await assertCanManageShopImage(req, image.shop_id);
    const result = await shopImageService.deleteShopImage(req.params.id);
    await deleteImageByPath(result.image_path);
    return res.json(result);
  } catch (error) {
    return res.status(error.statusCode || 500).json({
      message: error.message || "Failed to delete shop image",
      error: error.message || error
    });
  }
};
