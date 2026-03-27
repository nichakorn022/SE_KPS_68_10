
const express = require("express");
const router = express.Router();

const authController = require("../controllers/authController");
router.post("/register/user", authController.registerUser);
router.post("/register/merchant", authController.registerMerchant);
router.post("/login", authController.login);
router.post("/admin/login", authController.loginAdmin);

const authMiddleware = require("../middleware/authMiddleware");
const adminMiddleware = require("../middleware/adminMiddleware");
router.get("/profile", authMiddleware, (req,res)=>{
  res.json({
    message:"Access granted",
    user:req.user
  });
});
router.get("/admin/profile", adminMiddleware, authController.adminProfile);
module.exports = router;
