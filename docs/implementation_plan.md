# Implementation Plan — Business Administration App

## Overview

Full-stack business administration application with a NestJS backend, Next.js frontend, TypeORM + MySQL database, and JWT-based authentication. Admins can manage employees and inventory through a secure, role-protected web interface.

---

## Phase 1 — Project Scaffolding & Infrastructure ✅ DONE

**Goal:** Get the monorepo structure, database, and tooling in place before writing any business logic.

### Steps

1. ✅ **Initialize monorepo layout**
   - `frontend/`, `backend/`, `docs/` directories created

2. ✅ **Scaffold the NestJS backend**
   - Scaffolded with `nest new backend` (TypeScript, nodenext module resolution)
   - Installed: `@nestjs/config`, `@nestjs/typeorm`, `typeorm`, `mysql2`, `@nestjs/jwt`, `@nestjs/passport`, `passport`, `passport-jwt`, `bcrypt`, `class-validator`, `class-transformer`, `cookie-parser`, `helmet`
   - Dev types: `@types/bcrypt`, `@types/passport-jwt`, `@types/cookie-parser`
   - `ConfigModule` set to global in `AppModule`
   - `TypeOrmModule.forRootAsync()` wired via `src/config/typeorm.config.ts`

3. ✅ **Scaffold the Next.js frontend**
   - Scaffolded with `create-next-app` (TypeScript, App Router, Tailwind CSS, `src/` dir, `@/*` alias)

4. ✅ **Docker Compose & database**
   - `docker-compose.yml` at project root: `mysql:8` service + `adminer` (port 8080)
   - MySQL port `3306` exposed, data persisted via `mysql_data` volume
   - Healthcheck on the DB service; Adminer depends on healthy DB
   - > ⚠️ **Note:** Docker Desktop must have WSL integration enabled to run `docker compose up -d`

5. ✅ **Environment configuration**
   - `.env` and `.env.example` created at project root
   - Variables: `DB_HOST`, `DB_PORT`, `DB_NAME`, `DB_USER`, `DB_PASSWORD`, `DB_ROOT_PASSWORD`, `JWT_SECRET`, `JWT_REFRESH_SECRET`, `JWT_EXPIRES_IN`, `JWT_REFRESH_EXPIRES_IN`, `BACKEND_PORT`, `FRONTEND_URL`, `BACKEND_URL`
   - `.env` added to `.gitignore`

6. ⏳ **Verify connectivity**
   - Pending Docker Desktop WSL integration being enabled
   - Migration will auto-run on backend start (`migrationsRun: true`)

---

## Phase 2 — Database Entities & Migrations ✅ DONE

**Goal:** Define the full database schema as TypeORM entities and generate migrations.

### Steps

1. ✅ **Create TypeORM entities** (`src/entities/`)
   - `user.entity.ts` — `id`, `username`, `email`, `password` (select: false), `role` (enum: admin/viewer), `created_at`
   - `employee.entity.ts` — `id`, `first_name`, `last_name`, `phone` (nullable), `email` (unique), `created_at`, `updated_at`
   - `inventory-item.entity.ts` — `id`, `name`, `description` (nullable), `price` (decimal 10,2), `stock` (int, default 0), `created_at`, `updated_at`

2. ✅ **Configure migrations**
   - `synchronize: false` in TypeORM config (migrations only, no auto-sync)
   - `migrationsRun: true` — migrations apply automatically on app start
   - `src/database/data-source.ts` created for the TypeORM CLI
   - Migration scripts added to `package.json`: `migration:generate`, `migration:run`, `migration:revert`

3. ✅ **Initial migration created** (`src/database/migrations/1000000000000-InitialSchema.ts`)
   - Creates `users`, `employees`, `inventory` tables with all constraints
   - Unique indexes on `users.username`, `users.email`, `employees.email`
   - `down()` drops all three tables in reverse order

4. ⬜ **Seed data** — deferred; create an admin user manually via `POST /api/auth/register` with `role: "admin"`

---

## Phase 3 — Authentication Module (Backend) ✅ DONE

**Goal:** Implement secure register/login with JWT access + refresh token flow.

### Steps

1. ✅ **Module structure**
   - `UsersModule` + `UsersService` — DB operations (findByEmail, findByUsername, findById, create)
   - `AuthModule`, `AuthController`, `AuthService`

2. ✅ **Register** — `POST /api/auth/register`
   - Validates `RegisterDto` (username, email, password ≥ 8 chars, optional role)
   - Checks for duplicate email/username → `409 Conflict`
   - Hashes password with bcrypt (10 salt rounds)
   - Returns created user (password excluded)

3. ✅ **Login** — `POST /api/auth/login`
   - Validates credentials → `401 Unauthorized` on mismatch
   - Issues JWT access token (15 min) in response body
   - Sets refresh token (7 days) as HTTP-only cookie (`refresh_token`)

4. ✅ **Refresh** — `POST /api/auth/refresh`
   - Reads `refresh_token` cookie, verifies with `JWT_REFRESH_SECRET`
   - Returns new access token or `401` if invalid/missing

5. ✅ **Logout** — `POST /api/auth/logout`
   - Clears the `refresh_token` cookie

6. ✅ **Guards & strategies**
   - `JwtStrategy` — validates `Authorization: Bearer` token
   - `JwtAuthGuard` — applied globally via `APP_GUARD`; routes opt out with `@Public()`
   - `RolesGuard` — applied globally via `APP_GUARD`; `@Roles(UserRole.ADMIN)` restricts write operations
   - `@Public()` and `@Roles()` decorators implemented

7. ✅ **DTOs & validation**
   - `RegisterDto` — username, email, password (min 8), optional role enum
   - `LoginDto` — email, password

---

## Phase 4 — Employees Module (Backend) ✅ DONE

**Goal:** Full CRUD for employees with validation and role-based access control.

### Steps

1. ✅ **Module structure**
   - `EmployeesModule`, `EmployeesController`, `EmployeesService` implemented
   - TypeORM repository for `Employee` injected via `TypeOrmModule.forFeature`

2. ✅ **Endpoints**
   - `GET /api/employees` — list all employees, ordered by `created_at DESC` (any authenticated user)
   - `GET /api/employees/:id` — get single employee by ID (any authenticated user)
   - `POST /api/employees` — create employee (admin only, `@Roles(UserRole.ADMIN)`)
   - `PATCH /api/employees/:id` — partial update (admin only)
   - `DELETE /api/employees/:id` — delete, returns `204 No Content` (admin only)

3. ✅ **DTOs & validation** (`class-validator` + `@nestjs/mapped-types`)
   - `CreateEmployeeDto` — `first_name` (1–100), `last_name` (1–100), `email` (valid email), `phone` (optional, regex-validated format)
   - `UpdateEmployeeDto` — `PartialType(CreateEmployeeDto)` (all fields optional)

4. ✅ **Error handling**
   - `404 Not Found` when employee doesn't exist
   - `409 Conflict` on duplicate email (checked on create and on email change in update)
   - `403 Forbidden` handled by global `RolesGuard` for viewer role

---

## Phase 5 — Inventory Module (Backend) ✅ DONE

**Goal:** Full CRUD for inventory items with validation and role-based access control.

### Steps

1. ✅ **Module structure**
   - `InventoryModule`, `InventoryController`, `InventoryService` implemented
   - TypeORM repository for `InventoryItem` injected via `TypeOrmModule.forFeature`

2. ✅ **Endpoints**
   - `GET /api/inventory` — list all items, ordered by `created_at DESC` (any authenticated user)
   - `GET /api/inventory/:id` — get single item by ID (any authenticated user)
   - `POST /api/inventory` — create item (admin only)
   - `PATCH /api/inventory/:id` — partial update (admin only)
   - `DELETE /api/inventory/:id` — delete, returns `204 No Content` (admin only)

3. ✅ **DTOs & validation**
   - `CreateInventoryItemDto` — `name` (1–200), `description` (optional, max 5000), `price` (number ≥ 0, max 2 decimals), `stock` (integer ≥ 0); `@Type(() => Number)` for transform
   - `UpdateInventoryItemDto` — `PartialType(CreateInventoryItemDto)` (all fields optional)

4. ✅ **Error handling**
   - `404 Not Found` when item doesn't exist
   - `403 Forbidden` handled by global `RolesGuard`

---

## Phase 6 — Frontend Authentication ✅ DONE

**Goal:** Login/register pages, token management, and route protection.

### Steps

1. ✅ **Auth context / state** (`src/contexts/auth-context.tsx`)
   - `AuthContext` with React Context + `AuthProvider`
   - Access token stored in module-level memory variable (no localStorage — XSS safe)
   - Exposes `user`, `isLoading`, `login`, `logout`, `register`
   - On mount, attempts token restore via `POST /auth/refresh` (uses HTTP-only cookie)
   - User decoded from JWT payload (id, email, role)

2. ✅ **API client** (`src/lib/api.ts`)
   - Axios instance with `baseURL = NEXT_PUBLIC_API_URL`, `withCredentials: true`
   - Request interceptor: attaches `Authorization: Bearer <token>` when present
   - Response interceptor: on `401`, silently refreshes token and retries; on failure, clears token and redirects to `/login`

3. ✅ **Login page** — `/login`
   - `react-hook-form` + `zod` (email required, valid format; password required)
   - Field-level error messages; API error banner on failure
   - On success: token stored in memory, redirect to `/dashboard`

4. ✅ **Register page** — `/register`
   - Username, email, password (min 8), role (viewer/admin) with zod validation
   - On success: redirects to `/login`

5. ✅ **Route protection proxy** (`src/proxy.ts`, Next.js 16 convention)
   - Intercepts `/dashboard/*`, `/employees/*`, `/inventory/*`, `/login`, `/register`
   - No `refresh_token` cookie → redirect to `/login`
   - Has `refresh_token` cookie + visits auth pages → redirect to `/dashboard`

6. ✅ **Landing page** (`/`) — public page with feature overview and Sign In / Create Account CTAs

---

## Phase 7 — Frontend Dashboard ✅ DONE

**Goal:** Authenticated dashboard with summary statistics fetched from the API.

### Steps

1. ✅ **Sidebar layout** (`src/components/Sidebar.tsx` + `src/app/(dashboard)/layout.tsx`)
   - Route group `(dashboard)` wraps all authenticated pages with `DashboardLayout`
   - Indigo sidebar: active link highlight, user email + role badge, sign out button
   - Navigation links: Dashboard, Employees, Inventory with emoji icons

2. ✅ **Dashboard page** — `/dashboard`
   - Fetches `GET /api/employees` and `GET /api/inventory` in parallel
   - 4 stat cards: Total Employees, Inventory Items, Inventory Value ($), Low Stock (< 5)
   - Pulse skeleton loaders while data is in flight

---

## Phase 8 — Frontend CRUD Pages ✅ DONE

**Goal:** Full employee and inventory management UI.

### Steps

1. ✅ **Employees list** — `/employees`
   - Table: Name, Email, Phone, Created Date, Actions
   - Client-side search by name or email
   - Edit/Delete actions visible to admins only; delete with `confirm()` dialog

2. ✅ **Create employee** — `/employees/new`
   - Form: first name, last name, email, optional phone (regex validated)
   - Zod + react-hook-form; field errors + API error banner
   - On success: redirect to `/employees`

3. ✅ **Edit/Delete employee** — `/employees/[id]`
   - Pre-filled via `GET /api/employees/:id` on mount; `reset()` populates form
   - Save via `PATCH`; delete via `DELETE` with confirmation; both redirect to `/employees`

4. ✅ **Inventory list** — `/inventory`
   - Table: Name, Description (truncated), Price, Stock (colour-coded badge: red < 5), Actions
   - Client-side search by name; admin-only Edit/Delete with `confirm()` dialog

5. ✅ **Create inventory item** — `/inventory/new`
   - Form: name, optional description (textarea), price (≥ 0, 2 decimal), stock (integer ≥ 0)
   - `z.coerce.number()` with `useForm<Input, unknown, Output>` generic fix
   - On success: redirect to `/inventory`

6. ✅ **Edit/Delete inventory item** — `/inventory/[id]`
   - Pre-filled on mount; save via `PATCH`, delete via `DELETE` with confirmation

---

## Phase 9 — Polish & Production Readiness

**Goal:** Error handling, UX improvements, and final testing.

### Steps

1. **Global error handling**
   - Backend: `AllExceptionsFilter` for consistent JSON error shape
   - Frontend: global error boundary + toast notifications for API errors

2. **Loading states**
   - Skeleton loaders on all data-fetching pages
   - Disable form submit buttons while requests are in flight

3. **Responsive design**
   - Verify layout on mobile, tablet, and desktop breakpoints
   - Collapsible sidebar, responsive tables (horizontal scroll or card layout)

4. **Security hardening**
   - Add `helmet` to NestJS for HTTP security headers
   - Configure CORS in NestJS to only allow the frontend origin
   - Validate and sanitize all inputs (backend DTOs + frontend Zod schemas)

5. **Environment & deployment prep**
   - Finalize `.env.example` with all required keys and descriptions
   - Write a `README.md` with setup instructions (clone → env setup → docker-compose up → run apps)
   - Add npm scripts at root to start both apps concurrently (`concurrently`)

6. **Final testing**
   - Manually test all API endpoints (Postman or Insomnia collection)
   - Walk through all frontend flows: register, login, CRUD for employees and inventory, logout
   - Verify role restrictions (viewer cannot create/edit/delete)

---

## Dependency Map

```
Phase 1 (Scaffolding)
  └── Phase 2 (DB Entities)
        └── Phase 3 (Auth)
              ├── Phase 4 (Employees API)
              └── Phase 5 (Inventory API)
                    └── Phase 6 (Frontend Auth)
                          └── Phase 7 (Dashboard)
                                └── Phase 8 (CRUD Pages)
                                      └── Phase 9 (Polish)
```

---

## Key Technical Decisions

| Decision | Choice | Reason |
|---|---|---|
| Token storage | Access token in memory, refresh in HTTP-only cookie | Balances security (no XSS exposure) with usability |
| Sync vs migrations | Migrations (`synchronize: false`) | Safe for production; avoids accidental schema changes |
| Frontend state | React Context or Zustand | Lightweight; avoids Redux overhead for this scope |
| Form library | `react-hook-form` + `zod` | Performant, type-safe, minimal re-renders |
| Component library | Tailwind CSS + shadcn/ui | Unstyled primitives + full design control |
| Validation | `class-validator` (backend) + `zod` (frontend) | Consistent rules on both sides |
