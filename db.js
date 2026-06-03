require('dotenv').config();
const mysql = require('mysql2');

const db = mysql.createConnection(process.env.MYSQL_URL);

db.connect(function(err) {
  if (err) {
    console.log('DB connection failed:', err.message);
  } else {
    console.log('Connected to MySQL!');
  }
});

module.exports = db;
