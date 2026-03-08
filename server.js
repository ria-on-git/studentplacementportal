const express = require('express');
const cors    = require('cors');
const db      = require('./db');

const app = express();

app.use(cors());
app.use(express.json());


// ROUTE 1 — GET /jobs
app.get('/jobs', function(req, res) {
  db.query('SELECT * FROM jobs', function(err, results) {
    if (err) {
      console.log('Error fetching jobs:', err.message);
      return res.status(500).json({ success: false, error: 'Could not fetch jobs' });
    }
    res.json(results);
  });
});


// ROUTE 2 — POST /register
app.post('/register', function(req, res) {
  var name     = req.body.name;
  var email    = req.body.email;
  var password = req.body.password;
  var dept     = req.body.dept;
  var cgpa     = req.body.cgpa;
  var year     = req.body.year;

  if (!name || !email || !password || !dept || !cgpa || !year) {
    return res.status(400).json({ success: false, error: 'All fields are required' });
  }

  var sql = 'INSERT INTO students (name, email, password, department, cgpa, year) VALUES (?, ?, ?, ?, ?, ?)';

  db.query(sql, [name, email, password, dept, cgpa, year], function(err, result) {
    if (err) {
      if (err.errno === 1062) {
        return res.status(400).json({ success: false, error: 'Email already registered' });
      }
      console.log('Error registering student:', err.message);
      return res.status(500).json({ success: false, error: 'Registration failed' });
    }
    res.json({ success: true, studentId: result.insertId });
  });
});


// ROUTE 3 — POST /login
app.post('/login', function(req, res) {
  var email    = req.body.email;
  var password = req.body.password;

  if (!email || !password) {
    return res.status(400).json({ success: false, error: 'Email and password are required' });
  }

  db.query('SELECT * FROM students WHERE email = ?', [email], function(err, results) {
    if (err) {
      console.log('Error during login:', err.message);
      return res.status(500).json({ success: false, error: 'Login failed' });
    }

    if (results.length === 0) {
      return res.status(401).json({ success: false, error: 'Invalid email or password' });
    }

    var student = results[0];

    if (student.password !== password) {
      return res.status(401).json({ success: false, error: 'Invalid email or password' });
    }

    res.json({
      success: true,
      user: {
        id:    student.id,
        name:  student.name,
        email: student.email,
        dept:  student.department,
        cgpa:  student.cgpa,
        year:  student.year
      }
    });
  });
});


// ROUTE 4 — POST /apply
app.post('/apply', function(req, res) {
  var studentId = req.body.studentId;
  var jobId     = req.body.jobId;

  if (!studentId || !jobId) {
    return res.status(400).json({ success: false, error: 'Student ID and Job ID are required' });
  }

  db.query(
    'SELECT * FROM applications WHERE student_id = ? AND job_id = ?',
    [studentId, jobId],
    function(err, results) {
      if (err) {
        return res.status(500).json({ success: false, error: 'Could not check application' });
      }

      if (results.length > 0) {
        return res.status(400).json({ success: false, error: 'Already applied to this job' });
      }

      db.query(
        'INSERT INTO applications (student_id, job_id) VALUES (?, ?)',
        [studentId, jobId],
        function(err) {
          if (err) {
            console.log('Error saving application:', err.message);
            return res.status(500).json({ success: false, error: 'Could not save application' });
          }
          res.json({ success: true });
        }
      );
    }
  );
});


// ROUTE 5 — GET /applications/:studentId
app.get('/applications/:studentId', function(req, res) {
  var studentId = req.params.studentId;

  var sql = `
    SELECT jobs.*
    FROM applications
    JOIN jobs ON applications.job_id = jobs.id
    WHERE applications.student_id = ?
  `;

  db.query(sql, [studentId], function(err, results) {
    if (err) {
      console.log('Error fetching applications:', err.message);
      return res.status(500).json({ success: false, error: 'Could not fetch applications' });
    }
    res.json(results);
  });
});


// START SERVER
app.listen(3000, function() {
  console.log('PlaceIt server running at http://localhost:3000');
});