const express = require("express");
const router = express.Router();

const shopImageController = require("../controllers/shopImageController");
const { uploadImage } = require("../middleware/uploadMiddleware");

router.get("/", shopImageController.getShopImages);
router.get("/shop/:shopId", shopImageController.getShopImagesByShopId);
router.get("/:id", shopImageController.getShopImageById);
router.post("/", uploadImage.single("image"), shopImageController.createShopImage);
router.delete("/:id", shopImageController.deleteShopImage);

module.exports = router;
