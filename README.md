# HRMS Lite

A lightweight Human Resource Management System that allows an admin to manage employee records and track daily attendance. Built as a full-stack web application with a clean, professional interface.

---

## Project Overview

HRMS Lite is a basic internal HR tool focused on:

- **Employee Management** — Add employees (unique ID, full name, email, department), view all employees, and delete employees.
- **Attendance Management** — Mark attendance (date, status: Present/Absent) per employee and view attendance records, with optional filter by employee.

The app assumes a single admin user; no authentication is required. Leave management, payroll, and advanced HR features are out of scope.

---

## Tech Stack

| Layer      | Technology |
|-----------|------------|
| **Frontend** | React 18, TypeScript, Vite, React Router, TanStack Query, shadcn/ui, Tailwind CSS |
| **Backend**  | Python 3.11+, FastAPI, Pydantic |
| **Database** | Supabase (PostgreSQL) |
| **Deployment** | Vercel (frontend), Render (backend) |

---

## Steps to Run the Project Locally

### Prerequisites

- Node.js 18+ and npm
- Python 3.11+
- A Supabase project ([supabase.com](https://supabase.com))

### 1. Database (Supabase)

1. Create a project on Supabase and get your project URL and anon/service key.
2. In the Supabase SQL Editor, run:

```sql
CREATE TYPE attendance_status AS ENUM ('Present', 'Absent');

CREATE TABLE employees (
  id VARCHAR PRIMARY KEY,
  full_name VARCHAR NOT NULL,
  email VARCHAR NOT NULL UNIQUE,
  department VARCHAR NOT NULL
);

CREATE TABLE attendances (
  id BIGSERIAL PRIMARY KEY,
  employee_id VARCHAR NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  status attendance_status NOT NULL
);
```

### 2. Backend

```bash
cd backend
python -m venv .venv
.venv\Scripts\activate          # Windows
# source .venv/bin/activate     # macOS/Linux
pip install -r requirements.txt
```

Create a `.env` file in `backend/`:

```
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_KEY=your-anon-or-service-role-key
```

Start the API:

```bash
uvicorn main:app --reload --port 8000
```

API docs: http://localhost:8000/docs

### 3. Frontend

```bash
cd frontend
npm install
```

Optional: create `frontend/.env` and set the backend URL (if not set, it defaults to `http://localhost:8000`):

```
VITE_API_URL=http://localhost:8000
```

Start the dev server:

```bash
npm run dev
```

Open the URL shown (e.g. http://localhost:8080).

---

## Deployment

- **Frontend** — Deployed on Vercel. Root directory set to `frontend`. Environment variable `VITE_API_URL` set to the live backend URL.
- **Backend** — Deployed on Render. Environment variables `SUPABASE_URL` and `SUPABASE_KEY` set in the Render dashboard.

---

## Submission Checklist

- **Live Application URL:** _(Add your Vercel frontend URL here)_
- **GitHub Repository Link:** _(Add your repository URL here)_

---

## Assumptions & Limitations

- **Single admin** — No login or role-based access; the app is intended for one internal admin.
- **Browser support** — Modern browsers (Chrome, Firefox, Safari, Edge) with JavaScript enabled.
- **Duplicate attendance** — The same employee can have multiple records per date unless a unique constraint is added in the database (optional).
- **Data scope** — No pagination on list endpoints; suitable for small to medium datasets.
- **No audit trail** — Deletions and updates are not logged for compliance.

---

## API Overview

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/employees` | List all employees |
| POST | `/api/employees` | Add employee (body: `id`, `full_name`, `email`, `department`) |
| DELETE | `/api/employees/{id}` | Delete employee |
| GET | `/api/attendance` | List attendance (optional query: `?employee_id=`) |
| GET | `/api/attendance/employee/{id}` | Attendance for one employee |
| POST | `/api/attendance` | Mark attendance (body: `employee_id`, `date`, `status`: Present/Absent) |

Validation includes required fields, valid email format, and duplicate employee ID/email handling. Errors return appropriate HTTP status codes and messages.
