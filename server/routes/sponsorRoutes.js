const express = require("express");
const router = express.Router();

const SponsorController = require("../controllers/SponsorController");

/*
POST /api/sponsors/request
ส่งคำขอสปอนเซอร์
*/
router.post("/request", SponsorController.requestSponsor);

/*
PUT /api/sponsors/approve/:id
อนุมัติสปอนเซอร์
*/
router.put("/approve/:id", SponsorController.approveSponsor);

/*
GET /api/sponsors/requests
ดูคำขอสปอนเซอร์ทั้งหมด
*/
router.get("/requests", SponsorController.getSponsorRequests);



module.exports = router;