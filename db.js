require('dotenv').config();
const mysql = require('mysql2');

console.log('MYSQL_URL exists:', !!process.env.MYSQL_URL);
console.log('MYSQL_URL value:', process.env.MYSQL_URL ? process.env.MYSQL_URL.substring(0, 30) + '...' : 'NOT FOUND');

const connectionUrl = process.env.MYSQL_URL;

if (!connectionUrl) {
  console.error('ERROR: MYSQL_URL is missing!');
  process.exit(1);
}

const db = mysql.createConnection(connectionUrl);

db.connect(function(err) {
  if (err) {
    console.log('DB connection failed:', err.message);
  } else {
    console.log('Connected to MySQL!');
  }
});

module.exports = db;
