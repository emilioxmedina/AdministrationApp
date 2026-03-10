# How to Run and Test the Project

This guide covers everything needed to get the Administration App up and running locally and manually test all its features.

---

## Prerequisites

- [Node.js](https://nodejs.org/) v18+
- [npm](https://www.npmjs.com/) v9+
- [Docker](https://www.docker.com/) and Docker Compose

---

## 1. Environment Setup

Copy the example env file and fill in your values (the defaults work for local dev):

```bash
cp .env.example .env
```

Key variables in `.env`:

| Variable              | Default value                          | Description                        |
|-----------------------|----------------------------------------|------------------------------------|
| `DB_HOST`             | `localhost`                            | MySQL host                         |
| `DB_PORT`             | `3306`                                 | MySQL port                         |
| `DB_NAME`             | `admin_app`                            | Database name                      |
| `DB_USER`             | `app_user`                             | Database user                      |
| `DB_PASSWORD`         | `app_password`                         | Database user password             |
| `DB_ROOT_PASSWORD`    | `root_password`                        | MySQL root password                |
| `JWT_SECRET`          | `change_me_to_a_long_random_secret`    | Secret for access tokens           |
| `JWT_REFRESH_SECRET`  | `change_me_to_another_long_random_secret` | Secret for refresh tokens       |
| `JWT_EXPIRES_IN`      | `15m`                                  | Access token TTL                   |
| `JWT_REFRESH_EXPIRES_IN` | `7d`                              | Refresh token TTL                  |
| `BACKEND_PORT`        | `3001`                                 | NestJS server port                 |
| `FRONTEND_URL`        | `http://localhost:3000`                | Allowed CORS origin                |

> **Security note:** Change `JWT_SECRET` and `JWT_REFRESH_SECRET` to long random strings before any real deployment.

---

## 2. Start the Database

The database and Adminer (a web-based DB browser) are managed with Docker Compose:

```bash
docker compose up -d
```

This starts:
- **MySQL 8** on port `3306` (or `DB_PORT`)
- **Adminer** on [http://localhost:8080](http://localhost:8080) — useful for inspecting tables

Wait for the database health check to pass before starting the backend (usually 10–20 seconds).

---

## 3. Start the Backend

```bash
cd backend
npm install
npm run start:dev
```

The backend will:
1. Connect to MySQL and **auto-sync the schema** (TypeORM `synchronize: true` in dev)
2. Listen on [http://localhost:3001/api](http://localhost:3001/api)

You should see:
```
Backend running on http://localhost:3001/api
```

---

## 4. Start the Frontend

Open a new terminal:

```bash
cd frontend
npm install
npm run dev
```

The frontend will be available at [http://localhost:3000](http://localhost:3000).

---

## 5. Manual API Testing

All API routes are prefixed with `/api`. Authentication uses **JWT access tokens** (passed in the `Authorization` header) and **HTTP-only refresh token cookies**.

### 5.1 Register a User

```bash
curl -X POST http://localhost:3001/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "username": "adminuser",
    "email": "admin@example.com",
    "password": "password123",
    "role": "admin"
  }'
```

> `role` is optional and defaults to `"viewer"`. Valid values: `"admin"`, `"viewer"`.

---

### 5.2 Login

```bash
curl -c cookies.txt -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@example.com",
    "password": "password123"
  }'
```

**Response:**
```json
{ "accessToken": "<JWT>" }
```

The refresh token is stored automatically as an HTTP-only cookie (`refresh_token`). Save the `accessToken` value — you'll use it in the `Authorization` header for protected requests.

```bash
export TOKEN="<paste accessToken here>"
```

---

### 5.3 Refresh the Access Token

```bash
curl -b cookies.txt -X POST http://localhost:3001/api/auth/refresh
```

Returns a new `accessToken`.

---

### 5.4 Logout

```bash
curl -b cookies.txt -X POST http://localhost:3001/api/auth/logout
```

Clears the refresh token cookie.

---

### 5.5 Employees

All users can read employees. Creating, updating, and deleting requires the `admin` role.

**List all employees:**
```bash
curl http://localhost:3001/api/employees \
  -H "Authorization: Bearer $TOKEN"
```

**Get one employee:**
```bash
curl http://localhost:3001/api/employees/1 \
  -H "Authorization: Bearer $TOKEN"
```

**Create an employee** *(admin only)*:
```bash
curl -X POST http://localhost:3001/api/employees \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "first_name": "Jane",
    "last_name": "Doe",
    "email": "jane.doe@example.com",
    "phone": "+1 555-0100"
  }'
```

> `phone` is optional.

**Update an employee** *(admin only)*:
```bash
curl -X PATCH http://localhost:3001/api/employees/1 \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{ "phone": "+1 555-9999" }'
```

**Delete an employee** *(admin only)*:
```bash
curl -X DELETE http://localhost:3001/api/employees/1 \
  -H "Authorization: Bearer $TOKEN"
```

---

### 5.6 Inventory

Same permission model as employees: reads are open to all authenticated users; writes require `admin`.

**List all items:**
```bash
curl http://localhost:3001/api/inventory \
  -H "Authorization: Bearer $TOKEN"
```

**Get one item:**
```bash
curl http://localhost:3001/api/inventory/1 \
  -H "Authorization: Bearer $TOKEN"
```

**Create an item** *(admin only)*:
```bash
curl -X POST http://localhost:3001/api/inventory \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Office Chair",
    "description": "Ergonomic office chair",
    "price": 249.99,
    "stock": 15
  }'
```

> `description` is optional.

**Update an item** *(admin only)*:
```bash
curl -X PATCH http://localhost:3001/api/inventory/1 \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{ "stock": 10 }'
```

**Delete an item** *(admin only)*:
```bash
curl -X DELETE http://localhost:3001/api/inventory/1 \
  -H "Authorization: Bearer $TOKEN"
```

---

## 6. Frontend Walkthrough

Open [http://localhost:3000](http://localhost:3000) in a browser.

| Route           | Description                                      |
|-----------------|--------------------------------------------------|
| `/login`        | Sign in with email and password                  |
| `/register`     | Create a new account                             |
| `/dashboard`    | Protected area — requires login                  |

After logging in you will be redirected to the dashboard where you can browse employees and inventory.

---

## 7. Running Backend Unit Tests

```bash
cd backend
npm test
```

Run with coverage:

```bash
npm run test:cov
```

Run end-to-end tests (requires the database to be running):

```bash
npm run test:e2e
```

---

## 8. Inspect the Database

Navigate to [http://localhost:8080](http://localhost:8080) and log in with:

| Field    | Value        |
|----------|--------------|
| System   | MySQL        |
| Server   | `db`         |
| Username | `app_user`   |
| Password | `app_password` |
| Database | `admin_app`  |

---

## 9. Stopping Everything

```bash
# Stop the database (data is preserved in the Docker volume)
docker compose down

# To also remove the volume and start fresh:
docker compose down -v
```
