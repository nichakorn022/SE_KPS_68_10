const db = require("../config/db");

async function requestSponsor(data){

  const { event_id, shop_id, product_id, quantity } = data;

  const [result] = await db.query(
    `INSERT INTO sponsor
    (event_id, shop_id, product_id, quantity, status)
    VALUES (?, ?, ?, ?, 'PENDING')`,
    [event_id, shop_id, product_id, quantity]
  );

  return result.insertId;
}

async function approveSponsor(id){

  await db.query(
    "UPDATE sponsor SET status='APPROVED' WHERE sponsor_id=?",
    [id]
  );

}

async function getAllSponsorRequests(){

  const [rows] = await db.query(`
    SELECT 
      s.sponsor_id,
      e.title AS event_title,
      ts.shop_name,
      tp.product_name,
      s.quantity,
      s.status,
      s.created_at
    FROM sponsor s
    JOIN event e ON e.event_id = s.event_id
    JOIN tea_shop ts ON ts.shop_id = s.shop_id
    JOIN tea_product tp ON tp.product_id = s.product_id
    ORDER BY s.created_at DESC
  `);

  return rows;
}



module.exports = {
  requestSponsor,
  approveSponsor,
  getAllSponsorRequests
};