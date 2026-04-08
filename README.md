# 🚀 Smart Internal Operations System (SmartOps)

A premium, scalable MERN stack application designed to streamline internal operations, track task accountability, and provide real-time workflow visibility.

![Dashboard Preview](https://img.shields.io/badge/Status-Live-success)
![React](https://img.shields.io/badge/Frontend-React-61DAFB?logo=react)
![Nodejs](https://img.shields.io/badge/Backend-Node.js-339933?logo=node.js)
![MongoDB](https://img.shields.io/badge/Database-MongoDB-47A248?logo=mongodb)

---

## ✨ Features

### 📊 Intelligent Dashboard
- **Real-time Stats**: Track total tasks, pending approvals, completed milestones, and team efficiency.
- **Dynamic Charts**: Visualize task distribution by priority and team performance over time.
- **Activity Stream**: A living log of all critical actions taken across the system.

### 📋 Optimized Task Management
- **Multi-View System**: Toggle between a **High-Performance Table** view and a **Productive Kanban Board**.
- **Mobile-First Design**: Fully responsive card-based layout for mobile users with native snap-scrolling.
- **Detailed Tracking**: Rich task detail view including project association, tags, and progress logs.

### 🏗️ Project & Team Governance
- **Role-Based Access (RBAC)**: Secure access levels for Admins, Managers, and Staff.
- **Project Tracking**: Group tasks by projects with distinct visual identifiers (colors/icons).

---

## 🛠️ Tech Stack

- **Frontend**: React 18, React Router 6, React Query (TanStack), Recharts, Canvas Confetti.
- **Backend**: Node.js, Express, MongoDB (Mongoose).
- **Security**: JWT Authentication, Helmet, Express Rate Limit, BcryptJS.
- **Design**: Vanilla CSS with a custom-engineered modern dark design system.

---

## 🚀 Quick Start

### Prerequisites
- Node.js (v18+)
- MongoDB (Local or Atlas)

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/sameer0288/smart-ops.git
   cd smart-ops
   ```

2. **Backend Setup**
   ```bash
   cd backend
   npm install
   cp .env.example .env  # Update with your MONGO_URI and JWT_SECRET
   npm run seed          # Populate initial demo data
   npm start
   ```

3. **Frontend Setup**
   ```bash
   cd ../frontend
   npm install
   cp .env.example .env  # Update with your Backend URL
   npm start
   ```

---

## 📧 Demo Credentials

| Role | Email | Password |
| :--- | :--- | :--- |
| **Admin** | `admin@smartops.com` | `Admin@123` |
| **Manager** | `manager@smartops.com` | `Manager@123` |
| **User** | `sarah@smartops.com` | `User@123` |

---

## 🌐 Deployment

- **Backend**: Hosted on [Render](https://render.com)
- **Frontend**: Deployed on [Vercel](https://vercel.com)
- **Database**: [MongoDB Atlas](https://mongodb.com/atlas)

---

## 👨‍💻 Developer
**Sameer Ali** - Full Stack Product Engineer

---

*Built for efficiency. Designed for humans.*
