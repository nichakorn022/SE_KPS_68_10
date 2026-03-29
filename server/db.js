const path = require("path");
const fs = require("fs");
const mysql = require("mysql2");
const dotenv = require("dotenv");

const localEnvPath = path.join(__dirname, ".env.local");
const envPath = fs.existsSync(localEnvPath) ? localEnvPath : path.join(__dirname, ".env");
dotenv.config({ path: envPath });

const connectionConfig = {
  host: process.env.DB_HOST,
  port: process.env.DB_PORT ? Number(process.env.DB_PORT) : 3306,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  charset: "utf8mb4",
};

let connection = null;
let connecting = null;
let loggedConnected = false;

function createConnection() {
  const conn = mysql.createConnection(connectionConfig);
  conn.on("error", (err) => {
    if (err && err.fatal) {
      connection = null;
      connecting = null;
      loggedConnected = false;
    }
  });
  return conn;
}

function getConnection() {
  if (!connection || connection.state === "disconnected") {
    connection = createConnection();
  }
  return connection;
}

function ensureConnected() {
  const conn = getConnection();
  if (conn.state === "authenticated") return Promise.resolve();
  if (connecting) return connecting;

  connecting = new Promise((resolve, reject) => {
    conn.connect((err) => {
      connecting = null;
      if (err) return reject(err);
      if (!loggedConnected) {
        loggedConnected = true;
        console.log("MySQL Connected");
      }
      return resolve();
    });
  });

  return connecting;
}

function withConnection(operation, callback) {
  ensureConnected()
    .then(() => {
      // mysql2's `query()` returns a Query object which is "thenable" and throws when awaited.
      // Avoid returning it from this Promise chain.
      operation(getConnection(), callback);
    })
    .catch((err) => callback(err));
}

module.exports = {
  query(sql, values, callback) {
    if (typeof values === "function") {
      callback = values;
      values = [];
    }
    return withConnection((conn, cb) => conn.query(sql, values || [], cb), callback);
  },
  beginTransaction(callback) {
    return withConnection((conn, cb) => conn.beginTransaction(cb), callback);
  },
  commit(callback) {
    return withConnection((conn, cb) => conn.commit(cb), callback);
  },
  rollback(callback) {
    // Rollback is best-effort; if we can't connect, still invoke callback.
    const safeCallback = typeof callback === "function" ? callback : () => {};
    ensureConnected()
      .then(() => {
        // Avoid returning mysql2's thenable Query object from this Promise chain.
        getConnection().rollback(() => safeCallback(null));
      })
      .catch(() => safeCallback(null));
  },
};
