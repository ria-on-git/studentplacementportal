# Placed — Student Placement Portal

A full-stack student placement portal. Students can register, browse job listings, and apply to placement drives. Companies can post and manage jobs through a dedicated admin dashboard.

---

## Tech Stack

- **Frontend** — HTML, CSS, Vanilla JS (no frameworks)
- **Backend** — Node.js + Express
- **Database** — MySQL

---

## Features

- Student register and login
- Browse job listings fetched from the database
- Filter jobs by category (Tech, Finance, Core, Consulting) and type (Full-time / Internship)
- Search jobs by role or company name
- Apply to jobs — applications saved to the database
- Student profile dashboard showing CGPA and application count
- Admin portal with two roles:

  - Super Admin — manage all students, jobs, and applications
  - Company Admin — post jobs, view own listings, and see applicants

---

## Project Structure

```
placed/
├── index.html           # Student-facing frontend
├── admin-login.html     # Admin login page (Super Admin + Company Admin)
├── admin.html           # Super Admin dashboard
├── company-admin.html   # Company Admin dashboard
├── style.css            # Shared styles
├── server.js            # Express server — all API routes
├── db.js                # MySQL connection
├── db_setup.sql         # Database schema + seed data
├── package.json         # Dependencies
├── .env.example         # Environment variable template
└── .gitignore
```

---

### 1. Clone the repo
```bash
git clone https://github.com/yourusername/yourrepo.git
cd yourrepo
```

### 2. Install dependencies
```bash
npm install
```

### 3. Set up the database

Open MySQL and run the setup script:
```bash
mysql -u root -p < db_setup.sql
```
Or paste the contents of `db_setup.sql` into phpMyAdmin and run it.

### 4. Configure environment variables

Create a `.env` file in the project root:
```
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=yourpassword
DB_NAME=placementPortal
```

### 5. Start the server
```bash
node server.js
```

You should see:
```
PlaceIt server running at http://localhost:3000
Connected to MySQL!
```

### 6. Open the frontend

Open [index.html] (http://localhost:3000) in your browser for the student portal, or navigate to http://localhost:3000/admin-login.html for the admin panel.

---

## API Routes

| Method | Route | Description |
|--------|-------|-------------|
| GET | `/jobs` | Get all job listings |
| POST | `/register` | Register a new student |
| POST | `/login` | Student login |
| POST | `/apply` | Apply to a job |
| GET | `/applications/:studentId` | Get all applications for a student |
| POST | `/admin/login` | Super Admin login |
| POST | `/admin/company-login` | Company Admin login |
| GET | `/admin/company-jobs/:companyId` | Get jobs posted by a company |
| POST | `/admin/company-jobs` | Post a new job (company) |
| DELETE | `/admin/jobs/:id` | Delete a job listing | 
| GET | `/admin/company-applicants/:jobId/:companyId` | Get applicants for a company's job | 
---

## Planned Improvements 

**Student Portal**

- One-time user authentication via college email ID during registration
- Profile picture upload for student accounts
- Certification upload (students can attach proof of certifications to their profile)
- Job listing detail popup — expanded view with full description, requirements, and company info
- Company profile page — view company details on clicking a company name within a listing
- More sensitive eligibility/criteria matching
  

**Admin / Company Dashboard**

- Company Admin can upload and manage placement prep content (resources, tips, mock tests)
- Email notifications to students when their application is approved or declined
  
---
