START TRANSACTION;

DROP TEMPORARY TABLE IF EXISTS seller_daily_fill;

CREATE TEMPORARY TABLE seller_daily_fill AS
WITH RECURSIVE date_series AS (
  SELECT DATE_SUB(CURDATE(), INTERVAL 89 DAY) AS sale_date, 0 AS idx
  UNION ALL
  SELECT DATE_ADD(sale_date, INTERVAL 1 DAY), idx + 1
  FROM date_series
  WHERE idx < 89
),
existing_days AS (
  SELECT DISTINCT DATE(o.order_date) AS sale_date
  FROM tea_shop ts
  JOIN tea_product tp ON tp.shop_id = ts.shop_id
  JOIN order_details od ON od.product_id = tp.product_id
  JOIN orders o ON o.order_id = od.order_id
  WHERE ts.user_id = 12
    AND o.status = 'paid'
    AND DATE(o.order_date) BETWEEN DATE_SUB(CURDATE(), INTERVAL 89 DAY) AND CURDATE()
)
SELECT
  TIMESTAMP(
    ds.sale_date,
    MAKETIME(10 + MOD(ds.idx, 8), MOD(10 + MOD(ds.idx, 5) * 9, 60), 0)
  ) AS order_date,
  6 AS user_id,
  CASE MOD(ds.idx, 5)
    WHEN 0 THEN 10
    WHEN 1 THEN 13
    WHEN 2 THEN 11
    WHEN 3 THEN 12
    ELSE 9
  END AS product_id,
  CASE MOD(ds.idx, 6)
    WHEN 0 THEN 1
    WHEN 1 THEN 2
    WHEN 2 THEN 2
    WHEN 3 THEN 3
    WHEN 4 THEN 2
    ELSE 1
  END AS quantity
FROM date_series ds
LEFT JOIN existing_days ed ON ed.sale_date = ds.sale_date
WHERE ed.sale_date IS NULL;

INSERT INTO orders (
  user_id,
  order_date,
  status,
  payment_status,
  fulfillment_status,
  paid_at,
  completed_at,
  updated_at,
  total_amount
)
SELECT
  fill.user_id,
  fill.order_date,
  'paid',
  'paid',
  'completed',
  fill.order_date,
  DATE_ADD(fill.order_date, INTERVAL 1 DAY),
  DATE_ADD(fill.order_date, INTERVAL 1 DAY),
  ROUND(tp.price * fill.quantity, 2) AS total_amount
FROM seller_daily_fill fill
JOIN tea_product tp ON tp.product_id = fill.product_id;

INSERT INTO order_details (
  order_id,
  product_id,
  quantity,
  unit_price,
  subtotal
)
SELECT
  o.order_id,
  fill.product_id,
  fill.quantity,
  tp.price,
  ROUND(tp.price * fill.quantity, 2) AS subtotal
FROM seller_daily_fill fill
JOIN tea_product tp ON tp.product_id = fill.product_id
JOIN orders o
  ON o.user_id = fill.user_id
 AND o.order_date = fill.order_date
 AND o.total_amount = ROUND(tp.price * fill.quantity, 2)
LEFT JOIN order_details od
  ON od.order_id = o.order_id
 AND od.product_id = fill.product_id
WHERE od.order_detail_id IS NULL;

DROP TEMPORARY TABLE IF EXISTS seller_daily_fill;

COMMIT;
