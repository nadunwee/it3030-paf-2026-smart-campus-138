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

### Firebase Google login (optional)

Set these when enabling Firebase Google sign-in:

| Variable | Purpose |
|----------|---------|
| `GOOGLE_LOGIN_ENABLED` | Set `true` to enable the backend Google login endpoint |
| `FIREBASE_PROJECT_ID` | Firebase project ID used to verify Firebase Auth ID tokens |
| `FIREBASE_SERVICE_ACCOUNT_PATH` | Optional local path to a Firebase service account JSON file. If unset, Application Default Credentials are used |

Frontend env (`frontend/.env`) also needs the Firebase web app config:

- `VITE_FIREBASE_API_KEY`
- `VITE_FIREBASE_AUTH_DOMAIN`
- `VITE_FIREBASE_PROJECT_ID`
- `VITE_FIREBASE_STORAGE_BUCKET`
- `VITE_FIREBASE_MESSAGING_SENDER_ID`
- `VITE_FIREBASE_APP_ID`

In Firebase Console, enable **Authentication > Sign-in method > Google** and add your local dev origin, such as `localhost`, under **Authentication > Settings > Authorized domains**.

### API

- `POST /api/v1/auth/register` — public; creates a **STUDENT** account (password min 8 characters).
- `POST /api/v1/auth/google` — public; exchanges a Firebase Authentication ID token for an app session token.
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
