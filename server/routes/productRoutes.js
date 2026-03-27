const express = require("express");
const router = express.Router();

const productController = require("../controllers/productController");
const adminMiddleware = require("../middleware/adminMiddleware");

router.get("/", productController.getProducts);
router.get("/:id", productController.getProductById);
router.post("/", adminMiddleware, productController.createProduct);
router.put("/:id", adminMiddleware, productController.updateProduct);
router.delete("/:id", adminMiddleware, productController.deleteProduct);

module.exports = router;
