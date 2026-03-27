const { beginTransaction, commit, rollback, query } = require("../utils/dbHelpers");

function normalizeMessage(row) {
  return {
    id: row.message_id,
    role: row.sender_type,
    kind: row.message_type,
    text: row.message_text,
    time: row.created_at,
    created_at: row.created_at,
    product:
      row.message_type === "product" && row.product_id
        ? {
            id: row.product_id,
            name: row.tea_name,
            tag: row.tea_type,
            price: Number(row.price ?? 0),
            img: row.image_path || null,
          }
        : null,
  };
}

async function getShopById(shopId) {
  const rows = await query(
    `SELECT shop_id, user_id, shop_name, phone, subdistrict, district, province
     FROM tea_shop
     WHERE shop_id = ?`,
    [shopId]
  );

  if (rows.length === 0) {
    const error = new Error("Shop not found");
    error.statusCode = 404;
    throw error;
  }

  return rows[0];
}

async function getOrCreateRoom(userId, shopId) {
  const existingRows = await query(
    `SELECT room_id, user_id, shop_id, status, created_at, updated_at, last_message_at
     FROM chat_room
     WHERE user_id = ? AND shop_id = ?
     LIMIT 1`,
    [userId, shopId]
  );

  if (existingRows.length > 0) {
    return existingRows[0];
  }

  const result = await query(
    `INSERT INTO chat_room (user_id, shop_id, last_message_at, status)
     VALUES (?, ?, NULL, 'open')`,
    [userId, shopId]
  );

  const roomRows = await query(
    `SELECT room_id, user_id, shop_id, status, created_at, updated_at, last_message_at
     FROM chat_room
     WHERE room_id = ?`,
    [result.insertId]
  );

  return roomRows[0];
}

async function clearLegacyStarterMessages(roomId) {
  const rows = await query(
    `SELECT sender_type
     FROM chat_message
     WHERE room_id = ?`,
    [roomId]
  );

  if (rows.length === 0) {
    return;
  }

  const hasUserMessage = rows.some((row) => row.sender_type === 'user');
  if (hasUserMessage) {
    return;
  }

  await query("DELETE FROM chat_message WHERE room_id = ?", [roomId]);
  await query("UPDATE chat_room SET last_message_at = NULL, updated_at = NOW() WHERE room_id = ?", [roomId]);
}

async function getMessagesByRoom(roomId) {
  const rows = await query(
    `SELECT cm.message_id, cm.sender_type, cm.message_type, cm.message_text, cm.created_at,
            cm.product_id, tp.tea_name, tp.tea_type, tp.price, pi.image_path
     FROM chat_message cm
     LEFT JOIN tea_product tp ON tp.product_id = cm.product_id
     LEFT JOIN product_images pi
       ON pi.image_id = (
         SELECT MIN(pi2.image_id)
         FROM product_images pi2
         WHERE pi2.product_id = cm.product_id
       )
     WHERE cm.room_id = ?
     ORDER BY cm.created_at ASC, cm.message_id ASC`,
    [roomId]
  );

  return rows.map(normalizeMessage);
}

async function getChatRoomByShop(userId, shopId) {
  await getShopById(shopId);
  const room = await getOrCreateRoom(userId, shopId);
  await clearLegacyStarterMessages(room.room_id);
  const messages = await getMessagesByRoom(room.room_id);

  return {
    room_id: room.room_id,
    user_id: room.user_id,
    shop_id: room.shop_id,
    status: room.status,
    last_message_at: room.last_message_at,
    messages,
  };
}

function buildAutoReply(text, shopName) {
  const value = String(text || "").toLowerCase();

  if (value.includes("???") || value.includes("promotion")) {
    return `?????????? ${shopName} ????????????????????????????????? ???????????????????????????????????`;
  }

  if (value.includes("???") || value.includes("??????") || value.includes("delivery")) {
    return `???? ${shopName} ?????????????? ?????????????????????????????????????????????????????????`;
  }

  if (value.includes("??????") || value.includes("product")) {
    return `???? ${shopName} ?????????????? ???????????????????????????????????????????????????????????`;
  }

  return `???? ${shopName} ????????????????? ???????????????????????????????????`;
}

async function createChatMessage(userId, shopId, payload) {
  const messageText = String(payload.message_text ?? "").trim();

  if (!messageText) {
    const error = new Error("message_text is required");
    error.statusCode = 400;
    throw error;
  }

  const shop = await getShopById(shopId);

  try {
    await beginTransaction();

    const room = await getOrCreateRoom(userId, shopId);

    const userResult = await query(
      `INSERT INTO chat_message
       (room_id, sender_type, sender_user_id, message_type, message_text, is_read)
       VALUES (?, 'user', ?, 'text', ?, 0)`,
      [room.room_id, userId, messageText]
    );

    const autoReply = buildAutoReply(messageText, shop.shop_name);

    const shopResult = await query(
      `INSERT INTO chat_message
       (room_id, sender_type, sender_user_id, message_type, message_text, is_read)
       VALUES (?, 'shop', ?, 'text', ?, 0)`,
      [room.room_id, shop.user_id, autoReply]
    );

    await query("UPDATE chat_room SET last_message_at = NOW(), updated_at = NOW() WHERE room_id = ?", [room.room_id]);

    await commit();

    const newRows = await query(
      `SELECT cm.message_id, cm.sender_type, cm.message_type, cm.message_text, cm.created_at,
              cm.product_id, tp.tea_name, tp.tea_type, tp.price, pi.image_path
       FROM chat_message cm
       LEFT JOIN tea_product tp ON tp.product_id = cm.product_id
       LEFT JOIN product_images pi
         ON pi.image_id = (
           SELECT MIN(pi2.image_id)
           FROM product_images pi2
           WHERE pi2.product_id = cm.product_id
         )
       WHERE cm.message_id IN (?, ?)
       ORDER BY cm.created_at ASC, cm.message_id ASC`,
      [userResult.insertId, shopResult.insertId]
    );

    return {
      room_id: room.room_id,
      messages: newRows.map(normalizeMessage),
    };
  } catch (error) {
    await rollback();
    throw error;
  }
}

module.exports = {
  getChatRoomByShop,
  createChatMessage,
};
