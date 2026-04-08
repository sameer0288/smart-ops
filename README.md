# ⚡ SmartOps — Smart Internal Operations System

A full-stack MERN application for managing tasks, projects, team operations with role-based access control, real-time notifications, and rich analytics.

---

## 🚀 Live Features

- **JWT Authentication** — Secure login/register with token-based auth
- **3-Tier RBAC** — Admin, Manager, User with granular permissions
- **Task Management** — Full CRUD with Kanban board & list view
- **Project Management** — Projects with members, progress tracking, budgets
- **Activity Audit Log** — Every action tracked with full history
- **Real-time Notifications** — In-app alerts for assignments, comments, mentions
- **Threaded Comments** — Collaboration on tasks with @mentions
- **Dashboard Analytics** — Charts, trends, top performers, workload distribution
- **Smart Auto-Priority** *(invented feature)* — Task priority escalation tracking
- **Status History** — Every status change recorded with timestamp & author

---

## 🛠️ Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 18, React Router v6, React Query |
| Styling | Vanilla CSS (custom dark theme) |
| Charts | Recharts |
| Forms | React Hook Form |
| Backend | Node.js, Express.js |
| Database | MongoDB, Mongoose |
| Auth | JWT, bcryptjs |
| Security | Helmet, CORS, Rate Limiting |

---

## 📋 Prerequisites

- Node.js v18+
- MongoDB (local or Atlas)
- npm or yarn

---

## ⚡ Quick Start

### 1. Clone / Setup

```bash
cd assignment
```

### 2. Backend Setup

```bash
cd backend
npm install

# Edit .env with your MongoDB URI (already configured for localhost)
# Default: mongodb://localhost:27017/smart-ops

# Start backend
npm run dev
```

### 3. Seed Database (Demo Data)

```bash
cd backend
npm run seed
```

### 4. Frontend Setup

```bash
cd frontend
npm install
npm start
```

App opens at **http://localhost:3000**

---

## 🔑 Demo Accounts

| Role | Email | Password |
|---|---|---|
| 👑 Admin | admin@smartops.com | Admin@123 |
| 🔷 Manager | manager@smartops.com | Manager@123 |
| 👤 User | sarah@smartops.com | User@123 |

> 💡 The login page has **Quick Login** buttons to auto-fill credentials!

---

## 🌐 API Endpoints

| Method | Endpoint | Description | Access |
|---|---|---|---|
| POST | `/api/auth/register` | Register | Public |
| POST | `/api/auth/login` | Login | Public |
| GET | `/api/auth/me` | Current user | Auth |
| PUT | `/api/auth/profile` | Update profile | Auth |
| PUT | `/api/auth/password` | Change password | Auth |
| GET | `/api/tasks` | List tasks (filtered) | Auth |
| POST | `/api/tasks` | Create task | Auth |
| GET | `/api/tasks/:id` | Task detail | Auth |
| PUT | `/api/tasks/:id` | Update task | Auth |
| DELETE | `/api/tasks/:id` | Archive task | Manager+ |
| PUT | `/api/tasks/bulk` | Bulk update | Manager+ |
| GET | `/api/tasks/stats` | Task statistics | Auth |
| GET | `/api/projects` | List projects | Auth |
| POST | `/api/projects` | Create project | Manager+ |
| GET | `/api/projects/:id` | Project detail | Auth |
| PUT | `/api/projects/:id` | Update project | Manager+ |
| DELETE | `/api/projects/:id` | Archive project | Admin |
| POST | `/api/projects/:id/members` | Add member | Manager+ |
| DELETE | `/api/projects/:id/members/:userId` | Remove member | Manager+ |
| GET | `/api/users` | List users | Manager+ |
| POST | `/api/users` | Create user | Admin |
| PUT | `/api/users/:id` | Update user | Admin |
| DELETE | `/api/users/:id` | Deactivate user | Admin |
| GET | `/api/users/:id/workload` | User workload | Manager+ |
| GET | `/api/dashboard` | Dashboard data | Auth |
| GET | `/api/dashboard/workload` | Team workload | Manager+ |
| GET | `/api/activity` | Activity log | Auth |
| GET | `/api/activity/stats` | Activity stats | Manager+ |
| GET | `/api/notifications` | Notifications | Auth |
| PUT | `/api/notifications/read-all` | Mark all read | Auth |
| GET | `/api/comments/task/:id` | Task comments | Auth |
| POST | `/api/comments` | Add comment | Auth |
| PUT | `/api/comments/:id` | Edit comment | Auth (owner) |
| DELETE | `/api/comments/:id` | Delete comment | Auth (owner/admin) |

---

## 🏗️ Project Structure

```
assignment/
├── backend/
│   ├── controllers/      # Business logic
│   │   ├── authController.js
│   │   ├── taskController.js
│   │   ├── projectController.js
│   │   ├── userController.js
│   │   ├── dashboardController.js
│   │   ├── activityController.js
│   │   ├── notificationController.js
│   │   └── commentController.js
│   ├── middleware/       # Auth, validation
│   ├── models/           # Mongoose schemas
│   │   ├── User.js
│   │   ├── Task.js
│   │   ├── Project.js
│   │   ├── Activity.js
│   │   ├── Notification.js
│   │   └── Comment.js
│   ├── routes/           # Express routers
│   ├── scripts/          # Seed script
│   └── server.js
├── frontend/
│   └── src/
│       ├── components/   # Reusable components
│       │   ├── layout/   # Sidebar, Topbar, AppLayout
│       │   └── tasks/    # TaskModal
│       ├── context/      # AuthContext
│       ├── pages/        # Route pages
│       │   ├── Dashboard.js
│       │   ├── Tasks.js
│       │   ├── TaskDetail.js
│       │   ├── Projects.js
│       │   ├── ProjectDetail.js
│       │   ├── Users.js
│       │   ├── ActivityLog.js
│       │   └── Profile.js
│       ├── utils/        # API client
│       └── App.js
├── README.md
└── ENGINEERING_DECISIONS.md
```

---

## 🔒 Security Features

- JWT tokens with expiry (7 days)
- Password hashing with bcryptjs (12 rounds)
- Rate limiting (100 req/15min)
- Helmet security headers
- Input validation with express-validator
- Role-based route protection
- Soft deletes (archive, not destroy)

---

## 📦 Deployment

### Backend (e.g., Railway/Render)

```bash
# Set environment variables:
PORT=5000
MONGO_URI=mongodb+srv://...
JWT_SECRET=your_secret_key
NODE_ENV=production
CLIENT_URL=https://your-frontend.com
```

### Frontend (e.g., Vercel/Netlify)

```bash
# Set environment variable:
REACT_APP_API_URL=https://your-backend.com/api

npm run build
```
