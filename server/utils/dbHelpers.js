const db = require("../db");

function query(sql, values = []) {
  return new Promise((resolve, reject) => {
    db.query(sql, values, (err, result) => {
      if (err) reject(err);
      else resolve(result);
    });
  });
}

function beginTransaction() {
  return new Promise((resolve, reject) => {
    db.beginTransaction((err) => {
      if (err) reject(err);
      else resolve();
    });
  });
}

function commit() {
  return new Promise((resolve, reject) => {
    db.commit((err) => {
      if (err) reject(err);
      else resolve();
    });
  });
}

function rollback() {
  return new Promise((resolve) => {
    db.rollback(() => resolve());
  });
}

module.exports = {
  query,
  beginTransaction,
  commit,
  rollback
};
