const express = require("express");
const router = express.Router();

const productImageController = require("../controllers/productImageController");
const { uploadImage } = require("../middleware/uploadMiddleware");

router.get("/", productImageController.getProductImages);
router.get("/product/:productId", productImageController.getProductImagesByProductId);
router.get("/:id", productImageController.getProductImageById);
router.post("/", uploadImage.single("image"), productImageController.createProductImage);
router.delete("/:id", productImageController.deleteProductImage);

module.exports = router;
