# Cómo ejecutar y probar el proyecto

Esta guía cubre todo lo necesario para poner en marcha la Aplicación de Administración localmente y probar manualmente todas sus funcionalidades.

---

## Requisitos previos

- [Node.js](https://nodejs.org/) v18+
- [npm](https://www.npmjs.com/) v9+
- [Docker](https://www.docker.com/) y Docker Compose

---

## 1. Configuración de variables de entorno

### Backend

Copia el archivo de ejemplo y ajusta los valores según tu entorno (los valores por defecto funcionan para desarrollo local):

```bash
cp .env.example .env
```

Variables clave en `.env`:

| Variable              | Valor por defecto                          | Descripción                        |
|-----------------------|--------------------------------------------|------------------------------------|
| `DB_HOST`             | `localhost`                                | Host de MySQL                      |
| `DB_PORT`             | `3306`                                     | Puerto de MySQL                    |
| `DB_NAME`             | `admin_app`                                | Nombre de la base de datos         |
| `DB_USER`             | `app_user`                                 | Usuario de la base de datos        |
| `DB_PASSWORD`         | `app_password`                             | Contraseña del usuario             |
| `DB_ROOT_PASSWORD`    | `root_password`                            | Contraseña root de MySQL           |
| `JWT_SECRET`          | `change_me_to_a_long_random_secret`        | Secreto para access tokens         |
| `JWT_REFRESH_SECRET`  | `change_me_to_another_long_random_secret`  | Secreto para refresh tokens        |
| `JWT_EXPIRES_IN`      | `15m`                                      | TTL del access token               |
| `JWT_REFRESH_EXPIRES_IN` | `7d`                                  | TTL del refresh token              |
| `BACKEND_PORT`        | `3001`                                     | Puerto del servidor NestJS         |
| `FRONTEND_URL`        | `http://localhost:3000`                    | Origen CORS permitido              |

> **Seguridad:** Cambia `JWT_SECRET` y `JWT_REFRESH_SECRET` por cadenas aleatorias largas antes de cualquier despliegue real.

### Frontend

El frontend requiere su propio archivo de entorno para apuntar al backend a través del proxy integrado de Next.js:

```bash
# frontend/.env.local (ya incluido en el repositorio)
NEXT_PUBLIC_API_URL=/api
BACKEND_URL=http://localhost:3001
```

> El proxy de Next.js redirige `/api/*` → `http://localhost:3001/api/*`. Esto permite que la cookie `refresh_token` se establezca en el mismo origen (`localhost:3000`), lo cual es requerido por el middleware de autenticación.

---

## 2. Iniciar la base de datos

La base de datos y Adminer (navegador web de BD) se gestionan con Docker Compose:

```bash
docker compose up -d
```

Esto inicia:
- **MySQL 8** en el puerto `3306`
- **Adminer** en [http://localhost:8080](http://localhost:8080) — útil para inspeccionar tablas

Espera a que el health check de la base de datos pase antes de iniciar el backend (normalmente 10–20 segundos).

> **Base de datos vacía:** Las migraciones crean las tablas automáticamente (`migrationsRun: true`), pero no insertan datos de prueba. Deberás registrar el primer usuario administrador manualmente (ver sección 5.1).

---

## 3. Iniciar el Backend

```bash
cd backend
npm install
npm run start:dev
```

El backend:
1. Se conecta a MySQL y ejecuta las migraciones pendientes automáticamente
2. Escucha en [http://localhost:3001/api](http://localhost:3001/api)

Deberías ver:
```
Backend running on http://localhost:3001/api
```

---

## 4. Iniciar el Frontend

Abre una nueva terminal:

```bash
cd frontend
npm install
npm run dev
```

El frontend estará disponible en [http://localhost:3000](http://localhost:3000).

---

## 5. Pruebas manuales de la API

Todas las rutas de la API tienen el prefijo `/api`. La autenticación usa **JWT access tokens** (enviados en el header `Authorization`) y **cookies HTTP-only de refresh token**.

Los ejemplos con `curl` apuntan directamente al backend (`:3001`). El flujo de cookies funciona igual; para pruebas desde el navegador, las peticiones pasan por el proxy del frontend (`:3000`).

### 5.1 Registrar el primer usuario administrador

> Ejecuta esto antes de intentar iniciar sesión — la base de datos comienza vacía.

```bash
curl -X POST http://localhost:3001/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "username": "admin",
    "email": "admin@example.com",
    "password": "password123",
    "role": "admin"
  }'
```

> `role` es opcional y por defecto es `"viewer"`. Valores válidos: `"admin"`, `"viewer"`.

---

### 5.2 Iniciar sesión

```bash
curl -c cookies.txt -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@example.com",
    "password": "password123"
  }'
```

**Respuesta:**
```json
{ "accessToken": "<JWT>" }
```

El refresh token se almacena automáticamente como cookie HTTP-only (`refresh_token`). Guarda el valor de `accessToken`:

```bash
export TOKEN="<pega aquí el accessToken>"
```

---

### 5.3 Renovar el access token

```bash
curl -b cookies.txt -X POST http://localhost:3001/api/auth/refresh
```

Devuelve un nuevo `accessToken`. Si el token es inválido o expirado, la cookie se limpia automáticamente.

---

### 5.4 Cerrar sesión

```bash
curl -b cookies.txt -X POST http://localhost:3001/api/auth/logout
```

Elimina la cookie de refresh token.

---

### 5.5 Empleados

Todos los usuarios autenticados pueden leer empleados. Crear, actualizar y eliminar requiere rol `admin`.

**Listar todos:**
```bash
curl http://localhost:3001/api/employees \
  -H "Authorization: Bearer $TOKEN"
```

**Obtener uno:**
```bash
curl http://localhost:3001/api/employees/1 \
  -H "Authorization: Bearer $TOKEN"
```

**Crear** *(solo admin)*:
```bash
curl -X POST http://localhost:3001/api/employees \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "first_name": "María",
    "last_name": "García",
    "email": "maria.garcia@example.com",
    "phone": "+502 5555-0100"
  }'
```

> `phone` es opcional.

**Actualizar** *(solo admin)*:
```bash
curl -X PATCH http://localhost:3001/api/employees/1 \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{ "phone": "+502 5555-9999" }'
```

**Eliminar** *(solo admin)*:
```bash
curl -X DELETE http://localhost:3001/api/employees/1 \
  -H "Authorization: Bearer $TOKEN"
```

---

### 5.6 Inventario

Mismo modelo de permisos que empleados: lecturas abiertas a todos los usuarios autenticados; escrituras requieren `admin`.

**Listar todos:**
```bash
curl http://localhost:3001/api/inventory \
  -H "Authorization: Bearer $TOKEN"
```

**Obtener uno:**
```bash
curl http://localhost:3001/api/inventory/1 \
  -H "Authorization: Bearer $TOKEN"
```

**Crear** *(solo admin)*:
```bash
curl -X POST http://localhost:3001/api/inventory \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Silla de oficina",
    "description": "Silla ergonómica con soporte lumbar",
    "price": 249.99,
    "stock": 15
  }'
```

> `description` es opcional.

**Actualizar** *(solo admin)*:
```bash
curl -X PATCH http://localhost:3001/api/inventory/1 \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{ "stock": 10 }'
```

**Eliminar** *(solo admin)*:
```bash
curl -X DELETE http://localhost:3001/api/inventory/1 \
  -H "Authorization: Bearer $TOKEN"
```

---

## 6. Recorrido por el Frontend

Abre [http://localhost:3000](http://localhost:3000) en un navegador.

| Ruta            | Descripción                                                  |
|-----------------|--------------------------------------------------------------|
| `/`             | Página de inicio con accesos directos a login y registro     |
| `/login`        | Iniciar sesión con correo y contraseña                       |
| `/register`     | Crear una nueva cuenta                                       |
| `/dashboard`    | Panel principal — muestra estadísticas de empleados e inventario |
| `/employees`    | Lista de empleados con búsqueda; admins pueden crear/editar/eliminar |
| `/inventory`    | Lista de inventario con búsqueda; admins pueden crear/editar/eliminar |

> Las rutas `/dashboard`, `/employees` e `/inventory` requieren sesión activa. El middleware redirige automáticamente a `/login` si no hay sesión.

---

## 7. Ejecutar pruebas del Backend

```bash
cd backend
npm test
```

Con cobertura:

```bash
npm run test:cov
```

Pruebas end-to-end (requiere la base de datos en ejecución):

```bash
npm run test:e2e
```

---

## 8. Inspeccionar la base de datos

Navega a [http://localhost:8080](http://localhost:8080) e inicia sesión con:

| Campo    | Valor          |
|----------|----------------|
| Sistema  | MySQL          |
| Servidor | `db`           |
| Usuario  | `app_user`     |
| Contraseña | `app_password` |
| Base de datos | `admin_app` |

---

## 9. Detener todo

```bash
# Detener la base de datos (los datos se conservan en el volumen Docker)
docker compose down

# Para eliminar también el volumen y empezar desde cero:
docker compose down -v
```

