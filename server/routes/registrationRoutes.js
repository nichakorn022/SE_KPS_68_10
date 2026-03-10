const express = require("express");
const router = express.Router();

const RegistrationController = require("../controllers/RegistrationController");

/*
POST /api/registrations
สมัครเข้าร่วมกิจกรรม
body:
{
  event_id,
  user_id
}
*/
router.post("/", RegistrationController.registerEvent);

/*
DELETE /api/registrations/:id
ยกเลิกการสมัคร
*/
router.delete("/:id", RegistrationController.cancelRegistration);

/*
GET /api/registrations/user/:userId
ดูรายการกิจกรรมที่ user สมัคร
*/
router.get("/user/:userId", RegistrationController.getUserRegistrations);

module.exports = router;