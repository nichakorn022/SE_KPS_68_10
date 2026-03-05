const express = require("express");
const router = express.Router();

const shopController = require("../controllers/shopController");

router.get("/", shopController.getShops);
router.get("/:id", shopController.getShopById);
router.post("/", shopController.createShop);

module.exports = router;
