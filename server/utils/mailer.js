const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.MAIL_USER,
    pass: process.env.MAIL_PASS,
  },
});

/**
 * Send event registration email with payment reminder.
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
        <tr><td style="background:#D4A017;padding:28px 40px;text-align:center">
          <h1 style="margin:0;color:#fff;font-size:24px;font-weight:700">ลงทะเบียนกิจกรรมแล้ว — รอชำระเงิน 📋</h1>
        </td></tr>
        <tr><td style="padding:36px 40px 20px">
          <p style="margin:0 0 20px;color:#24321F;font-size:16px"><strong>เรียน ${username || "ผู้ใช้งาน"}</strong></p>
          <p style="margin:0 0 16px;color:#4a4a4a;font-size:15px;line-height:1.7">คุณได้ลงทะเบียนเข้าร่วมกิจกรรม <strong>&ldquo;${eventTitle}&rdquo;</strong> เรียบร้อยแล้ว แต่ยังไม่ได้ชำระเงิน</p>
          <p style="margin:0 0 16px;color:#c0392b;font-size:15px;line-height:1.7;font-weight:600">⚠️ กรุณาอย่าลืมชำระเงินเพื่อยืนยันการเข้าร่วมกิจกรรมนะครับ</p>
          <table width="100%" style="background:#faf8f2;border-radius:10px;margin:20px 0"><tr><td style="padding:20px 24px">
            <p style="margin:0 0 8px;color:#6f7b70;font-size:12px;text-transform:uppercase;letter-spacing:1px;font-weight:700">รายละเอียดกิจกรรม</p>
            <p style="margin:0 0 6px;color:#24321F;font-size:16px;font-weight:600">🎋 ${eventTitle}</p>
            <p style="margin:0 0 6px;color:#6f7b70;font-size:14px">📅 วันที่: ${formattedDate}</p>
            <p style="margin:0;color:#6f7b70;font-size:14px">💳 สถานะการชำระเงิน: <strong style="color:#D4A017">รอชำระเงิน</strong></p>
          </td></tr></table>
          <p style="margin:16px 0;color:#4a4a4a;font-size:15px;line-height:1.7">ท่านสามารถชำระเงินได้โดยเข้าไปที่หน้ากิจกรรมแล้วกดปุ่ม "Waiting for payment" เพื่อดำเนินการชำระเงินผ่าน PromptPay</p>
          <p style="margin:24px 0 0;color:#4a4a4a;font-size:15px">ขอขอบพระคุณที่สนใจกิจกรรมของเรา</p>
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
    subject: `ลงทะเบียนกิจกรรมแล้ว — อย่าลืมชำระเงิน: ${eventTitle}`,
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

/**
 * Send email after an order is placed (unpaid).
 */
async function sendOrderPlacedEmail({ to, username, orderId, items, totalAmount }) {
  if (!process.env.MAIL_USER || !process.env.MAIL_PASS) {
    console.warn("MAIL_USER / MAIL_PASS not set – skipping order placed email");
    return;
  }

  const itemRows = (items || [])
    .map(
      (item) =>
        `<tr>
          <td style="padding:8px 12px;border-bottom:1px solid #f0ede6;color:#24321F;font-size:14px">${item.tea_name || item.name || 'สินค้า'}</td>
          <td style="padding:8px 12px;border-bottom:1px solid #f0ede6;color:#6f7b70;font-size:14px;text-align:center">${item.quantity}</td>
          <td style="padding:8px 12px;border-bottom:1px solid #f0ede6;color:#6f7b70;font-size:14px;text-align:right">฿${Number(item.unit_price || 0).toLocaleString("th-TH", { minimumFractionDigits: 2 })}</td>
          <td style="padding:8px 12px;border-bottom:1px solid #f0ede6;color:#24321F;font-size:14px;text-align:right;font-weight:600">฿${Number(item.subtotal || 0).toLocaleString("th-TH", { minimumFractionDigits: 2 })}</td>
        </tr>`
    )
    .join("");

  const formattedTotal = `฿${Number(totalAmount || 0).toLocaleString("th-TH", { minimumFractionDigits: 2 })}`;

  const html = `
<!DOCTYPE html>
<html lang="th">
<head><meta charset="UTF-8"></head>
<body style="margin:0;padding:0;background:#f5f3ed;font-family:'Segoe UI',Tahoma,Geneva,Verdana,sans-serif">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f5f3ed;padding:32px 0">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 2px 12px rgba(0,0,0,0.08)">
        <tr><td style="background:#D4A017;padding:28px 40px;text-align:center">
          <h1 style="margin:0;color:#fff;font-size:24px;font-weight:700">อย่าลืมชำระเงินนะครับ 🛒</h1>
        </td></tr>
        <tr><td style="padding:36px 40px 20px">
          <p style="margin:0 0 20px;color:#24321F;font-size:16px"><strong>เรียน ${username || "ผู้ใช้งาน"}</strong></p>
          <p style="margin:0 0 16px;color:#4a4a4a;font-size:15px;line-height:1.7">คำสั่งซื้อ <strong>#ORD-${orderId}</strong> ของท่านถูกสร้างเรียบร้อยแล้ว แต่ยังไม่ได้ชำระเงิน กรุณาดำเนินการชำระเงินเพื่อยืนยันคำสั่งซื้อของท่าน</p>
          <table width="100%" style="background:#faf8f2;border-radius:10px;margin:20px 0;border-collapse:collapse"><tr><td style="padding:20px 24px">
            <p style="margin:0 0 12px;color:#6f7b70;font-size:12px;text-transform:uppercase;letter-spacing:1px;font-weight:700">รายการสินค้า</p>
            <table width="100%" style="border-collapse:collapse">
              <tr style="background:#f0ede6">
                <th style="padding:8px 12px;text-align:left;color:#6f7b70;font-size:12px;font-weight:600">สินค้า</th>
                <th style="padding:8px 12px;text-align:center;color:#6f7b70;font-size:12px;font-weight:600">จำนวน</th>
                <th style="padding:8px 12px;text-align:right;color:#6f7b70;font-size:12px;font-weight:600">ราคา/ชิ้น</th>
                <th style="padding:8px 12px;text-align:right;color:#6f7b70;font-size:12px;font-weight:600">รวม</th>
              </tr>
              ${itemRows}
            </table>
            <div style="margin-top:12px;padding-top:12px;border-top:2px solid #e6e3da;text-align:right">
              <span style="color:#6f7b70;font-size:14px">ยอดรวมทั้งหมด: </span>
              <span style="color:#24321F;font-size:18px;font-weight:700">${formattedTotal}</span>
            </div>
          </td></tr></table>
          <p style="margin:16px 0;color:#4a4a4a;font-size:15px;line-height:1.7">กรุณาชำระเงินภายในระยะเวลาที่กำหนด หากมีข้อสงสัยสามารถติดต่อเราได้ตลอดเวลา</p>
          <p style="margin:24px 0 0;color:#4a4a4a;font-size:15px">ขอขอบพระคุณที่ใช้บริการ ATC Tea Community</p>
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
    subject: `คำสั่งซื้อ #ORD-${orderId} รอการชำระเงิน — ATC Tea Community`,
    html,
  });
}

/**
 * Send email after an order is paid.
 */
async function sendOrderPaidEmail({ to, username, orderId, items, totalAmount }) {
  if (!process.env.MAIL_USER || !process.env.MAIL_PASS) {
    console.warn("MAIL_USER / MAIL_PASS not set – skipping order paid email");
    return;
  }

  const itemRows = (items || [])
    .map(
      (item) =>
        `<tr>
          <td style="padding:8px 12px;border-bottom:1px solid #f0ede6;color:#24321F;font-size:14px">${item.tea_name || item.name || 'สินค้า'}</td>
          <td style="padding:8px 12px;border-bottom:1px solid #f0ede6;color:#6f7b70;font-size:14px;text-align:center">${item.quantity}</td>
          <td style="padding:8px 12px;border-bottom:1px solid #f0ede6;color:#6f7b70;font-size:14px;text-align:right">฿${Number(item.unit_price || 0).toLocaleString("th-TH", { minimumFractionDigits: 2 })}</td>
          <td style="padding:8px 12px;border-bottom:1px solid #f0ede6;color:#24321F;font-size:14px;text-align:right;font-weight:600">฿${Number(item.subtotal || 0).toLocaleString("th-TH", { minimumFractionDigits: 2 })}</td>
        </tr>`
    )
    .join("");

  const formattedTotal = `฿${Number(totalAmount || 0).toLocaleString("th-TH", { minimumFractionDigits: 2 })}`;

  const html = `
<!DOCTYPE html>
<html lang="th">
<head><meta charset="UTF-8"></head>
<body style="margin:0;padding:0;background:#f5f3ed;font-family:'Segoe UI',Tahoma,Geneva,Verdana,sans-serif">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f5f3ed;padding:32px 0">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 2px 12px rgba(0,0,0,0.08)">
        <tr><td style="background:#485B3B;padding:28px 40px;text-align:center">
          <h1 style="margin:0;color:#fff;font-size:24px;font-weight:700">ชำระเงินสำเร็จ ขอบคุณครับ 🎉</h1>
        </td></tr>
        <tr><td style="padding:36px 40px 20px">
          <p style="margin:0 0 20px;color:#24321F;font-size:16px"><strong>เรียน ${username || "ผู้ใช้งาน"}</strong></p>
          <p style="margin:0 0 16px;color:#4a4a4a;font-size:15px;line-height:1.7">คำสั่งซื้อ <strong>#ORD-${orderId}</strong> ได้รับการชำระเงินเรียบร้อยแล้ว ขอขอบคุณที่ใช้บริการของเรา!</p>
          <table width="100%" style="background:#faf8f2;border-radius:10px;margin:20px 0;border-collapse:collapse"><tr><td style="padding:20px 24px">
            <p style="margin:0 0 12px;color:#6f7b70;font-size:12px;text-transform:uppercase;letter-spacing:1px;font-weight:700">รายการสินค้าที่สั่งซื้อ</p>
            <table width="100%" style="border-collapse:collapse">
              <tr style="background:#f0ede6">
                <th style="padding:8px 12px;text-align:left;color:#6f7b70;font-size:12px;font-weight:600">สินค้า</th>
                <th style="padding:8px 12px;text-align:center;color:#6f7b70;font-size:12px;font-weight:600">จำนวน</th>
                <th style="padding:8px 12px;text-align:right;color:#6f7b70;font-size:12px;font-weight:600">ราคา/ชิ้น</th>
                <th style="padding:8px 12px;text-align:right;color:#6f7b70;font-size:12px;font-weight:600">รวม</th>
              </tr>
              ${itemRows}
            </table>
            <div style="margin-top:12px;padding-top:12px;border-top:2px solid #e6e3da;text-align:right">
              <span style="color:#6f7b70;font-size:14px">ยอดรวมทั้งหมด: </span>
              <span style="color:#24321F;font-size:18px;font-weight:700">${formattedTotal}</span>
            </div>
          </td></tr></table>
          <p style="margin:16px 0;color:#4a4a4a;font-size:15px;line-height:1.7">การชำระเงินของท่านได้รับการยืนยันเรียบร้อยแล้ว ท่านสามารถตรวจสอบสถานะคำสั่งซื้อได้ที่หน้าโปรไฟล์ของท่าน</p>
          <p style="margin:24px 0 0;color:#4a4a4a;font-size:15px">ขอขอบพระคุณที่ใช้บริการ ATC Tea Community</p>
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
    subject: `ชำระเงินสำเร็จ #ORD-${orderId} — ATC Tea Community`,
    html,
  });
}

/**
 * Send COD reminder email after placing a cash-on-delivery order.
 */
async function sendCodReminderEmail({ to, username, orderId, items, totalAmount }) {
  if (!process.env.MAIL_USER || !process.env.MAIL_PASS) {
    console.warn("MAIL_USER / MAIL_PASS not set – skipping COD reminder email");
    return;
  }

  const itemRows = (items || [])
    .map(
      (item) =>
        `<tr>
          <td style="padding:8px 12px;border-bottom:1px solid #f0ede6;color:#24321F;font-size:14px">${item.tea_name || item.name || '\u0e2a\u0e34\u0e19\u0e04\u0e49\u0e32'}</td>
          <td style="padding:8px 12px;border-bottom:1px solid #f0ede6;color:#6f7b70;font-size:14px;text-align:center">${item.quantity}</td>
          <td style="padding:8px 12px;border-bottom:1px solid #f0ede6;color:#6f7b70;font-size:14px;text-align:right">\u0e3f${Number(item.unit_price || 0).toLocaleString("th-TH", { minimumFractionDigits: 2 })}</td>
          <td style="padding:8px 12px;border-bottom:1px solid #f0ede6;color:#24321F;font-size:14px;text-align:right;font-weight:600">\u0e3f${Number(item.subtotal || 0).toLocaleString("th-TH", { minimumFractionDigits: 2 })}</td>
        </tr>`
    )
    .join("");

  const formattedTotal = `\u0e3f${Number(totalAmount || 0).toLocaleString("th-TH", { minimumFractionDigits: 2 })}`;

  const html = `
<!DOCTYPE html>
<html lang="th">
<head><meta charset="UTF-8"></head>
<body style="margin:0;padding:0;background:#f5f3ed;font-family:'Segoe UI',Tahoma,Geneva,Verdana,sans-serif">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f5f3ed;padding:32px 0">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 2px 12px rgba(0,0,0,0.08)">
        <tr><td style="background:#D4A017;padding:28px 40px;text-align:center">
          <h1 style="margin:0;color:#fff;font-size:24px;font-weight:700">\u0e2a\u0e31\u0e48\u0e07\u0e0b\u0e37\u0e49\u0e2d\u0e2a\u0e33\u0e40\u0e23\u0e47\u0e08 — \u0e0a\u0e33\u0e23\u0e30\u0e40\u0e07\u0e34\u0e19\u0e1b\u0e25\u0e32\u0e22\u0e17\u0e32\u0e07 \ud83d\udce6</h1>
        </td></tr>
        <tr><td style="padding:36px 40px 20px">
          <p style="margin:0 0 20px;color:#24321F;font-size:16px"><strong>\u0e40\u0e23\u0e35\u0e22\u0e19 ${username || "\u0e1c\u0e39\u0e49\u0e43\u0e0a\u0e49\u0e07\u0e32\u0e19"}</strong></p>
          <p style="margin:0 0 16px;color:#4a4a4a;font-size:15px;line-height:1.7">\u0e04\u0e33\u0e2a\u0e31\u0e48\u0e07\u0e0b\u0e37\u0e49\u0e2d <strong>#ORD-${orderId}</strong> \u0e02\u0e2d\u0e07\u0e17\u0e48\u0e32\u0e19\u0e16\u0e39\u0e01\u0e2a\u0e23\u0e49\u0e32\u0e07\u0e40\u0e23\u0e35\u0e22\u0e1a\u0e23\u0e49\u0e2d\u0e22\u0e41\u0e25\u0e49\u0e27 \u0e42\u0e14\u0e22\u0e40\u0e25\u0e37\u0e2d\u0e01\u0e0a\u0e33\u0e23\u0e30\u0e40\u0e07\u0e34\u0e19\u0e1b\u0e25\u0e32\u0e22\u0e17\u0e32\u0e07 (Cash on Delivery)</p>
          <p style="margin:0 0 16px;color:#c0392b;font-size:15px;line-height:1.7;font-weight:600">\u26a0\ufe0f \u0e01\u0e23\u0e38\u0e13\u0e32\u0e2d\u0e22\u0e48\u0e32\u0e25\u0e37\u0e21\u0e0a\u0e33\u0e23\u0e30\u0e40\u0e07\u0e34\u0e19\u0e1b\u0e25\u0e32\u0e22\u0e17\u0e32\u0e07\u0e40\u0e21\u0e37\u0e48\u0e2d\u0e44\u0e14\u0e49\u0e23\u0e31\u0e1a\u0e2a\u0e34\u0e19\u0e04\u0e49\u0e32\u0e19\u0e30\u0e04\u0e23\u0e31\u0e1a</p>
          <table width="100%" style="background:#faf8f2;border-radius:10px;margin:20px 0;border-collapse:collapse"><tr><td style="padding:20px 24px">
            <p style="margin:0 0 12px;color:#6f7b70;font-size:12px;text-transform:uppercase;letter-spacing:1px;font-weight:700">\u0e23\u0e32\u0e22\u0e01\u0e32\u0e23\u0e2a\u0e34\u0e19\u0e04\u0e49\u0e32</p>
            <table width="100%" style="border-collapse:collapse">
              <tr style="background:#f0ede6">
                <th style="padding:8px 12px;text-align:left;color:#6f7b70;font-size:12px;font-weight:600">\u0e2a\u0e34\u0e19\u0e04\u0e49\u0e32</th>
                <th style="padding:8px 12px;text-align:center;color:#6f7b70;font-size:12px;font-weight:600">\u0e08\u0e33\u0e19\u0e27\u0e19</th>
                <th style="padding:8px 12px;text-align:right;color:#6f7b70;font-size:12px;font-weight:600">\u0e23\u0e32\u0e04\u0e32/\u0e0a\u0e34\u0e49\u0e19</th>
                <th style="padding:8px 12px;text-align:right;color:#6f7b70;font-size:12px;font-weight:600">\u0e23\u0e27\u0e21</th>
              </tr>
              ${itemRows}
            </table>
            <div style="margin-top:12px;padding-top:12px;border-top:2px solid #e6e3da;text-align:right">
              <span style="color:#6f7b70;font-size:14px">\u0e22\u0e2d\u0e14\u0e0a\u0e33\u0e23\u0e30\u0e1b\u0e25\u0e32\u0e22\u0e17\u0e32\u0e07: </span>
              <span style="color:#24321F;font-size:18px;font-weight:700">${formattedTotal}</span>
            </div>
          </td></tr></table>
          <p style="margin:16px 0;color:#4a4a4a;font-size:15px;line-height:1.7">\u0e01\u0e23\u0e38\u0e13\u0e32\u0e40\u0e15\u0e23\u0e35\u0e22\u0e21\u0e40\u0e07\u0e34\u0e19\u0e2a\u0e14\u0e43\u0e2b\u0e49\u0e1e\u0e23\u0e49\u0e2d\u0e21\u0e40\u0e21\u0e37\u0e48\u0e2d\u0e1e\u0e19\u0e31\u0e01\u0e07\u0e32\u0e19\u0e08\u0e31\u0e14\u0e2a\u0e48\u0e07\u0e21\u0e32\u0e16\u0e36\u0e07 \u0e2b\u0e32\u0e01\u0e21\u0e35\u0e02\u0e49\u0e2d\u0e2a\u0e07\u0e2a\u0e31\u0e22\u0e2a\u0e32\u0e21\u0e32\u0e23\u0e16\u0e15\u0e34\u0e14\u0e15\u0e48\u0e2d\u0e40\u0e23\u0e32\u0e44\u0e14\u0e49\u0e15\u0e25\u0e2d\u0e14\u0e40\u0e27\u0e25\u0e32</p>
          <p style="margin:24px 0 0;color:#4a4a4a;font-size:15px">\u0e02\u0e2d\u0e02\u0e2d\u0e1a\u0e1e\u0e23\u0e30\u0e04\u0e38\u0e13\u0e17\u0e35\u0e48\u0e43\u0e0a\u0e49\u0e1a\u0e23\u0e34\u0e01\u0e32\u0e23 ATC Tea Community</p>
        </td></tr>
        <tr><td style="padding:20px 40px 32px;border-top:1px solid #f0ede6">
          <p style="margin:0;color:#b0a99a;font-size:12px;text-align:center">\u00a9 ${new Date().getFullYear()} ATC Tea Community \u2014 \u0e2d\u0e35\u0e40\u0e21\u0e25\u0e19\u0e35\u0e49\u0e2a\u0e48\u0e07\u0e42\u0e14\u0e22\u0e2d\u0e31\u0e15\u0e42\u0e19\u0e21\u0e31\u0e15\u0e34 \u0e01\u0e23\u0e38\u0e13\u0e32\u0e2d\u0e22\u0e48\u0e32\u0e15\u0e2d\u0e1a\u0e01\u0e25\u0e31\u0e1a</p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body></html>`;

  await transporter.sendMail({
    from: `"ATC Tea Community" <${process.env.MAIL_USER}>`,
    to,
    subject: `\u0e2a\u0e31\u0e48\u0e07\u0e0b\u0e37\u0e49\u0e2d\u0e2a\u0e33\u0e40\u0e23\u0e47\u0e08 #ORD-${orderId} — \u0e0a\u0e33\u0e23\u0e30\u0e40\u0e07\u0e34\u0e19\u0e1b\u0e25\u0e32\u0e22\u0e17\u0e32\u0e07`,
    html,
  });
}

/**
 * Send email after shop confirms COD payment received.
 */
async function sendCodPaidEmail({ to, username, orderId, items, totalAmount }) {
  if (!process.env.MAIL_USER || !process.env.MAIL_PASS) {
    console.warn("MAIL_USER / MAIL_PASS not set – skipping COD paid email");
    return;
  }

  const itemRows = (items || [])
    .map(
      (item) =>
        `<tr>
          <td style="padding:8px 12px;border-bottom:1px solid #f0ede6;color:#24321F;font-size:14px">${item.tea_name || item.name || 'สินค้า'}</td>
          <td style="padding:8px 12px;border-bottom:1px solid #f0ede6;color:#6f7b70;font-size:14px;text-align:center">${item.quantity}</td>
          <td style="padding:8px 12px;border-bottom:1px solid #f0ede6;color:#6f7b70;font-size:14px;text-align:right">฿${Number(item.unit_price || 0).toLocaleString("th-TH", { minimumFractionDigits: 2 })}</td>
          <td style="padding:8px 12px;border-bottom:1px solid #f0ede6;color:#24321F;font-size:14px;text-align:right;font-weight:600">฿${Number(item.subtotal || 0).toLocaleString("th-TH", { minimumFractionDigits: 2 })}</td>
        </tr>`
    )
    .join("");

  const formattedTotal = `฿${Number(totalAmount || 0).toLocaleString("th-TH", { minimumFractionDigits: 2 })}`;

  const html = `
<!DOCTYPE html>
<html lang="th">
<head><meta charset="UTF-8"></head>
<body style="margin:0;padding:0;background:#f5f3ed;font-family:'Segoe UI',Tahoma,Geneva,Verdana,sans-serif">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f5f3ed;padding:32px 0">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 2px 12px rgba(0,0,0,0.08)">
        <tr><td style="background:#485B3B;padding:28px 40px;text-align:center">
          <h1 style="margin:0;color:#fff;font-size:24px;font-weight:700">ชำระเงินปลายทางสำเร็จ ขอบคุณครับ 🎉</h1>
        </td></tr>
        <tr><td style="padding:36px 40px 20px">
          <p style="margin:0 0 20px;color:#24321F;font-size:16px"><strong>เรียน ${username || "ผู้ใช้งาน"}</strong></p>
          <p style="margin:0 0 16px;color:#4a4a4a;font-size:15px;line-height:1.7">คำสั่งซื้อ <strong>#ORD-${orderId}</strong> ได้รับการยืนยันการชำระเงินปลายทาง (Cash on Delivery) เรียบร้อยแล้ว ขอขอบคุณที่ใช้บริการของเรา!</p>
          <table width="100%" style="background:#faf8f2;border-radius:10px;margin:20px 0;border-collapse:collapse"><tr><td style="padding:20px 24px">
            <p style="margin:0 0 12px;color:#6f7b70;font-size:12px;text-transform:uppercase;letter-spacing:1px;font-weight:700">รายการสินค้าที่สั่งซื้อ</p>
            <table width="100%" style="border-collapse:collapse">
              <tr style="background:#f0ede6">
                <th style="padding:8px 12px;text-align:left;color:#6f7b70;font-size:12px;font-weight:600">สินค้า</th>
                <th style="padding:8px 12px;text-align:center;color:#6f7b70;font-size:12px;font-weight:600">จำนวน</th>
                <th style="padding:8px 12px;text-align:right;color:#6f7b70;font-size:12px;font-weight:600">ราคา/ชิ้น</th>
                <th style="padding:8px 12px;text-align:right;color:#6f7b70;font-size:12px;font-weight:600">รวม</th>
              </tr>
              ${itemRows}
            </table>
            <div style="margin-top:12px;padding-top:12px;border-top:2px solid #e6e3da;text-align:right">
              <span style="color:#6f7b70;font-size:14px">ยอดรวมทั้งหมด: </span>
              <span style="color:#24321F;font-size:18px;font-weight:700">${formattedTotal}</span>
            </div>
          </td></tr></table>
          <p style="margin:16px 0;color:#4a4a4a;font-size:15px;line-height:1.7">สินค้าได้ถูกส่งมอบถึงท่านเรียบร้อยแล้ว หากพบปัญหาเกี่ยวกับสินค้า สามารถติดต่อร้านค้าได้ตลอดเวลา</p>
          <p style="margin:24px 0 0;color:#4a4a4a;font-size:15px">ขอขอบพระคุณที่ใช้บริการ ATC Tea Community</p>
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
    subject: `ชำระเงินปลายทางสำเร็จ #ORD-${orderId} — ATC Tea Community`,
    html,
  });
}

/**
 * Send email after user pays for event registration.
 */
async function sendEventPaymentConfirmation({ to, username, eventTitle, eventDate }) {
  if (!process.env.MAIL_USER || !process.env.MAIL_PASS) {
    console.warn("MAIL_USER / MAIL_PASS not set \u2013 skipping event payment email");
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
        <tr><td style="background:#485B3B;padding:28px 40px;text-align:center">
          <h1 style="margin:0;color:#fff;font-size:24px;font-weight:700">\u0e0a\u0e33\u0e23\u0e30\u0e40\u0e07\u0e34\u0e19\u0e2a\u0e21\u0e31\u0e04\u0e23\u0e01\u0e34\u0e08\u0e01\u0e23\u0e23\u0e21\u0e2a\u0e33\u0e40\u0e23\u0e47\u0e08 \ud83c\udf89</h1>
        </td></tr>
        <tr><td style="padding:36px 40px 20px">
          <p style="margin:0 0 20px;color:#24321F;font-size:16px"><strong>\u0e40\u0e23\u0e35\u0e22\u0e19 ${username || "\u0e1c\u0e39\u0e49\u0e43\u0e0a\u0e49\u0e07\u0e32\u0e19"}</strong></p>
          <p style="margin:0 0 16px;color:#4a4a4a;font-size:15px;line-height:1.7">\u0e01\u0e32\u0e23\u0e0a\u0e33\u0e23\u0e30\u0e40\u0e07\u0e34\u0e19\u0e2a\u0e33\u0e2b\u0e23\u0e31\u0e1a\u0e01\u0e34\u0e08\u0e01\u0e23\u0e23\u0e21 <strong>&ldquo;${eventTitle}&rdquo;</strong> \u0e44\u0e14\u0e49\u0e23\u0e31\u0e1a\u0e01\u0e32\u0e23\u0e22\u0e37\u0e19\u0e22\u0e31\u0e19\u0e40\u0e23\u0e35\u0e22\u0e1a\u0e23\u0e49\u0e2d\u0e22\u0e41\u0e25\u0e49\u0e27 \u0e02\u0e2d\u0e02\u0e2d\u0e1a\u0e04\u0e38\u0e13\u0e17\u0e35\u0e48\u0e2a\u0e19\u0e31\u0e1a\u0e2a\u0e19\u0e38\u0e19\u0e01\u0e34\u0e08\u0e01\u0e23\u0e23\u0e21\u0e02\u0e2d\u0e07\u0e40\u0e23\u0e32!</p>
          <table width="100%" style="background:#faf8f2;border-radius:10px;margin:20px 0"><tr><td style="padding:20px 24px">
            <p style="margin:0 0 8px;color:#6f7b70;font-size:12px;text-transform:uppercase;letter-spacing:1px;font-weight:700">\u0e23\u0e32\u0e22\u0e25\u0e30\u0e40\u0e2d\u0e35\u0e22\u0e14\u0e01\u0e34\u0e08\u0e01\u0e23\u0e23\u0e21</p>
            <p style="margin:0 0 6px;color:#24321F;font-size:16px;font-weight:600">\ud83c\udf8b ${eventTitle}</p>
            <p style="margin:0 0 6px;color:#6f7b70;font-size:14px">\ud83d\udcc5 \u0e27\u0e31\u0e19\u0e17\u0e35\u0e48: ${formattedDate}</p>
            <p style="margin:0;color:#6f7b70;font-size:14px">\ud83d\udcb3 \u0e2a\u0e16\u0e32\u0e19\u0e30\u0e01\u0e32\u0e23\u0e0a\u0e33\u0e23\u0e30\u0e40\u0e07\u0e34\u0e19: <strong style="color:#485B3B">\u0e0a\u0e33\u0e23\u0e30\u0e41\u0e25\u0e49\u0e27</strong></p>
          </td></tr></table>
          <p style="margin:16px 0;color:#4a4a4a;font-size:15px;line-height:1.7">\u0e17\u0e48\u0e32\u0e19\u0e2a\u0e32\u0e21\u0e32\u0e23\u0e16\u0e15\u0e23\u0e27\u0e08\u0e2a\u0e2d\u0e1a\u0e23\u0e32\u0e22\u0e25\u0e30\u0e40\u0e2d\u0e35\u0e22\u0e14\u0e01\u0e34\u0e08\u0e01\u0e23\u0e23\u0e21\u0e41\u0e25\u0e30\u0e2a\u0e16\u0e32\u0e19\u0e30\u0e01\u0e32\u0e23\u0e25\u0e07\u0e17\u0e30\u0e40\u0e1a\u0e35\u0e22\u0e19\u0e44\u0e14\u0e49\u0e17\u0e35\u0e48\u0e2b\u0e19\u0e49\u0e32\u0e42\u0e1b\u0e23\u0e44\u0e1f\u0e25\u0e4c\u0e02\u0e2d\u0e07\u0e17\u0e48\u0e32\u0e19</p>
          <p style="margin:24px 0 0;color:#4a4a4a;font-size:15px">\u0e02\u0e2d\u0e02\u0e2d\u0e1a\u0e1e\u0e23\u0e30\u0e04\u0e38\u0e13\u0e17\u0e35\u0e48\u0e40\u0e1b\u0e47\u0e19\u0e2a\u0e48\u0e27\u0e19\u0e2b\u0e19\u0e36\u0e48\u0e07\u0e02\u0e2d\u0e07\u0e0a\u0e38\u0e21\u0e0a\u0e19\u0e40\u0e23\u0e32</p>
        </td></tr>
        <tr><td style="padding:20px 40px 32px;border-top:1px solid #f0ede6">
          <p style="margin:0;color:#b0a99a;font-size:12px;text-align:center">\u00a9 ${new Date().getFullYear()} ATC Tea Community \u2014 \u0e2d\u0e35\u0e40\u0e21\u0e25\u0e19\u0e35\u0e49\u0e2a\u0e48\u0e07\u0e42\u0e14\u0e22\u0e2d\u0e31\u0e15\u0e42\u0e19\u0e21\u0e31\u0e15\u0e34 \u0e01\u0e23\u0e38\u0e13\u0e32\u0e2d\u0e22\u0e48\u0e32\u0e15\u0e2d\u0e1a\u0e01\u0e25\u0e31\u0e1a</p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body></html>`;

  await transporter.sendMail({
    from: `"ATC Tea Community" <${process.env.MAIL_USER}>`,
    to,
    subject: `\u0e0a\u0e33\u0e23\u0e30\u0e40\u0e07\u0e34\u0e19\u0e2a\u0e21\u0e31\u0e04\u0e23\u0e01\u0e34\u0e08\u0e01\u0e23\u0e23\u0e21\u0e2a\u0e33\u0e40\u0e23\u0e47\u0e08 \u2014 ${eventTitle}`,
    html,
  });
}

module.exports = { sendRegistrationConfirmation, sendWelcomeEmail, sendOrderPlacedEmail, sendOrderPaidEmail, sendCodPaidEmail, sendCodReminderEmail, sendEventPaymentConfirmation };
