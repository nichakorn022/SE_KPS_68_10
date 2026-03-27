const productImageService = require("../services/productImageService");
const { uploadImageFile, deleteImageByPath } = require("../utils/r2Storage");

exports.getProductImages = async (req, res) => {
  try {
    const rows = await productImageService.getProductImages();
    return res.json(rows);
  } catch (error) {
    return res.status(500).json({ message: "Failed to fetch product images", error });
  }
};

exports.getProductImageById = async (req, res) => {
  try {
    const result = await productImageService.getProductImageById(req.params.id);
    return res.json(result);
  } catch (error) {
    return res.status(error.statusCode || 500).json({
      message: "Failed to fetch product image",
      error
    });
  }
};

exports.getProductImagesByProductId = async (req, res) => {
  try {
    const rows = await productImageService.getProductImagesByProductId(req.params.productId);
    return res.json(rows);
  } catch (error) {
    return res.status(500).json({ message: "Failed to fetch images for product", error });
  }
};

exports.createProductImage = async (req, res) => {
  try {
    const payload = { ...req.body };

    if (req.file && (payload.product_id === undefined || payload.product_id === null || payload.product_id === "")) {
      const error = new Error("product_id is required");
      error.statusCode = 400;
      throw error;
    }

    if (req.file) {
      const uploadResult = await uploadImageFile({
        file: req.file,
        folder: "products",
        entityId: payload.product_id
      });
      payload.image_path = uploadResult.imageUrl;
    }

    const result = await productImageService.createProductImage(payload);
    return res.status(201).json(result);
  } catch (error) {
    return res.status(error.statusCode || 500).json({
      message: "Failed to create product image",
      error: error.message || error
    });
  }
};

exports.deleteProductImage = async (req, res) => {
  try {
    const result = await productImageService.deleteProductImage(req.params.id);
    await deleteImageByPath(result.image_path);
    return res.json(result);
  } catch (error) {
    return res.status(error.statusCode || 500).json({
      message: "Failed to delete product image",
      error: error.message || error
    });
  }
};
