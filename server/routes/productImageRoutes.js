const express = require("express");
const router = express.Router();

const productImageController = require("../controllers/productImageController");

router.get("/", productImageController.getProductImages);
router.get("/product/:productId", productImageController.getProductImagesByProductId);
router.get("/:id", productImageController.getProductImageById);
router.post("/", productImageController.createProductImage);
router.delete("/:id", productImageController.deleteProductImage);

module.exports = router;
