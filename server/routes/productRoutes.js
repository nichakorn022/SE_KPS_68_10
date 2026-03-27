const express = require("express");
const router = express.Router();

const productController = require("../controllers/productController");
const adminMiddleware = require("../middleware/adminMiddleware");
const authMiddleware = require("../middleware/authMiddleware");

router.get("/", productController.getProducts);
router.get("/mine", authMiddleware, productController.getOwnProducts);
router.post("/mine", authMiddleware, productController.createOwnProduct);
router.put("/mine/:id", authMiddleware, productController.updateOwnProduct);
router.delete("/mine/:id", authMiddleware, productController.deleteOwnProduct);
router.get("/:id", productController.getProductById);
router.post("/", adminMiddleware, productController.createProduct);
router.put("/:id", adminMiddleware, productController.updateProduct);
router.delete("/:id", adminMiddleware, productController.deleteProduct);

module.exports = router;
