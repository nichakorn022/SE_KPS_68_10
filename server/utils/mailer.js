const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.MAIL_USER,
    pass: process.env.MAIL_PASS,
  },
});

/**
 * Send event registration confirmation email.
 */
async function sendRegistrationConfirmation({ to, username, eventTitle, eventDate }) {
  if (!process.env.MAIL_USER || !process.env.MAIL_PASS) {
    console.warn("MAIL_USER / MAIL_PASS not set – skipping confirmation email");
    return;
  }

  const formattedDate = eventDate
    ? new Date(eventDate).toLocaleDateString("th-TH", { year: "numeric", month: "long", day: "numeric" })
    : "TBA";

  const html = `
<!DOCTYPE html>
<html lang="th">
<head><meta charset="UTF-8"></head>
<body style="margin:0;padding:0;background:#f5f3ed;font-family:'Segoe UI',Tahoma,Geneva,Verdana,sans-serif">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f5f3ed;padding:32px 0">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 2px 12px rgba(0,0,0,0.08)">
        <tr><td style="background:#485B3B;padding:28px 40px">
          <h1 style="margin:0;color:#fff;font-size:22px;font-weight:700">แจ้งเตือนการยืนยันเข้าร่วมกิจกรรม</h1>
          <p style="margin:6px 0 0;color:#c8d6c0;font-size:14px">${eventTitle}</p>
        </td></tr>
        <tr><td style="padding:36px 40px 20px">
          <p style="margin:0 0 20px;color:#24321F;font-size:16px"><strong>เรียน ${username || "ผู้ใช้งาน"}</strong></p>
          <p style="margin:0 0 16px;color:#4a4a4a;font-size:15px;line-height:1.7">ขณะนี้กิจกรรม <strong>&ldquo;${eventTitle}&rdquo;</strong> ที่ท่านได้แสดงความสนใจไว้ กำลังจะถึงวันเริ่มกิจกรรมแล้ว</p>
          <table width="100%" style="background:#faf8f2;border-radius:10px;margin:20px 0"><tr><td style="padding:20px 24px">
            <p style="margin:0 0 8px;color:#6f7b70;font-size:12px;text-transform:uppercase;letter-spacing:1px;font-weight:700">รายละเอียดกิจกรรม</p>
            <p style="margin:0 0 6px;color:#24321F;font-size:16px;font-weight:600">${eventTitle}</p>
            <p style="margin:0;color:#6f7b70;font-size:14px">📅 วันที่: ${formattedDate}</p>
          </td></tr></table>
          <p style="margin:16px 0;color:#4a4a4a;font-size:15px;line-height:1.7">หากท่านประสงค์เข้าร่วมกิจกรรม กรุณาดำเนินการชำระเงินเพื่อยืนยันการเข้าร่วม ภายในระยะเวลาที่กำหนด</p>
          <p style="margin:24px 0 0;color:#4a4a4a;font-size:15px">ขอขอบพระคุณที่ให้ความสนใจในกิจกรรมของเรา</p>
        </td></tr>
        <tr><td style="padding:20px 40px 32px;border-top:1px solid #f0ede6">
          <p style="margin:0;color:#b0a99a;font-size:12px;text-align:center">© ${new Date().getFullYear()} ATC Tea Community — อีเมลนี้ส่งโดยอัตโนมัติ กรุณาอย่าตอบกลับ</p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body></html>`;

  await transporter.sendMail({
    from: `"ATC Tea Community" <${process.env.MAIL_USER}>`,
    to,
    subject: `แจ้งเตือนการยืนยันเข้าร่วมกิจกรรม ${eventTitle}`,
    html,
  });
}

/**
 * Send welcome email after user account registration.
 */
async function sendWelcomeEmail({ to, username }) {
  if (!process.env.MAIL_USER || !process.env.MAIL_PASS) {
    console.warn("MAIL_USER / MAIL_PASS not set – skipping welcome email");
    return;
  }

  const html = `
<!DOCTYPE html>
<html lang="th">
<head><meta charset="UTF-8"></head>
<body style="margin:0;padding:0;background:#f5f3ed;font-family:'Segoe UI',Tahoma,Geneva,Verdana,sans-serif">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f5f3ed;padding:32px 0">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 2px 12px rgba(0,0,0,0.08)">
        <tr><td style="background:#485B3B;padding:28px 40px;text-align:center">
          <h1 style="margin:0;color:#fff;font-size:24px;font-weight:700">ยินดีต้อนรับสู่ ATC Tea Community</h1>
        </td></tr>
        <tr><td style="padding:36px 40px 20px">
          <p style="margin:0 0 20px;color:#24321F;font-size:16px"><strong>เรียน ${username || "ผู้ใช้งาน"}</strong></p>
          <p style="margin:0 0 16px;color:#4a4a4a;font-size:15px;line-height:1.7">การสมัครสมาชิกของท่านสำเร็จเรียบร้อยแล้ว 🎉</p>
          <p style="margin:0 0 16px;color:#4a4a4a;font-size:15px;line-height:1.7">ขณะนี้ท่านสามารถเข้าสู่ระบบและเริ่มใช้งานเว็บไซต์ของเราได้ทันที ไม่ว่าจะเป็นการเลือกซื้อสินค้าชา สมัครเข้าร่วมกิจกรรม หรือเชื่อมต่อกับชุมชนคนรักชา</p>
          <table width="100%" style="background:#faf8f2;border-radius:10px;margin:20px 0"><tr><td style="padding:20px 24px">
            <p style="margin:0 0 8px;color:#6f7b70;font-size:12px;text-transform:uppercase;letter-spacing:1px;font-weight:700">ข้อมูลบัญชีของท่าน</p>
            <p style="margin:0 0 6px;color:#24321F;font-size:15px">👤 ชื่อผู้ใช้: <strong>${username}</strong></p>
            <p style="margin:0;color:#24321F;font-size:15px">📧 อีเมล: <strong>${to}</strong></p>
          </td></tr></table>
          <p style="margin:16px 0;color:#4a4a4a;font-size:15px;line-height:1.7">หากท่านไม่ได้ทำการสมัครสมาชิก กรุณาเพิกเฉยอีเมลฉบับนี้</p>
          <p style="margin:24px 0 0;color:#4a4a4a;font-size:15px">ขอขอบพระคุณที่เข้าร่วมเป็นส่วนหนึ่งของชุมชนเรา</p>
        </td></tr>
        <tr><td style="padding:20px 40px 32px;border-top:1px solid #f0ede6">
          <p style="margin:0;color:#b0a99a;font-size:12px;text-align:center">© ${new Date().getFullYear()} ATC Tea Community — อีเมลนี้ส่งโดยอัตโนมัติ กรุณาอย่าตอบกลับ</p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body></html>`;

  await transporter.sendMail({
    from: `"ATC Tea Community" <${process.env.MAIL_USER}>`,
    to,
    subject: "ยินดีต้อนรับสู่ ATC Tea Community — สมัครสมาชิกสำเร็จ",
    html,
  });
}

module.exports = { sendRegistrationConfirmation, sendWelcomeEmail };
