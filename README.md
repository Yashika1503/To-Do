# Todo API

Minimal Node.js + Express + PostgreSQL + Redis backend with JWT authentication.

---

## Folder Structure

```
todo-api/
├── src/
│   ├── app.js                        # Entry point
│   ├── config/
│   │   ├── db.js                     # PostgreSQL pool
│   │   └── redis.js                  # Redis client
│   ├── controllers/
│   │   ├── auth.controller.js        # Register, login
│   │   └── todo.controller.js        # CRUD + cache
│   ├── middleware/
│   │   └── authenticate.js           # JWT guard
│   ├── models/
│   │   ├── user.model.js             # User SQL queries
│   │   └── todo.model.js             # Todo SQL queries
│   └── routes/
│       ├── auth.routes.js            # POST /auth/*
│       └── todo.routes.js            # /todos/* (protected)
├── sql/
│   └── schema.sql                    # DB schema
├── .env.example
├── .gitignore
├── package.json
└── README.md
```

---

## Prerequisites

- Node.js >= 18
- PostgreSQL >= 14
- Redis >= 7

---

## Step-by-Step Setup

### 1. Clone and install dependencies

```bash
git clone <your-repo>
cd todo-api
npm install
```

### 2. Configure environment variables

```bash
cp .env.example .env
```

Edit `.env` with your values:

```env
PORT=3000

DB_HOST=localhost
DB_PORT=5432
DB_NAME=todo_db
DB_USER=postgres
DB_PASSWORD=yourpassword

JWT_SECRET=your_super_secret_jwt_key_change_this
JWT_EXPIRES_IN=7d

REDIS_URL=redis://localhost:6379
```

### 3. Create the PostgreSQL database

```bash
psql -U postgres -c "CREATE DATABASE todo_db;"
```

### 4. Run the SQL schema

```bash
psql -U postgres -d todo_db -f sql/schema.sql
```

### 5. Ensure Redis is running

```bash
# macOS (Homebrew)
brew services start redis

# Ubuntu/Debian
sudo systemctl start redis-server

# Verify
redis-cli ping   # should return: PONG
```

### 6. Start the server

```bash
# Development (auto-reload)
npm run dev

# Production
npm start
```

Server runs at: `http://localhost:3000`

---

## API Reference

### Auth

#### POST /auth/register

```bash
curl -X POST http://localhost:3000/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email": "alice@example.com", "password": "secret123"}'
```

**Response 201:**
```json
{
  "user": { "id": 1, "email": "alice@example.com", "is_premium": false },
  "token": "eyJhbGciOiJIUzI1NiIs..."
}
```

---

#### POST /auth/login

```bash
curl -X POST http://localhost:3000/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "alice@example.com", "password": "secret123"}'
```

**Response 200:**
```json
{
  "user": { "id": 1, "email": "alice@example.com", "is_premium": false },
  "token": "eyJhbGciOiJIUzI1NiIs..."
}
```

---

### Todos (all require `Authorization: Bearer <token>`)

#### GET /todos

```bash
curl http://localhost:3000/todos \
  -H "Authorization: Bearer <token>"
```

**Response 200** (first call, from DB):
```json
{
  "todos": [
    { "id": 1, "user_id": 1, "title": "Buy groceries", "completed": false, "created_at": "..." }
  ],
  "cached": false
}
```

Second call returns `"cached": true` from Redis.

---

#### POST /todos

```bash
curl -X POST http://localhost:3000/todos \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{"title": "Buy groceries"}'
```

**Response 201:**
```json
{
  "todo": { "id": 1, "user_id": 1, "title": "Buy groceries", "completed": false, "created_at": "..." }
}
```

---

#### PATCH /todos/:id

Update title, completed, or both:

```bash
curl -X PATCH http://localhost:3000/todos/1 \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{"completed": true}'
```

**Response 200:**
```json
{
  "todo": { "id": 1, "user_id": 1, "title": "Buy groceries", "completed": true, "created_at": "..." }
}
```

---

#### DELETE /todos/:id

```bash
curl -X DELETE http://localhost:3000/todos/1 \
  -H "Authorization: Bearer <token>"
```

**Response 200:**
```json
{ "message": "Todo deleted" }
```

---

## Redis Caching Strategy

| Event         | Cache action                         |
|---------------|--------------------------------------|
| GET /todos    | Read from Redis → miss → query DB → write cache (60s TTL) |
| POST /todos   | Invalidate `todos:{userId}` key      |
| PATCH /todos  | Invalidate `todos:{userId}` key      |
| DELETE /todos | Invalidate `todos:{userId}` key      |

Cache is per-user (`todos:{userId}`) so users never see each other's data.

---

## Error Codes

| Code | Meaning                        |
|------|-------------------------------|
| 400  | Bad request / missing fields   |
| 401  | Unauthenticated / bad token    |
| 404  | Resource not found             |
| 409  | Email already registered       |
| 500  | Internal server error          |
