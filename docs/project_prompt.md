# Project Prompt — Business Administration App

## Overview

Build a full-stack business administration application that allows company administrators to manage employees and inventory through a secure, authenticated web interface.

---

## Tech Stack

| Layer       | Technology                  | Notes                                      |
| ----------- | --------------------------- | ------------------------------------------ |
| Frontend    | **Next.js 14+** (React/TS) | App Router, Server Components where useful  |
| Backend API | **NestJS** (Node.js/TS)    | REST API, modular architecture              |
| ORM         | **TypeORM**                 | Entities, migrations, repositories          |
| Database    | **MySQL 8**                 | Dockerized via `docker-compose`             |
| Auth        | **JWT**                     | Access + refresh tokens, bcrypt for hashing |

---

## Project Structure

```
/
├── frontend/          # Next.js application
├── backend/           # NestJS application
├── docker-compose.yml # MySQL + any other services
└── docs/
    └── project_prompt.md
```

---

## Database Schema

### `employees`

| Column       | Type            | Constraints                        |
| ------------ | --------------- | ---------------------------------- |
| `id`         | `INT`           | PK, auto-increment                 |
| `first_name` | `VARCHAR(100)`  | NOT NULL                           |
| `last_name`  | `VARCHAR(100)`  | NOT NULL                           |
| `phone`      | `VARCHAR(20)`   | nullable                           |
| `email`      | `VARCHAR(255)`  | NOT NULL, UNIQUE                   |
| `created_at` | `TIMESTAMP`     | default `CURRENT_TIMESTAMP`        |
| `updated_at` | `TIMESTAMP`     | auto-updated on change             |

### `inventory`

| Column        | Type             | Constraints                        |
| ------------- | ---------------- | ---------------------------------- |
| `id`          | `INT`            | PK, auto-increment                 |
| `name`        | `VARCHAR(200)`   | NOT NULL                           |
| `description` | `TEXT`           | nullable                           |
| `price`       | `DECIMAL(10, 2)` | NOT NULL, >= 0                     |
| `stock`       | `INT`            | NOT NULL, default 0, >= 0          |
| `created_at`  | `TIMESTAMP`      | default `CURRENT_TIMESTAMP`        |
| `updated_at`  | `TIMESTAMP`      | auto-updated on change             |

### `users` (for authentication)

| Column     | Type           | Constraints                        |
| ---------- | -------------- | ---------------------------------- |
| `id`       | `INT`          | PK, auto-increment                 |
| `username` | `VARCHAR(100)` | NOT NULL, UNIQUE                   |
| `email`    | `VARCHAR(255)` | NOT NULL, UNIQUE                   |
| `password` | `VARCHAR(255)` | NOT NULL (bcrypt hash)             |
| `role`     | `ENUM`         | `admin`, `viewer` — default `viewer` |
| `created_at` | `TIMESTAMP`  | default `CURRENT_TIMESTAMP`        |

---

## API Endpoints (Backend — NestJS)

Base URL: `/api`

### Auth — `/api/auth`

| Method | Route       | Description               | Auth     |
| ------ | ----------- | ------------------------- | -------- |
| POST   | `/register` | Create a new user account | Public   |
| POST   | `/login`    | Returns JWT tokens        | Public   |
| POST   | `/refresh`  | Refresh access token      | JWT      |

### Employees — `/api/employees`

| Method | Route    | Description           | Auth |
| ------ | -------- | --------------------- | ---- |
| GET    | `/`      | List all employees    | JWT  |
| GET    | `/:id`   | Get employee by ID    | JWT  |
| POST   | `/`      | Create new employee   | JWT (admin) |
| PATCH  | `/:id`   | Update employee       | JWT (admin) |
| DELETE | `/:id`   | Delete employee       | JWT (admin) |

### Inventory — `/api/inventory`

| Method | Route    | Description           | Auth |
| ------ | -------- | --------------------- | ---- |
| GET    | `/`      | List all items        | JWT  |
| GET    | `/:id`   | Get item by ID        | JWT  |
| POST   | `/`      | Create new item       | JWT (admin) |
| PATCH  | `/:id`   | Update item           | JWT (admin) |
| DELETE | `/:id`   | Delete item           | JWT (admin) |

---

## Frontend Pages (Next.js)

| Route            | Page                | Description                                      |
| ---------------- | ------------------- | ------------------------------------------------ |
| `/`              | Landing / Home      | Public page with app info and link to login       |
| `/login`         | Login               | Email + password form, redirects to dashboard     |
| `/register`      | Register            | Sign-up form for new users                        |
| `/dashboard`     | Dashboard           | Summary cards (total employees, inventory stats)  |
| `/employees`     | Employees List      | Table with search, links to edit/create           |
| `/employees/new` | Create Employee     | Form to add a new employee                        |
| `/employees/:id` | Edit Employee       | Pre-filled form, update or delete                 |
| `/inventory`     | Inventory List      | Table with search, links to edit/create           |
| `/inventory/new` | Create Item         | Form to add a new inventory item                  |
| `/inventory/:id` | Edit Item           | Pre-filled form, update or delete                 |

### UI Guidelines

- Use a **sidebar layout** for authenticated pages (Dashboard, Employees, Inventory).
- Use a CSS framework or component library of choice (e.g., Tailwind CSS, shadcn/ui).
- Forms should include client-side validation with clear error messages.
- Tables should display data in a clean, paginated format.
- Protect all `/dashboard`, `/employees`, and `/inventory` routes — redirect unauthenticated users to `/login`.

---

## Authentication & Authorization

1. **Login** returns a JWT access token (short-lived, ~15 min) and a refresh token (longer-lived).
2. Store the access token in memory or an HTTP-only cookie; store the refresh token in an HTTP-only cookie.
3. Backend guards:
   - `JwtAuthGuard` — validates the access token on protected routes.
   - `RolesGuard` — checks user role (`admin` required for create/update/delete operations).
4. Passwords are hashed with **bcrypt** before storage. Never store or return plain-text passwords.

---

## Docker Setup

Provide a `docker-compose.yml` at the project root with at minimum:

```yaml
services:
  db:
    image: mysql:8
    ports:
      - "3306:3306"
    environment:
      MYSQL_ROOT_PASSWORD: ${DB_ROOT_PASSWORD}
      MYSQL_DATABASE: ${DB_NAME}
    volumes:
      - mysql_data:/var/lib/mysql

volumes:
  mysql_data:
```

Use a `.env` file for all secrets and config (DB credentials, JWT secret, ports). Add `.env` to `.gitignore`.

---

## Implementation Order

Follow this sequence to build the project incrementally:

1. **Project scaffolding** — Initialize the `frontend/` (Next.js) and `backend/` (NestJS) apps. Set up `docker-compose.yml` and verify the DB connection.
2. **Database & ORM** — Define TypeORM entities for `users`, `employees`, `inventory`. Generate and run migrations.
3. **Auth module** — Implement register, login, JWT issuance, guards, and role-based access in the backend.
4. **Employees module** — CRUD endpoints + validation (DTOs with `class-validator`).
5. **Inventory module** — CRUD endpoints + validation.
6. **Frontend auth** — Login/register pages, token storage, route protection middleware.
7. **Frontend dashboard** — Summary page with stats fetched from the API.
8. **Frontend CRUD pages** — Employee and Inventory list, create, and edit pages.
9. **Polish** — Error handling, loading states, responsive design, final testing.

---

## Validation Rules

### Employee

- `first_name` — required, 1–100 characters
- `last_name` — required, 1–100 characters
- `phone` — optional, valid phone format
- `email` — required, valid email format, unique

### Inventory Item

- `name` — required, 1–200 characters
- `description` — optional
- `price` — required, number >= 0
- `stock` — required, integer >= 0

Apply validation in **both** the backend (DTOs with `class-validator`) and the frontend (form validation).