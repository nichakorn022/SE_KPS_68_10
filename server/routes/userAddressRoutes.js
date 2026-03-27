const express = require("express");
const router = express.Router();

const authMiddleware = require("../middleware/authMiddleware");
const userAddressController = require("../controllers/userAddressController");

router.use(authMiddleware);
router.get("/", userAddressController.getAddresses);
router.get("/default", userAddressController.getDefaultAddress);
router.get("/:id", userAddressController.getAddressById);
router.post("/", userAddressController.createAddress);
router.put("/:id", userAddressController.updateAddress);
router.patch("/:id/default", userAddressController.setDefaultAddress);

module.exports = router;
