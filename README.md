# Placed — Student Placement Portal

A full-stack student placement portal. Students can register, browse job listings, and apply to placement drives (we plan to add a placement prep section as well).

---

## Tech Stack

- **Frontend** — HTML, CSS, Vanilla JS (single page, no frameworks)
- **Backend** — Node.js + Express
- **Database** — MySQL

---

## Features

- Student register and login
- Browse job listings from the database
- Filter jobs by category (Tech, Finance, Core, Consulting) and type (Full-time / Internship)
- Search jobs by role or company name
- Apply to jobs — applications are saved to the database
- Responsive design — works on mobile and tablet
- Student profile dashboard showing CGPA and application count

---

## Project Structure

```
placed/
├── index.html        # Frontend — all pages in one file
├── server.js         # Backend — Express server with all API routes
├── db.js             # MySQL connection
├── db_setup.sql      # Database schema + dummy data
├── package.json      # Dependencies
├── .env.example      # Environment variable template
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

Open `index.html` in your browser. That's it!

---

## API Routes

| Method | Route | Description |
|--------|-------|-------------|
| GET | `/jobs` | Get all job listings |
| POST | `/register` | Register a new student |
| POST | `/login` | Student login |
| POST | `/apply` | Apply to a job |
| GET | `/applications/:studentId` | Get all applications for a student |

---

## Planned Improvements / Need to work on DEFINITELY

- Password hashing with bcrypt
- Session persistence (stay logged in on refresh)
- Admin dashboard for managing job listings
- Recruiter login — companies can post drives directly
- Email notifications for new placement drives
- Qualification/Criteria Matching + Recommendations on that basis
- More elaborate and editable account page for student (more like linkedin)

---
