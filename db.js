require('dotenv').config();
const mysql = require('mysql2');

const connectionUrl = process.env.MYSQL_URL;

if (!connectionUrl) {
  console.error('ERROR: MYSQL_URL environment variable is not set!');
  console.error('Available env vars:', Object.keys(process.env));
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
