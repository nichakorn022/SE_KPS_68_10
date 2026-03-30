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
    ? new Date(eventDate).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })
    : "TBA";

  const html = `
<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"></head>
<body style="margin:0;padding:0;background:#f5f3ed;font-family:'Segoe UI',Tahoma,Geneva,Verdana,sans-serif">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f5f3ed;padding:32px 0">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 2px 12px rgba(0,0,0,0.08)">
        <tr><td style="background:#D4A017;padding:28px 40px;text-align:center">
          <h1 style="margin:0;color:#fff;font-size:24px;font-weight:700">Event Registered — Payment Pending 📋</h1>
        </td></tr>
        <tr><td style="padding:36px 40px 20px">
          <p style="margin:0 0 20px;color:#24321F;font-size:16px"><strong>Dear ${username || "User"}</strong></p>
          <p style="margin:0 0 16px;color:#4a4a4a;font-size:15px;line-height:1.7">You have registered for the event <strong>&ldquo;${eventTitle}&rdquo;</strong> successfully, but payment has not been made yet.</p>
          <p style="margin:0 0 16px;color:#c0392b;font-size:15px;line-height:1.7;font-weight:600">⚠️ Please don't forget to make the payment to confirm your participation.</p>
          <table width="100%" style="background:#faf8f2;border-radius:10px;margin:20px 0"><tr><td style="padding:20px 24px">
            <p style="margin:0 0 8px;color:#6f7b70;font-size:12px;text-transform:uppercase;letter-spacing:1px;font-weight:700">Event Details</p>
            <p style="margin:0 0 6px;color:#24321F;font-size:16px;font-weight:600">🎋 ${eventTitle}</p>
            <p style="margin:0 0 6px;color:#6f7b70;font-size:14px">📅 Date: ${formattedDate}</p>
            <p style="margin:0;color:#6f7b70;font-size:14px">💳 Payment Status: <strong style="color:#D4A017">Pending</strong></p>
          </td></tr></table>
          <p style="margin:16px 0;color:#4a4a4a;font-size:15px;line-height:1.7">You can make the payment by visiting the event page and clicking the "Waiting for payment" button to proceed via PromptPay.</p>
          <p style="margin:24px 0 0;color:#4a4a4a;font-size:15px">Thank you for your interest in our events.</p>
        </td></tr>
        <tr><td style="padding:20px 40px 32px;border-top:1px solid #f0ede6">
          <p style="margin:0;color:#b0a99a;font-size:12px;text-align:center">© ${new Date().getFullYear()} ATC Tea Community — This is an automated email, please do not reply.</p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body></html>`;

  await transporter.sendMail({
    from: `"ATC Tea Community" <${process.env.MAIL_USER}>`,
    to,
    subject: `Event Registered — Don't Forget to Pay: ${eventTitle}`,
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
<html lang="en">
<head><meta charset="UTF-8"></head>
<body style="margin:0;padding:0;background:#f5f3ed;font-family:'Segoe UI',Tahoma,Geneva,Verdana,sans-serif">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f5f3ed;padding:32px 0">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 2px 12px rgba(0,0,0,0.08)">
        <tr><td style="background:#485B3B;padding:28px 40px;text-align:center">
          <h1 style="margin:0;color:#fff;font-size:24px;font-weight:700">Welcome to ATC Tea Community</h1>
        </td></tr>
        <tr><td style="padding:36px 40px 20px">
          <p style="margin:0 0 20px;color:#24321F;font-size:16px"><strong>Dear ${username || "User"}</strong></p>
          <p style="margin:0 0 16px;color:#4a4a4a;font-size:15px;line-height:1.7">Your account has been created successfully! 🎉</p>
          <p style="margin:0 0 16px;color:#4a4a4a;font-size:15px;line-height:1.7">You can now log in and start using our website — browse and purchase tea products, register for events, or connect with the tea-loving community.</p>
          <table width="100%" style="background:#faf8f2;border-radius:10px;margin:20px 0"><tr><td style="padding:20px 24px">
            <p style="margin:0 0 8px;color:#6f7b70;font-size:12px;text-transform:uppercase;letter-spacing:1px;font-weight:700">Your Account Information</p>
            <p style="margin:0 0 6px;color:#24321F;font-size:15px">👤 Username: <strong>${username}</strong></p>
            <p style="margin:0;color:#24321F;font-size:15px">📧 Email: <strong>${to}</strong></p>
          </td></tr></table>
          <p style="margin:16px 0;color:#4a4a4a;font-size:15px;line-height:1.7">If you did not create this account, please ignore this email.</p>
          <p style="margin:24px 0 0;color:#4a4a4a;font-size:15px">Thank you for joining our community.</p>
        </td></tr>
        <tr><td style="padding:20px 40px 32px;border-top:1px solid #f0ede6">
          <p style="margin:0;color:#b0a99a;font-size:12px;text-align:center">© ${new Date().getFullYear()} ATC Tea Community — This is an automated email, please do not reply.</p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body></html>`;

  await transporter.sendMail({
    from: `"ATC Tea Community" <${process.env.MAIL_USER}>`,
    to,
    subject: "Welcome to ATC Tea Community — Registration Successful",
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
          <td style="padding:8px 12px;border-bottom:1px solid #f0ede6;color:#24321F;font-size:14px">${item.tea_name || item.name || 'Product'}</td>
          <td style="padding:8px 12px;border-bottom:1px solid #f0ede6;color:#6f7b70;font-size:14px;text-align:center">${item.quantity}</td>
          <td style="padding:8px 12px;border-bottom:1px solid #f0ede6;color:#6f7b70;font-size:14px;text-align:right">฿${Number(item.unit_price || 0).toLocaleString("en-US", { minimumFractionDigits: 2 })}</td>
          <td style="padding:8px 12px;border-bottom:1px solid #f0ede6;color:#24321F;font-size:14px;text-align:right;font-weight:600">฿${Number(item.subtotal || 0).toLocaleString("en-US", { minimumFractionDigits: 2 })}</td>
        </tr>`
    )
    .join("");

  const formattedTotal = `฿${Number(totalAmount || 0).toLocaleString("en-US", { minimumFractionDigits: 2 })}`;

  const html = `
<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"></head>
<body style="margin:0;padding:0;background:#f5f3ed;font-family:'Segoe UI',Tahoma,Geneva,Verdana,sans-serif">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f5f3ed;padding:32px 0">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 2px 12px rgba(0,0,0,0.08)">
        <tr><td style="background:#D4A017;padding:28px 40px;text-align:center">
          <h1 style="margin:0;color:#fff;font-size:24px;font-weight:700">Don't Forget to Pay 🛒</h1>
        </td></tr>
        <tr><td style="padding:36px 40px 20px">
          <p style="margin:0 0 20px;color:#24321F;font-size:16px"><strong>Dear ${username || "User"}</strong></p>
          <p style="margin:0 0 16px;color:#4a4a4a;font-size:15px;line-height:1.7">Your order <strong>#ORD-${orderId}</strong> has been created successfully, but payment has not been made yet. Please proceed with the payment to confirm your order.</p>
          <table width="100%" style="background:#faf8f2;border-radius:10px;margin:20px 0;border-collapse:collapse"><tr><td style="padding:20px 24px">
            <p style="margin:0 0 12px;color:#6f7b70;font-size:12px;text-transform:uppercase;letter-spacing:1px;font-weight:700">Order Items</p>
            <table width="100%" style="border-collapse:collapse">
              <tr style="background:#f0ede6">
                <th style="padding:8px 12px;text-align:left;color:#6f7b70;font-size:12px;font-weight:600">Product</th>
                <th style="padding:8px 12px;text-align:center;color:#6f7b70;font-size:12px;font-weight:600">Qty</th>
                <th style="padding:8px 12px;text-align:right;color:#6f7b70;font-size:12px;font-weight:600">Unit Price</th>
                <th style="padding:8px 12px;text-align:right;color:#6f7b70;font-size:12px;font-weight:600">Subtotal</th>
              </tr>
              ${itemRows}
            </table>
            <div style="margin-top:12px;padding-top:12px;border-top:2px solid #e6e3da;text-align:right">
              <span style="color:#6f7b70;font-size:14px">Total: </span>
              <span style="color:#24321F;font-size:18px;font-weight:700">${formattedTotal}</span>
            </div>
          </td></tr></table>
          <p style="margin:16px 0;color:#4a4a4a;font-size:15px;line-height:1.7">Please complete the payment within the specified time. If you have any questions, feel free to contact us anytime.</p>
          <p style="margin:24px 0 0;color:#4a4a4a;font-size:15px">Thank you for shopping with ATC Tea Community.</p>
        </td></tr>
        <tr><td style="padding:20px 40px 32px;border-top:1px solid #f0ede6">
          <p style="margin:0;color:#b0a99a;font-size:12px;text-align:center">© ${new Date().getFullYear()} ATC Tea Community — This is an automated email, please do not reply.</p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body></html>`;

  await transporter.sendMail({
    from: `"ATC Tea Community" <${process.env.MAIL_USER}>`,
    to,
    subject: `Order #ORD-${orderId} — Payment Pending — ATC Tea Community`,
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
          <td style="padding:8px 12px;border-bottom:1px solid #f0ede6;color:#24321F;font-size:14px">${item.tea_name || item.name || 'Product'}</td>
          <td style="padding:8px 12px;border-bottom:1px solid #f0ede6;color:#6f7b70;font-size:14px;text-align:center">${item.quantity}</td>
          <td style="padding:8px 12px;border-bottom:1px solid #f0ede6;color:#6f7b70;font-size:14px;text-align:right">฿${Number(item.unit_price || 0).toLocaleString("en-US", { minimumFractionDigits: 2 })}</td>
          <td style="padding:8px 12px;border-bottom:1px solid #f0ede6;color:#24321F;font-size:14px;text-align:right;font-weight:600">฿${Number(item.subtotal || 0).toLocaleString("en-US", { minimumFractionDigits: 2 })}</td>
        </tr>`
    )
    .join("");

  const formattedTotal = `฿${Number(totalAmount || 0).toLocaleString("en-US", { minimumFractionDigits: 2 })}`;

  const html = `
<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"></head>
<body style="margin:0;padding:0;background:#f5f3ed;font-family:'Segoe UI',Tahoma,Geneva,Verdana,sans-serif">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f5f3ed;padding:32px 0">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 2px 12px rgba(0,0,0,0.08)">
        <tr><td style="background:#485B3B;padding:28px 40px;text-align:center">
          <h1 style="margin:0;color:#fff;font-size:24px;font-weight:700">Payment Successful — Thank You! 🎉</h1>
        </td></tr>
        <tr><td style="padding:36px 40px 20px">
          <p style="margin:0 0 20px;color:#24321F;font-size:16px"><strong>Dear ${username || "User"}</strong></p>
          <p style="margin:0 0 16px;color:#4a4a4a;font-size:15px;line-height:1.7">Your order <strong>#ORD-${orderId}</strong> has been paid successfully. Thank you for your purchase!</p>
          <table width="100%" style="background:#faf8f2;border-radius:10px;margin:20px 0;border-collapse:collapse"><tr><td style="padding:20px 24px">
            <p style="margin:0 0 12px;color:#6f7b70;font-size:12px;text-transform:uppercase;letter-spacing:1px;font-weight:700">Ordered Items</p>
            <table width="100%" style="border-collapse:collapse">
              <tr style="background:#f0ede6">
                <th style="padding:8px 12px;text-align:left;color:#6f7b70;font-size:12px;font-weight:600">Product</th>
                <th style="padding:8px 12px;text-align:center;color:#6f7b70;font-size:12px;font-weight:600">Qty</th>
                <th style="padding:8px 12px;text-align:right;color:#6f7b70;font-size:12px;font-weight:600">Unit Price</th>
                <th style="padding:8px 12px;text-align:right;color:#6f7b70;font-size:12px;font-weight:600">Subtotal</th>
              </tr>
              ${itemRows}
            </table>
            <div style="margin-top:12px;padding-top:12px;border-top:2px solid #e6e3da;text-align:right">
              <span style="color:#6f7b70;font-size:14px">Total: </span>
              <span style="color:#24321F;font-size:18px;font-weight:700">${formattedTotal}</span>
            </div>
          </td></tr></table>
          <p style="margin:16px 0;color:#4a4a4a;font-size:15px;line-height:1.7">Your payment has been confirmed. You can check your order status on your profile page.</p>
          <p style="margin:24px 0 0;color:#4a4a4a;font-size:15px">Thank you for shopping with ATC Tea Community.</p>
        </td></tr>
        <tr><td style="padding:20px 40px 32px;border-top:1px solid #f0ede6">
          <p style="margin:0;color:#b0a99a;font-size:12px;text-align:center">© ${new Date().getFullYear()} ATC Tea Community — This is an automated email, please do not reply.</p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body></html>`;

  await transporter.sendMail({
    from: `"ATC Tea Community" <${process.env.MAIL_USER}>`,
    to,
    subject: `Payment Successful #ORD-${orderId} — ATC Tea Community`,
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
          <td style="padding:8px 12px;border-bottom:1px solid #f0ede6;color:#24321F;font-size:14px">${item.tea_name || item.name || 'Product'}</td>
          <td style="padding:8px 12px;border-bottom:1px solid #f0ede6;color:#6f7b70;font-size:14px;text-align:center">${item.quantity}</td>
          <td style="padding:8px 12px;border-bottom:1px solid #f0ede6;color:#6f7b70;font-size:14px;text-align:right">฿${Number(item.unit_price || 0).toLocaleString("en-US", { minimumFractionDigits: 2 })}</td>
          <td style="padding:8px 12px;border-bottom:1px solid #f0ede6;color:#24321F;font-size:14px;text-align:right;font-weight:600">฿${Number(item.subtotal || 0).toLocaleString("en-US", { minimumFractionDigits: 2 })}</td>
        </tr>`
    )
    .join("");

  const formattedTotal = `฿${Number(totalAmount || 0).toLocaleString("en-US", { minimumFractionDigits: 2 })}`;

  const html = `
<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"></head>
<body style="margin:0;padding:0;background:#f5f3ed;font-family:'Segoe UI',Tahoma,Geneva,Verdana,sans-serif">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f5f3ed;padding:32px 0">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 2px 12px rgba(0,0,0,0.08)">
        <tr><td style="background:#D4A017;padding:28px 40px;text-align:center">
          <h1 style="margin:0;color:#fff;font-size:24px;font-weight:700">Order Placed — Cash on Delivery 📦</h1>
        </td></tr>
        <tr><td style="padding:36px 40px 20px">
          <p style="margin:0 0 20px;color:#24321F;font-size:16px"><strong>Dear ${username || "User"}</strong></p>
          <p style="margin:0 0 16px;color:#4a4a4a;font-size:15px;line-height:1.7">Your order <strong>#ORD-${orderId}</strong> has been placed successfully with Cash on Delivery payment.</p>
          <p style="margin:0 0 16px;color:#c0392b;font-size:15px;line-height:1.7;font-weight:600">⚠️ Please don't forget to pay upon delivery when you receive your items.</p>
          <table width="100%" style="background:#faf8f2;border-radius:10px;margin:20px 0;border-collapse:collapse"><tr><td style="padding:20px 24px">
            <p style="margin:0 0 12px;color:#6f7b70;font-size:12px;text-transform:uppercase;letter-spacing:1px;font-weight:700">Order Items</p>
            <table width="100%" style="border-collapse:collapse">
              <tr style="background:#f0ede6">
                <th style="padding:8px 12px;text-align:left;color:#6f7b70;font-size:12px;font-weight:600">Product</th>
                <th style="padding:8px 12px;text-align:center;color:#6f7b70;font-size:12px;font-weight:600">Qty</th>
                <th style="padding:8px 12px;text-align:right;color:#6f7b70;font-size:12px;font-weight:600">Unit Price</th>
                <th style="padding:8px 12px;text-align:right;color:#6f7b70;font-size:12px;font-weight:600">Subtotal</th>
              </tr>
              ${itemRows}
            </table>
            <div style="margin-top:12px;padding-top:12px;border-top:2px solid #e6e3da;text-align:right">
              <span style="color:#6f7b70;font-size:14px">Amount Due on Delivery: </span>
              <span style="color:#24321F;font-size:18px;font-weight:700">${formattedTotal}</span>
            </div>
          </td></tr></table>
          <p style="margin:16px 0;color:#4a4a4a;font-size:15px;line-height:1.7">Please prepare the exact amount for when the delivery arrives. If you have any questions, feel free to contact us anytime.</p>
          <p style="margin:24px 0 0;color:#4a4a4a;font-size:15px">Thank you for shopping with ATC Tea Community.</p>
        </td></tr>
        <tr><td style="padding:20px 40px 32px;border-top:1px solid #f0ede6">
          <p style="margin:0;color:#b0a99a;font-size:12px;text-align:center">© ${new Date().getFullYear()} ATC Tea Community — This is an automated email, please do not reply.</p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body></html>`;

  await transporter.sendMail({
    from: `"ATC Tea Community" <${process.env.MAIL_USER}>`,
    to,
    subject: `Order Placed #ORD-${orderId} — Cash on Delivery`,
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
          <td style="padding:8px 12px;border-bottom:1px solid #f0ede6;color:#24321F;font-size:14px">${item.tea_name || item.name || 'Product'}</td>
          <td style="padding:8px 12px;border-bottom:1px solid #f0ede6;color:#6f7b70;font-size:14px;text-align:center">${item.quantity}</td>
          <td style="padding:8px 12px;border-bottom:1px solid #f0ede6;color:#6f7b70;font-size:14px;text-align:right">฿${Number(item.unit_price || 0).toLocaleString("en-US", { minimumFractionDigits: 2 })}</td>
          <td style="padding:8px 12px;border-bottom:1px solid #f0ede6;color:#24321F;font-size:14px;text-align:right;font-weight:600">฿${Number(item.subtotal || 0).toLocaleString("en-US", { minimumFractionDigits: 2 })}</td>
        </tr>`
    )
    .join("");

  const formattedTotal = `฿${Number(totalAmount || 0).toLocaleString("en-US", { minimumFractionDigits: 2 })}`;

  const html = `
<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"></head>
<body style="margin:0;padding:0;background:#f5f3ed;font-family:'Segoe UI',Tahoma,Geneva,Verdana,sans-serif">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f5f3ed;padding:32px 0">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 2px 12px rgba(0,0,0,0.08)">
        <tr><td style="background:#485B3B;padding:28px 40px;text-align:center">
          <h1 style="margin:0;color:#fff;font-size:24px;font-weight:700">COD Payment Confirmed — Thank You! 🎉</h1>
        </td></tr>
        <tr><td style="padding:36px 40px 20px">
          <p style="margin:0 0 20px;color:#24321F;font-size:16px"><strong>Dear ${username || "User"}</strong></p>
          <p style="margin:0 0 16px;color:#4a4a4a;font-size:15px;line-height:1.7">Your Cash on Delivery payment for order <strong>#ORD-${orderId}</strong> has been confirmed. Thank you for your purchase!</p>
          <table width="100%" style="background:#faf8f2;border-radius:10px;margin:20px 0;border-collapse:collapse"><tr><td style="padding:20px 24px">
            <p style="margin:0 0 12px;color:#6f7b70;font-size:12px;text-transform:uppercase;letter-spacing:1px;font-weight:700">Ordered Items</p>
            <table width="100%" style="border-collapse:collapse">
              <tr style="background:#f0ede6">
                <th style="padding:8px 12px;text-align:left;color:#6f7b70;font-size:12px;font-weight:600">Product</th>
                <th style="padding:8px 12px;text-align:center;color:#6f7b70;font-size:12px;font-weight:600">Qty</th>
                <th style="padding:8px 12px;text-align:right;color:#6f7b70;font-size:12px;font-weight:600">Unit Price</th>
                <th style="padding:8px 12px;text-align:right;color:#6f7b70;font-size:12px;font-weight:600">Subtotal</th>
              </tr>
              ${itemRows}
            </table>
            <div style="margin-top:12px;padding-top:12px;border-top:2px solid #e6e3da;text-align:right">
              <span style="color:#6f7b70;font-size:14px">Total: </span>
              <span style="color:#24321F;font-size:18px;font-weight:700">${formattedTotal}</span>
            </div>
          </td></tr></table>
          <p style="margin:16px 0;color:#4a4a4a;font-size:15px;line-height:1.7">Your items have been delivered successfully. If you encounter any issues with your products, please contact the shop anytime.</p>
          <p style="margin:24px 0 0;color:#4a4a4a;font-size:15px">Thank you for shopping with ATC Tea Community.</p>
        </td></tr>
        <tr><td style="padding:20px 40px 32px;border-top:1px solid #f0ede6">
          <p style="margin:0;color:#b0a99a;font-size:12px;text-align:center">© ${new Date().getFullYear()} ATC Tea Community — This is an automated email, please do not reply.</p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body></html>`;

  await transporter.sendMail({
    from: `"ATC Tea Community" <${process.env.MAIL_USER}>`,
    to,
    subject: `COD Payment Confirmed #ORD-${orderId} — ATC Tea Community`,
    html,
  });
}

/**
 * Send email after user pays for event registration.
 */
async function sendEventPaymentConfirmation({ to, username, eventTitle, eventDate }) {
  if (!process.env.MAIL_USER || !process.env.MAIL_PASS) {
    console.warn("MAIL_USER / MAIL_PASS not set - skipping event payment email");
    return;
  }

  const formattedDate = eventDate
    ? new Date(eventDate).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })
    : "TBA";

  const html = `
<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"></head>
<body style="margin:0;padding:0;background:#f5f3ed;font-family:'Segoe UI',Tahoma,Geneva,Verdana,sans-serif">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f5f3ed;padding:32px 0">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 2px 12px rgba(0,0,0,0.08)">
        <tr><td style="background:#485B3B;padding:28px 40px;text-align:center">
          <h1 style="margin:0;color:#fff;font-size:24px;font-weight:700">Event Payment Confirmed \u2014 Thank You! \ud83c\udf89</h1>
        </td></tr>
        <tr><td style="padding:36px 40px 20px">
          <p style="margin:0 0 20px;color:#24321F;font-size:16px"><strong>Dear ${username || "User"}</strong></p>
          <p style="margin:0 0 16px;color:#4a4a4a;font-size:15px;line-height:1.7">Your payment for the event <strong>&ldquo;${eventTitle}&rdquo;</strong> has been confirmed successfully.</p>
          <table width="100%" style="background:#faf8f2;border-radius:10px;margin:20px 0"><tr><td style="padding:20px 24px">
            <p style="margin:0 0 8px;color:#6f7b70;font-size:12px;text-transform:uppercase;letter-spacing:1px;font-weight:700">Event Details</p>
            <p style="margin:0 0 6px;color:#24321F;font-size:16px;font-weight:600">\ud83c\udf8b ${eventTitle}</p>
            <p style="margin:0 0 6px;color:#6f7b70;font-size:14px">\ud83d\udcc5 Date: ${formattedDate}</p>
            <p style="margin:0;color:#6f7b70;font-size:14px">\ud83d\udcb3 Payment Status: <strong style="color:#485B3B">Confirmed</strong></p>
          </td></tr></table>
          <p style="margin:16px 0;color:#4a4a4a;font-size:15px;line-height:1.7">You can check your registration status on the event page.</p>
          <p style="margin:24px 0 0;color:#4a4a4a;font-size:15px">Thank you for joining our event.</p>
        </td></tr>
        <tr><td style="padding:20px 40px 32px;border-top:1px solid #f0ede6">
          <p style="margin:0;color:#b0a99a;font-size:12px;text-align:center">\u00a9 ${new Date().getFullYear()} ATC Tea Community \u2014 This is an automated email, please do not reply.</p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body></html>`;

  await transporter.sendMail({
    from: `"ATC Tea Community" <${process.env.MAIL_USER}>`,
    to,
    subject: `Event Payment Confirmed \ud83d\udc8e ${eventTitle}`,
    html,
  });
}

/**
 * Send email to notify approval or rejection decisions.
 */
async function sendApprovalDecisionEmail({ to, username, subjectType, subjectName, approved }) {
  if (!process.env.MAIL_USER || !process.env.MAIL_PASS) {
    console.warn("MAIL_USER / MAIL_PASS not set - skipping approval decision email");
    return;
  }

  const safeType = String(subjectType || "request").trim() || "request";
  const safeName = String(subjectName || "your request").trim() || "your request";
  const decisionText = approved ? "approved" : "rejected";
  const accent = approved ? "#485B3B" : "#B33A24";
  const heading = approved ? `${safeType} approved` : `${safeType} not approved`;
  const body = approved
    ? `Your ${safeType.toLowerCase()} for "${safeName}" has been approved.`
    : `Your ${safeType.toLowerCase()} for "${safeName}" was not approved.`;

  const html = `
<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"></head>
<body style="margin:0;padding:24px;background:#f5f3ed;font-family:Segoe UI,Tahoma,Geneva,Verdana,sans-serif;color:#24321F">
  <div style="max-width:600px;margin:0 auto;background:#fff;border-radius:12px;padding:32px;box-shadow:0 2px 12px rgba(0,0,0,0.08)">
    <h1 style="margin:0 0 16px;color:${accent};font-size:24px;text-transform:capitalize">${heading}</h1>
    <p style="margin:0 0 12px">Hello ${username || "there"}</p>
    <p style="margin:0 0 16px">${body}</p>
    <div style="background:#faf8f2;border-radius:10px;padding:16px;margin:16px 0">
      <p style="margin:0 0 8px">Type: <strong>${safeType}</strong></p>
      <p style="margin:0">Name: <strong>${safeName}</strong></p>
    </div>
    <p style="margin:16px 0 0">This is an automated email from teactive.</p>
  </div>
</body></html>`;

  await transporter.sendMail({
    from: `"teactive" <${process.env.MAIL_USER}>`,
    to,
    subject: `teactive: ${safeType} ${decisionText}`,
    html,
  });
}

/**
 * Send email after user cancels a confirmed (paid) event registration.
 */
async function sendEventCancellationEmail({ to, username, eventTitle, eventDate }) {
  if (!process.env.MAIL_USER || !process.env.MAIL_PASS) {
    console.warn("MAIL_USER / MAIL_PASS not set - skipping cancellation email");
    return;
  }

  const formattedDate = eventDate
    ? new Date(eventDate).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })
    : "TBA";

  const html = `
<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"></head>
<body style="margin:0;padding:0;background:#f5f3ed;font-family:'Segoe UI',Tahoma,Geneva,Verdana,sans-serif">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f5f3ed;padding:32px 0">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 2px 12px rgba(0,0,0,0.08)">
        <tr><td style="background:#c0392b;padding:28px 40px;text-align:center">
          <h1 style="margin:0;color:#fff;font-size:24px;font-weight:700">Event Registration Cancelled \u274c</h1>
        </td></tr>
        <tr><td style="padding:36px 40px 20px">
          <p style="margin:0 0 20px;color:#24321F;font-size:16px"><strong>Dear ${username || "User"}</strong></p>
          <p style="margin:0 0 16px;color:#4a4a4a;font-size:15px;line-height:1.7">Your registration for the event <strong>&ldquo;${eventTitle}&rdquo;</strong> has been cancelled.</p>
          <table width="100%" style="background:#faf8f2;border-radius:10px;margin:20px 0"><tr><td style="padding:20px 24px">
            <p style="margin:0 0 8px;color:#6f7b70;font-size:12px;text-transform:uppercase;letter-spacing:1px;font-weight:700">Event Details</p>
            <p style="margin:0 0 6px;color:#24321F;font-size:16px;font-weight:600">\ud83c\udf8b ${eventTitle}</p>
            <p style="margin:0 0 6px;color:#6f7b70;font-size:14px">\ud83d\udcc5 Date: ${formattedDate}</p>
            <p style="margin:0;color:#6f7b70;font-size:14px">\ud83d\udcb3 Status: <strong style="color:#c0392b">Cancelled</strong></p>
          </td></tr></table>
          <p style="margin:16px 0;color:#4a4a4a;font-size:15px;line-height:1.7">If you have any questions, feel free to contact us anytime.</p>
          <p style="margin:24px 0 0;color:#4a4a4a;font-size:15px">Thank you for your interest in our events.</p>
        </td></tr>
        <tr><td style="padding:20px 40px 32px;border-top:1px solid #f0ede6">
          <p style="margin:0;color:#b0a99a;font-size:12px;text-align:center">\u00a9 ${new Date().getFullYear()} ATC Tea Community \u2014 This is an automated email, please do not reply.</p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body></html>`;

  await transporter.sendMail({
    from: `"ATC Tea Community" <${process.env.MAIL_USER}>`,
    to,
    subject: `Event Registration Cancelled \u274c ${eventTitle}`,
    html,
  });
}

module.exports = {
  sendRegistrationConfirmation,
  sendWelcomeEmail,
  sendOrderPlacedEmail,
  sendOrderPaidEmail,
  sendCodPaidEmail,
  sendCodReminderEmail,
  sendEventPaymentConfirmation,
  sendEventCancellationEmail,
  sendApprovalDecisionEmail,
};
