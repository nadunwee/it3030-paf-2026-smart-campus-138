# Smart Campus Operations Hub

Spring Boot REST API and React (Vite) client for campus facilities and operations.

## Prerequisites

- Java 17+, Maven
- Node.js 20+ (for the frontend)
- MySQL 8+ with a database (default name `smartcampus`)

## Backend

From `backend/`:

```bash
mvn spring-boot:run
```

Configure the database via environment variables or `application.yml`:

- `DB_HOST`, `DB_PORT`, `DB_NAME`, `DB_USER`, `DB_PASSWORD`

### Bootstrap administrator (operators only)

The first **ADMIN** account is created automatically when **no** administrator exists in the database. Credentials are **not** shown in the web UI.

Set these in production (never commit real passwords):

| Variable | Purpose |
|----------|---------|
| `ADMIN_USERNAME` | Bootstrap admin username (default `admin`) |
| `ADMIN_PASSWORD` | Bootstrap admin password (default `admin123` for local dev only) |

YAML equivalent: `app.security.bootstrap-admin-username` and `app.security.bootstrap-admin-password`.

The bootstrap username is **reserved** for self-service registration: users cannot register an account with that name.

### Google login (optional)

Set these when enabling Google sign-in:

| Variable | Purpose |
|----------|---------|
| `GOOGLE_LOGIN_ENABLED` | Set `true` to enable Google login endpoint |
| `GOOGLE_CLIENT_ID` | Google OAuth Web Client ID |

Frontend env (`frontend/.env`) also needs:

- `VITE_GOOGLE_CLIENT_ID=<same Google client id>`

### API

- `POST /api/v1/auth/register` — public; creates a **STUDENT** account (password min 8 characters).
- `POST /api/v1/auth/google` — public; exchanges Google ID token for an app session token.
- `GET /api/v1/auth/me` — authenticated; returns `{ "username", "role": "STUDENT" \| "TEACHER" \| "ADMIN" }`.
- Facility resources under `/api/v1/resources` (see controllers).

## Frontend

From `frontend/`:

```bash
npm install
npm run dev
```

For local development, leave `VITE_API_BASE_URL` unset so the Vite dev server proxies `/api` to the backend (see `vite.config.ts`).

## Sign up and sign in

Users can **sign up** for a standard account. **Administrator** access is provisioned via the bootstrap process above or by your deployment process—not through the public sign-up form.
