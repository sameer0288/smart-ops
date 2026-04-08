# Engineering Decision Document
## SmartOps — Smart Internal Operations System

---

## 1. System Architecture

### Overview
SmartOps follows a **3-tier architecture**:

```
Client (React SPA)  →  REST API (Express.js)  →  Database (MongoDB)
```

### Component Interaction

```
┌─────────────────────────────────────────────────────┐
│                   Frontend (React)                   │
│  - React Router (routing)                           │
│  - React Query (server state + caching)             │
│  - AuthContext (JWT management)                     │
│  - Recharts (data visualization)                    │
└─────────────────┬───────────────────────────────────┘
                  │ HTTPS REST API
┌─────────────────▼───────────────────────────────────┐
│               Backend (Express.js)                   │
│  - auth middleware (JWT verify)                     │
│  - authorize middleware (RBAC)                      │
│  - express-validator (input validation)             │
│  - rate limiting (DDoS protection)                  │
│  - helmet (security headers)                        │
│  Controllers: auth│task│project│user│dashboard      │
│               activity│notification│comment         │
└─────────────────┬───────────────────────────────────┘
                  │ Mongoose ODM
┌─────────────────▼───────────────────────────────────┐
│                MongoDB (Document DB)                 │
│  Collections: Users│Tasks│Projects│Activities       │
│               Notifications│Comments                │
│  Indexes on: status, assignee, project, createdAt   │
└─────────────────────────────────────────────────────┘
```

### Key Design Decisions

**Stateless Backend**: JWT-based auth means no server-side sessions. Scales horizontally without sticky sessions.

**React Query for Caching**: Instead of Redux, we use React Query for server state. This gives us automatic cache invalidation, background refetching, and loading states without boilerplate.

**Soft Deletes**: Tasks and projects are archived (isArchived: true) not hard deleted. This preserves data integrity and allows recovery.

---

## 2. Database Design

### Entity Relationship Diagram

```
User ──────────── Task
 │      creates     │
 │      assignee    │
 │                  │
 └──── Project ─────┘
 │       has        │
 │     members      │
 │                  │
 └── Activity ──────┘
       tracks       │
                    │
 Notification ──────┘
    (alerts)

 Comment ── Task
   (on)
```

### Schema Design Choices

#### User Schema
- `role`: enum ['admin', 'manager', 'user'] — simple RBAC
- `isActive`: soft disable without deletion
- `lastLogin`: analytics and security monitoring
- JWT generated as instance method for encapsulation

#### Task Schema
- `statusHistory`: embedded array (not separate collection) — keeps related data together, avoids joins
- `dependencies`: self-referential many-to-many via array of ObjectIds
- Virtual `isOverdue` computed field — not stored, always accurate
- Compound indexes: `{status, priority}`, `{assignee, status}` for common queries

#### Activity Schema
- Append-only audit log (never updated or deleted)
- Flexible `details: Mixed` field for action-specific metadata
- IP + User-Agent captured for security audit

#### Project Schema
- Members embedded as `[{user, role, addedAt}]` — project teams are small, no separate join collection needed
- Virtual `tasks` for convenience, but we query directly for performance

---

## 3. Key Technical Decisions

### 3.1 RBAC Implementation

**Decision**: Role-checked at middleware layer, not controller layer.

```javascript
// Middleware enforces role BEFORE controller runs
router.delete('/:id', authorize('admin', 'manager'), deleteTask);
```

**Alternative considered**: Column-level permissions with a permissions table.  
**Why rejected**: Over-engineered for 3 roles. The enum approach is clear, fast, and sufficient.

### 3.2 Activity Logging Strategy

**Decision**: Log in controller after successful operations (not middleware).

**Approach**: Each controller explicitly creates Activity documents on success. This gives:
- Fine-grained control over what to log
- Context-specific detail fields
- No silent failures (if logging fails, we catch and swallow)

**Alternative**: Database change streams (MongoDB Change Streams).  
**Why rejected**: Requires MongoDB Replica Set for change streams. Too complex for current scale.

### 3.3 Notifications

**Decision**: Pull-based notifications via polling (not WebSockets).

**Why**: WebSockets require additional infrastructure (Socket.io), CORS complexity, and connection management. For a team app where delays of 30 seconds are acceptable, polling every 30 seconds works fine.

**When to upgrade**: When the team exceeds 50 users and real-time feels necessary.

### 3.4 Single REST API vs GraphQL

**Decision**: REST API with consistent response envelope `{success, data, pagination}`.

**Why REST**: Simpler implementation, better HTTP caching, easier Postman collection, team familiarity. GraphQL would benefit if clients had wildly different data requirements.

### 3.5 MongoDB vs PostgreSQL

**Decision**: MongoDB (document model).

**Why MongoDB**:
- Task metadata is variable (different fields per task type)
- Activity log's `details: Mixed` field benefits from flexible schema
- Status history naturally embeds in task document
- Team is likely familiar with JS/JSON ecosystem

**Trade-off**: No ACID transactions across collections. Mitigated by keeping related data in same document where possible (statusHistory in Task).

---

## 4. Trade-offs

| Decision | Benefit | Cost |
|---|---|---|
| JWT (stateless) | Horizontal scaling | Can't invalidate individual tokens (logout is client-side only) |
| Polling for notifications | Simple infrastructure | 30s delay, slightly higher DB load |
| Embedded status history | Fast reads, no joins | Task documents grow over time |
| Soft deletes | Data recovery, audit trail | Need to filter `isArchived: false` everywhere |
| React Query over Redux | Less boilerplate, auto-cache | Less predictable with complex cross-feature state |
| MongoDB over PostgreSQL | Flexible schema, fast iteration | No complex joins, potential data inconsistency |

---

## 5. Invented Feature: Smart Priority Escalation Tracking

### What it is
Tasks have `priorityEscalated` and `escalatedAt` fields that track when a task's priority has been bumped up (e.g., low → critical). Combined with the status history, this creates a full audit of why a task became urgent.

### Why I built it
In real startups, "fire drills" are common — tasks suddenly become critical because a client complains or a bug hits production. Without tracking this, teams lose visibility into how often this happens and which users/areas generate the most escalations.

### Problem it solves
- **Accountability**: Who escalated what, when
- **Pattern detection**: Identify which project areas produce the most critical escalations
- **Estimation accuracy**: If a task is frequently re-prioritized, it signals unclear requirements

### Implementation
```javascript
// Task model
priorityEscalated: { type: Boolean, default: false },
escalatedAt: { type: Date, default: null }

// Task controller - on priority change
if (priority && priority !== oldPriority) {
  const priorityOrder = { low: 0, medium: 1, high: 2, critical: 3 };
  if (priorityOrder[priority] > priorityOrder[oldPriority]) {
    updateData.priorityEscalated = true;
    updateData.escalatedAt = new Date();
  }
}
```

---

## 6. Scope Decisions

### What I Built
1. ✅ JWT authentication with role-based access
2. ✅ 3-tier RBAC (Admin, Manager, User)
3. ✅ Full task management (CRUD + Kanban + filters)
4. ✅ Project management with member roles
5. ✅ Activity audit log (full history)
6. ✅ In-app notifications with read/unread tracking
7. ✅ Comment system with threaded replies and mentions
8. ✅ Dashboard analytics with multiple chart types
9. ✅ Team workload distribution
10. ✅ Top performers tracking
11. ✅ Status history per task
12. ✅ Bulk task updates
13. ✅ User workload view
14. ✅ Profile management + password change
15. ✅ Search and multi-filter on all lists

### What I Intentionally Did NOT Build

**Real-time WebSockets**: Would require Socket.io, connection management, and additional infrastructure. The polling approach handles the use case without complexity overhead.

**Email notifications**: Requires SMTP setup (SendGrid/Nodemailer). Out of scope for local development. Architecture supports it — just needs a service added.

**File attachments**: Multer is installed as a dependency, model has `attachments` field, but the actual upload endpoint was not built. Requires cloud storage (S3/Cloudinary) for production.

**Calendar view**: Time-intensive frontend component. The due date filtering and upcoming tasks widget covers the core need.

**Time tracking timer**: The model supports `estimatedHours` and `actualHours` but no live stopwatch UI. Manual entry works for now.

**Advanced reporting**: No export to CSV/PDF. Would add value but limited time.

---

## 7. Scaling Strategy

### Current State
Single server, single MongoDB instance. Works well up to ~500 concurrent users.

### What Will Break First at 10,000+ Users

**1. The Activity Log collection** — Every action writes a document. At 10k users doing 50 actions/day = 500k writes/day. MongoDB handles this, but queries slow down without better indexing and archival strategy.

**2. Notification polling** — 10k users polling every 30s = 333 requests/second just for notification checks. DB gets hammered.

**3. Single Express server** — No horizontal scaling, no request queue.

**4. Dashboard aggregation queries** — Full collection scans on large datasets.

### How to Fix

```
Phase 1 (500-2,000 users):
- Add Redis for notification caching (unread count in Redis, not DB)
- Add MongoDB Atlas with proper indexes
- Add server clustering (PM2 cluster mode)

Phase 2 (2,000-10,000 users):
- Replace polling with WebSocket (Socket.io + Redis adapter)
- Cache dashboard queries in Redis (5-min TTL)
- Separate read/write MongoDB instances
- CDN for static assets

Phase 3 (10,000+ users):
- Microservices: separate Notification service, Activity service
- Message queue (AWS SQS or RabbitMQ) for activity logging
- Elasticsearch for search across tasks/projects
- Time-series DB for analytics (InfluxDB or TimescaleDB)
- MongoDB sharding for horizontal DB scaling
```

---

## 8. Future Improvements (With 2 More Days)

1. **WebSocket Integration**: Real-time notifications instead of polling. Would require Socket.io on backend and a connection manager with Redis pub/sub for multi-server setups.

2. **Advanced Search with Elasticsearch**: Full-text search across tasks/comments. MongoDB's text search is limited; Elasticsearch would enable "find tasks where someone mentioned 'breaking change' in comments."

3. **Email Notifications**: Critical for teams not always logged in. Would add Nodemailer + an email queue (Bull.js) with retry logic.

4. **Task Dependencies Visualization**: A dependency graph showing which tasks block others (like Jira's dependency view). The data model already supports it.

5. **Sprint Planning**: Group tasks into sprints with a dedicated sprint board. Allows velocity tracking across sprints.

6. **Time Tracking Timer**: Live stopwatch on task detail page that auto-populates `actualHours`. Integration with Toggl API for teams already using time tracking.

7. **Gantt Chart**: Project timeline visualization using a library like Gantt-elastic. The `startDate` and `endDate` data is already there.

8. **Webhook System**: Allow external integrations — post to Slack when tasks are completed, update Jira when status changes, etc.

---

## 9. API Design Philosophy

All API responses follow a consistent envelope:

```json
{
  "success": true,
  "data": { ... },
  "message": "Operation successful",
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 145,
    "pages": 15
  }
}
```

Error responses:
```json
{
  "success": false,
  "message": "Descriptive error message",
  "errors": [
    { "field": "email", "message": "Valid email required" }
  ]
}
```

HTTP status codes used semantically:
- `200` — Success
- `201` — Created
- `400` — Validation error
- `401` — Not authenticated
- `403` — Not authorized (wrong role)
- `404` — Resource not found
- `429` — Rate limited
- `500` — Server error
