
const express = require("express");
const router = express.Router();

const authController = require("../controllers/authController");
console.log(authController);
router.post("/register/user", authController.registerUser);
router.post("/login", authController.login);

const authMiddleware = require("../middleware/authMiddleware");
router.get("/profile", authMiddleware, (req,res)=>{
  res.json({
    message:"Access granted",
    user:req.user
  });
});
module.exports = router;