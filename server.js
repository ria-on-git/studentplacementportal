const express = require('express');
const cors    = require('cors');
const db      = require('./db');

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.static('.')); 

app.get('/', function(req, res) {
  res.sendFile(__dirname + '/index.html'); 
});

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

// ROUTE 6 — GET /recommendations/:studentId
app.get('/recommendations/:studentId', function(req, res) {
  var studentId = req.params.studentId;

  db.query('SELECT * FROM students WHERE id = ?', [studentId], function(err, students) {
    if (err) return res.status(500).json({ success: false, error: err.message });
    if (students.length === 0) return res.status(404).json({ success: false, error: 'Student not found' });

    var student = students[0];

    // Get student skills
    db.query('SELECT skill FROM student_skills WHERE student_id = ?', [studentId], function(err, skillRows) {
      if (err) return res.status(500).json({ success: false, error: err.message });

      var studentSkills = skillRows.map(function(s) { return s.skill.toLowerCase(); });

      db.query('SELECT * FROM jobs', function(err, jobs) {
        if (err) return res.status(500).json({ success: false, error: err.message });

        var scored = jobs.map(function(job) {
          var score   = 0;
          var reasons = [];

          // 1. CGPA check — hard fail
          if (student.cgpa >= job.min_cgpa) {
            score += 30;
            reasons.push('CGPA eligible');
          } else {
            return null;
          }

          // 2. Department check — fuzzy, hard fail if specified
          if (!job.required_dept) {
            score += 10;
            reasons.push('Open to all departments');
          } else {
            var studentDept = (student.department || '').toLowerCase();
            var jobDept     = job.required_dept.toLowerCase();
            if (studentDept.includes(jobDept) || jobDept.includes(studentDept)) {
              score += 20;
              reasons.push('Department match');
            } else {
              return null;
            }
          }

          // 3. Skills match — soft scoring
          if (job.required_skills) {
            var jobSkills    = job.required_skills.split(',').map(function(s) { return s.trim().toLowerCase(); });
            var matchedSkills = jobSkills.filter(function(s) { return studentSkills.includes(s); });
            var skillScore   = Math.round((matchedSkills.length / jobSkills.length) * 30);
            score  += skillScore;
            if (matchedSkills.length > 0) {
              reasons.push(matchedSkills.length + '/' + jobSkills.length + ' skills matched');
            }
          } else {
            score += 15; // no skill requirement — neutral bonus
          }

          // 4. Preference match — soft bonus
          if (student.preference && job.tag) {
            if (student.preference.toLowerCase() === job.tag.toLowerCase()) {
              score += 20;
              reasons.push('Matches your preference');
            }
          }

          return { ...job, match_score: score, match_reasons: reasons };
        });

        var recommendations = scored
          .filter(function(j) { return j !== null; })
          .sort(function(a, b) { return b.match_score - a.match_score; });

        res.json({ success: true, recommendations: recommendations });
      });
    });
  });
});

// ROUTE 7 — GET /profile/:studentId
app.get('/profile/:studentId', function(req, res) {
  var studentId = req.params.studentId;

  db.query('SELECT id, name, email, department, cgpa, year, bio FROM students WHERE id = ?', [studentId], function(err, students) {
    if (err) return res.status(500).json({ success: false, error: err.message });
    if (students.length === 0) return res.status(404).json({ success: false, error: 'Student not found' });

    var student = students[0];

    db.query('SELECT skill FROM student_skills WHERE student_id = ?', [studentId], function(err, skills) {
      if (err) return res.status(500).json({ success: false, error: err.message });

      db.query('SELECT cert_name, issuer FROM student_certs WHERE student_id = ?', [studentId], function(err, certs) {
        if (err) return res.status(500).json({ success: false, error: err.message });

        db.query('SELECT preference FROM student_preferences WHERE student_id = ?', [studentId], function(err, prefs) {
          if (err) return res.status(500).json({ success: false, error: err.message });

          res.json({
            success: true,
            profile: {
              ...student,
              skills: skills.map(function(s) { return s.skill; }),
              certs: certs,
              preferences: prefs.map(function(p) { return p.preference; })
            }
          });
        });
      });
    });
  });
});


// ROUTE 8 — POST /profile/skills (add a skill)
app.post('/profile/skills', function(req, res) {
  var studentId = req.body.studentId;
  var skill     = req.body.skill;

  if (!studentId || !skill) return res.status(400).json({ success: false, error: 'Missing fields' });

  db.query('INSERT INTO student_skills (student_id, skill) VALUES (?, ?)', [studentId, skill], function(err) {
    if (err) return res.status(500).json({ success: false, error: err.message });
    res.json({ success: true });
  });
});


// ROUTE 9 — DELETE /profile/skills (remove a skill)
app.delete('/profile/skills', function(req, res) {
  var studentId = req.body.studentId;
  var skill     = req.body.skill;

  db.query('DELETE FROM student_skills WHERE student_id = ? AND skill = ?', [studentId, skill], function(err) {
    if (err) return res.status(500).json({ success: false, error: err.message });
    res.json({ success: true });
  });
});


// ROUTE 10 — POST /profile/certs (add a cert)
app.post('/profile/certs', function(req, res) {
  var studentId = req.body.studentId;
  var certName  = req.body.cert_name;
  var issuer    = req.body.issuer;

  if (!studentId || !certName) return res.status(400).json({ success: false, error: 'Missing fields' });

  db.query('INSERT INTO student_certs (student_id, cert_name, issuer) VALUES (?, ?, ?)', [studentId, certName, issuer], function(err) {
    if (err) return res.status(500).json({ success: false, error: err.message });
    res.json({ success: true });
  });
});


// ROUTE 11 — DELETE /profile/certs (remove a cert)
app.delete('/profile/certs', function(req, res) {
  var studentId = req.body.studentId;
  var certName  = req.body.cert_name;

  db.query('DELETE FROM student_certs WHERE student_id = ? AND cert_name = ?', [studentId, certName], function(err) {
    if (err) return res.status(500).json({ success: false, error: err.message });
    res.json({ success: true });
  });
});


// ROUTE 12 — PUT /profile/update (update bio + preference)
app.put('/profile/update', function(req, res) {
  var studentId  = req.body.studentId;
  var bio        = req.body.bio;
  var preference = req.body.preference;

  db.query('UPDATE students SET bio = ?, preference = ? WHERE id = ?', [bio, preference, studentId], function(err) {
    if (err) return res.status(500).json({ success: false, error: err.message });
    res.json({ success: true });
  });
});

// ROUTE 13 — POST /profile/preferences
app.post('/profile/preferences', function(req, res) {
  var studentId  = req.body.studentId;
  var preference = req.body.preference;

  if (!studentId || !preference) return res.status(400).json({ success: false, error: 'Missing fields' });

  db.query('INSERT INTO student_preferences (student_id, preference) VALUES (?, ?)', [studentId, preference], function(err) {
    if (err) return res.status(500).json({ success: false, error: err.message });
    res.json({ success: true });
  });
});

// ROUTE 14 — DELETE /profile/preferences
app.delete('/profile/preferences', function(req, res) {
  var studentId  = req.body.studentId;
  var preference = req.body.preference;

  db.query('DELETE FROM student_preferences WHERE student_id = ? AND preference = ?', [studentId, preference], function(err) {
    if (err) return res.status(500).json({ success: false, error: err.message });
    res.json({ success: true });
  });
});

// ROUTE 15 — POST /admin/login
app.post('/admin/login', function(req, res) {
  var username = req.body.username;
  var password = req.body.password;

  // Hardcoded admin credentials for now
  if (username === 'admin' && password === 'admin123') {
    res.json({ success: true });
  } else {
    res.status(401).json({ success: false, error: 'Invalid admin credentials' });
  }
});

// ROUTE 16 — POST /admin/jobs (post new job)
app.post('/admin/jobs', function(req, res) {
  var b = req.body;
  var sql = 'INSERT INTO jobs (title, company, type, tag, location, ctc, min_cgpa, required_skills, description, deadline) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)';
  db.query(sql, [b.title, b.company, b.type, b.tag, b.location, b.ctc, b.min_cgpa, b.required_skills, b.description, b.deadline || null], function(err, result) {
    if (err) return res.status(500).json({ success: false, error: err.message });
    res.json({ success: true, jobId: result.insertId });
  });
});

// ROUTE 17 — DELETE /admin/jobs/:id
app.delete('/admin/jobs/:id', function(req, res) {
  db.query('DELETE FROM jobs WHERE id = ?', [req.params.id], function(err) {
    if (err) return res.status(500).json({ success: false, error: err.message });
    res.json({ success: true });
  });
});

// ROUTE 18 — GET /admin/applicants/:jobId
app.get('/admin/applicants/:jobId', function(req, res) {
  var sql = `
    SELECT students.id, students.name, students.email, students.department, students.cgpa, applications.applied_at
    FROM applications
    JOIN students ON applications.student_id = students.id
    WHERE applications.job_id = ?
    ORDER BY applications.applied_at DESC
  `;
  db.query(sql, [req.params.jobId], function(err, results) {
    if (err) return res.status(500).json({ success: false, error: err.message });
    res.json({ success: true, applicants: results });
  });
});

// ROUTE 19 — GET /admin/students
app.get('/admin/students', function(req, res) {
  db.query('SELECT id, name, email, department, cgpa, year FROM students ORDER BY name', function(err, results) {
    if (err) return res.status(500).json({ success: false, error: err.message });
    res.json({ success: true, students: results });
  });
});

// ROUTE 20 — GET /companies
app.get('/companies', function(req, res) {
  db.query('SELECT * FROM companies ORDER BY name', function(err, results) {
    if (err) return res.status(500).json({ success: false, error: err.message });
    res.json({ success: true, companies: results });
  });
});

// ROUTE 21 — GET /companies/:id
app.get('/companies/:id', function(req, res) {
  db.query('SELECT * FROM companies WHERE id = ?', [req.params.id], function(err, companies) {
    if (err) return res.status(500).json({ success: false, error: err.message });
    if (companies.length === 0) return res.status(404).json({ success: false, error: 'Company not found' });

    db.query('SELECT * FROM jobs WHERE company_id = ?', [req.params.id], function(err, jobs) {
      if (err) return res.status(500).json({ success: false, error: err.message });
      res.json({ success: true, company: companies[0], jobs: jobs });
    });
  });
});

// ROUTE 22 — POST /admin/companies (super admin creates a company + admin account)
app.post('/admin/companies', function(req, res) {
  var name      = req.body.name;
  var industry  = req.body.industry;
  var desc      = req.body.description;
  var website   = req.body.website;
  var emoji     = req.body.logo_emoji || '🏢';
  var username  = req.body.username;
  var password  = req.body.password;

  if (!name || !username || !password) {
    return res.status(400).json({ success: false, error: 'Name, username and password are required' });
  }

  // Insert company first
  db.query(
    'INSERT INTO companies (name, industry, description, website, logo_emoji) VALUES (?, ?, ?, ?, ?)',
    [name, industry, desc, website, emoji],
    function(err, result) {
      if (err) {
        if (err.errno === 1062) return res.status(400).json({ success: false, error: 'Company already exists' });
        return res.status(500).json({ success: false, error: err.message });
      }

      var companyId = result.insertId;

      // Then create admin account for that company
      db.query(
        'INSERT INTO company_admins (company_id, username, password) VALUES (?, ?, ?)',
        [companyId, username, password],
        function(err) {
          if (err) {
            if (err.errno === 1062) return res.status(400).json({ success: false, error: 'Username already taken' });
            return res.status(500).json({ success: false, error: err.message });
          }
          res.json({ success: true, companyId: companyId });
        }
      );
    }
  );
});

// ROUTE 23 — POST /admin/company-login
app.post('/admin/company-login', function(req, res) {
  var username = req.body.username;
  var password = req.body.password;

  db.query(
    'SELECT company_admins.*, companies.name as company_name, companies.id as company_id FROM company_admins JOIN companies ON company_admins.company_id = companies.id WHERE username = ? AND password = ?',
    [username, password],
    function(err, results) {
      if (err) return res.status(500).json({ success: false, error: err.message });
      if (results.length === 0) return res.status(401).json({ success: false, error: 'Invalid credentials' });

      res.json({
        success: true,
        admin: {
          id:           results[0].id,
          username:     results[0].username,
          companyId:    results[0].company_id,
          companyName:  results[0].company_name
        }
      });
    }
  );
});

// ROUTE 24 — POST /admin/company-jobs
app.post('/admin/company-jobs', function(req, res) {
  var b = req.body;
  if (!b.company_id) return res.status(400).json({ success: false, error: 'Missing company_id' });

  db.query('SELECT name FROM companies WHERE id = ?', [b.company_id], function(err, companies) {
    if (err) return res.status(500).json({ success: false, error: err.message });
    if (companies.length === 0) return res.status(404).json({ success: false, error: 'Company not found' });

    var sql = 'INSERT INTO jobs (title, company, company_id, type, tag, location, ctc, min_cgpa, required_skills, description, deadline) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)';
    db.query(sql,
      [b.title, companies[0].name, b.company_id, b.type, b.tag, b.location, b.ctc, b.min_cgpa, b.required_skills, b.description, b.deadline || null],
      function(err, result) {
        if (err) return res.status(500).json({ success: false, error: err.message });
        res.json({ success: true, jobId: result.insertId });
      }
    );
  });
});

// ROUTE 25 — GET /admin/company-jobs/:companyId (get only that company's jobs)
app.get('/admin/company-jobs/:companyId', function(req, res) {
  db.query('SELECT * FROM jobs WHERE company_id = ?', [req.params.companyId], function(err, results) {
    if (err) return res.status(500).json({ success: false, error: err.message });
    res.json({ success: true, jobs: results });
  });
});

// ROUTE 26 — GET /admin/company-applicants/:jobId/:companyId (verify job belongs to company)
app.get('/admin/company-applicants/:jobId/:companyId', function(req, res) {
  // First verify this job belongs to this company
  db.query(
    'SELECT id FROM jobs WHERE id = ? AND company_id = ?',
    [req.params.jobId, req.params.companyId],
    function(err, jobs) {
      if (err) return res.status(500).json({ success: false, error: err.message });
      if (jobs.length === 0) return res.status(403).json({ success: false, error: 'Access denied' });

      var sql = `
        SELECT students.id, students.name, students.email, students.department, students.cgpa, applications.applied_at
        FROM applications
        JOIN students ON applications.student_id = students.id
        WHERE applications.job_id = ?
        ORDER BY applications.applied_at DESC
      `;
      db.query(sql, [req.params.jobId], function(err, results) {
        if (err) return res.status(500).json({ success: false, error: err.message });
        res.json({ success: true, applicants: results });
      });
    }
  );
});

// ROUTE 27 — PUT /admin/company-profile
app.put('/admin/company-profile', function(req, res) {
  var b = req.body;
  if (!b.company_id) return res.status(400).json({ success: false, error: 'Missing company_id' });

  var sql = `UPDATE companies SET 
    description   = ?,
    tagline       = ?,
    headquarters  = ?,
    founded_year  = ?,
    employee_count = ?,
    website       = ?,
    linkedin_url  = ?,
    logo_emoji    = ?
    WHERE id = ?`;

  db.query(sql, [
    b.description, b.tagline, b.headquarters,
    b.founded_year, b.employee_count, b.website,
    b.linkedin_url, b.logo_emoji, b.company_id
  ], function(err) {
    if (err) return res.status(500).json({ success: false, error: err.message });
    res.json({ success: true });
  });
});

// ROUTE 28 — GET /admin/company-profile/:companyId
app.get('/admin/company-profile/:companyId', function(req, res) {
  db.query('SELECT * FROM companies WHERE id = ?', [req.params.companyId], function(err, results) {
    if (err) return res.status(500).json({ success: false, error: err.message });
    if (results.length === 0) return res.status(404).json({ success: false, error: 'Not found' });
    res.json({ success: true, company: results[0] });
  });
});

app.listen(3000, function() {
  console.log('PlaceIt server running at http://localhost:3000');
});