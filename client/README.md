# TaskFlow — Team Task Manager

A full-stack team task management app with role-based access control.

## ✨ Features
- JWT Authentication (Signup/Login)
- Role-based access control (Admin/Member)
- Create and manage projects with team members
- Kanban board (To Do → In Progress → Review → Done)
- Task assignment, priorities, due dates
- Comments on tasks
- Dashboard with stats and overdue tracking
- Overdue task warnings

## 🛠 Tech Stack
**Backend:** Node.js, Express, SQLite (sql.js), JWT, bcrypt  
**Frontend:** React, Vite, React Router, Axios

## 🚀 Local Setup

**1. Clone the repo**
```bash
git clone https://github.com/divyajadhav9705/taskflow
cd taskflow
```

**2. Start the backend**
```bash
cd server
npm install
node index.js
```
Server runs on http://localhost:3001

**3. Start the frontend**
```bash
cd client
npm install
npm run dev
```
App runs on http://localhost:5173

## 📡 API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | /api/auth/signup | Register new user |
| POST | /api/auth/login | Login |
| GET | /api/auth/me | Get current user |
| GET | /api/projects | List all projects |
| POST | /api/projects | Create project |
| GET | /api/projects/:id | Get project details |
| DELETE | /api/projects/:id | Delete project |
| POST | /api/projects/:id/members | Add member |
| GET | /api/tasks | List tasks |
| POST | /api/tasks | Create task |
| PUT | /api/tasks/:id | Update task |
| DELETE | /api/tasks/:id | Delete task |
| GET | /api/tasks/dashboard | Get dashboard stats |
| POST | /api/tasks/:id/comments | Add comment |

## 👥 Roles
- **Admin** — Can create projects, manage members, create and delete any task
- **Member** — Can view projects they are added to, create and update tasks

## 🗄 Database
SQLite via sql.js. Tables: `users`, `projects`, `project_members`, `tasks`, `task_comments`

## 📁 Project Structure
```
taskflow/
├── server/
│   ├── routes/
│   │   ├── auth.js
│   │   ├── projects.js
│   │   ├── tasks.js
│   │   └── users.js
│   ├── db.js
│   ├── middleware.js
│   └── index.js
└── client/
    ├── src/
    │   ├── context/
    │   ├── components/
    │   ├── pages/
    │   ├── App.jsx
    │   └── api.js
    └── index.html
```
