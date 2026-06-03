require('dotenv').config();
const mysql = require('mysql2');

const connectionUrl = process.env.MYSQL_URL;

if (!connectionUrl) {
  console.error('WARNING: MYSQL_URL is not set!');
}

const db = connectionUrl ? mysql.createConnection(connectionUrl) : null;

if (db) {
  db.connect(function(err) {
    if (err) {
      console.error('DB connection failed:', err.message);
    } else {
      console.log('Connected to MySQL!');
    }
  });
} else {
  console.log('No database connection - running without DB');
}

module.exports = db;
