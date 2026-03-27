UPDATE users u
JOIN tea_shop ts ON ts.user_id = u.user_id
SET u.role = 'shop'
WHERE u.role <> 'admin';
