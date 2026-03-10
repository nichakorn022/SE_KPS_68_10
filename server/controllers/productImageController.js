const productImageService = require("../services/productImageService");

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
    const result = await productImageService.createProductImage(req.body);
    return res.status(201).json(result);
  } catch (error) {
    return res.status(error.statusCode || 500).json({
      message: "Failed to create product image",
      error
    });
  }
};

exports.deleteProductImage = async (req, res) => {
  try {
    const result = await productImageService.deleteProductImage(req.params.id);
    return res.json(result);
  } catch (error) {
    return res.status(error.statusCode || 500).json({
      message: "Failed to delete product image",
      error
    });
  }
};
