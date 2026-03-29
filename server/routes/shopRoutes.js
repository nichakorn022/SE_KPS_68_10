const express = require("express");
const router = express.Router();

const shopController = require("../controllers/shopController");
const adminMiddleware = require("../middleware/adminMiddleware");
const authMiddleware = require("../middleware/authMiddleware");

router.get("/", shopController.getShops);
router.get("/:id", shopController.getShopById);
router.post("/", shopController.createShop);
router.patch("/:id", authMiddleware, shopController.updateShopByOwner);
router.patch("/:id/verification", adminMiddleware, shopController.updateShopVerification);

module.exports = router;
