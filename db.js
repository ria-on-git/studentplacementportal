const mysql = require('mysql2');

const db = mysql.createConnection({
  host:     process.env.DB_HOST,  // your MySQL host
  user:     process.env.DB_USER,       // your MySQL username
  password: process.env.DB_PASSWORD,           // your MySQL password
  database: process.env.DB_NAME     // we'll create this database in the next step
});

db.connect(function(err) {
  if (err) {
    console.log('DB connection failed:', err.message);
  } else {
    console.log('Connected to MySQL!');
  }
});

module.exports = db;