# Smart Campus Operations Hub

> **IT3030 – PAF Assignment 2026** | Faculty of Computing, SLIIT

A full-stack web platform for managing university facility bookings and maintenance/incident handling.

## Tech Stack

| Layer | Technology |
|---|---|
| Backend | Spring Boot 3.2, Spring Data JPA, Spring Security, JWT |
| Frontend | React 19, Vite, React Router v7 |
| Database | H2 (development) / PostgreSQL (production) |
| Auth | OAuth 2.0 (Google) + JWT |
| CI/CD | GitHub Actions |

## Modules

- **Module A** – Facilities & Assets Catalogue (lecture halls, labs, meeting rooms, equipment)
- **Module B** – Booking Management (PENDING → APPROVED/REJECTED, conflict detection)
- **Module C** – Maintenance & Incident Ticketing (with image attachments, comments, technician assignment)
- **Module D** – Notifications (in-app notification panel)
- **Module E** – Authentication & Authorization (OAuth 2.0 + role-based access: USER / ADMIN / TECHNICIAN)

## Project Structure

```
smart-campus/
├── backend/          # Spring Boot REST API
│   ├── src/main/java/com/smartcampus/
│   │   ├── controller/   # REST Controllers
│   │   ├── service/      # Business Logic
│   │   ├── model/        # JPA Entities
│   │   ├── repository/   # Spring Data Repos
│   │   ├── dto/          # Request/Response DTOs
│   │   ├── security/     # JWT + Auth filter
│   │   ├── config/       # Security, CORS, Data init
│   │   └── exception/    # Global error handling
│   └── pom.xml
├── frontend/         # React Application
│   ├── src/
│   │   ├── pages/        # Page components
│   │   ├── components/   # Reusable components
│   │   ├── services/     # API calls (Axios)
│   │   ├── context/      # Auth context
│   │   └── main.jsx
│   └── package.json
└── .github/
    └── workflows/ci.yml  # GitHub Actions
```

## Quick Start

### Prerequisites
- Java 17+
- Node.js 20+
- Maven 3.8+

### Backend

```bash
cd backend
mvn spring-boot:run
```

The API will be available at `http://localhost:8080`

H2 console: `http://localhost:8080/h2-console`

### Frontend

```bash
cd frontend
npm install
npm run dev
```

The app will be available at `http://localhost:5173`

### Demo Login

Use the quick login buttons on the login page:
- **Admin**: `admin@smartcampus.lk`
- **Technician**: `tech@smartcampus.lk`
- **Student/User**: `student@smartcampus.lk`

## API Endpoints

| Method | Endpoint | Description | Role |
|--------|----------|-------------|------|
| GET | `/api/resources` | List/search resources | Public |
| POST | `/api/resources` | Create resource | ADMIN |
| PUT | `/api/resources/{id}` | Update resource | ADMIN |
| DELETE | `/api/resources/{id}` | Delete resource | ADMIN |
| GET | `/api/bookings` | List all bookings | ADMIN |
| GET | `/api/bookings/my` | My bookings | USER |
| POST | `/api/bookings` | Create booking | USER |
| POST | `/api/bookings/{id}/approve` | Approve booking | ADMIN |
| POST | `/api/bookings/{id}/reject` | Reject booking | ADMIN |
| POST | `/api/bookings/{id}/cancel` | Cancel booking | USER |
| GET | `/api/tickets` | List all tickets | ADMIN/TECHNICIAN |
| GET | `/api/tickets/my` | My tickets | USER |
| POST | `/api/tickets` | Create ticket | USER |
| PATCH | `/api/tickets/{id}/status` | Update ticket status | ADMIN/TECHNICIAN |
| GET/POST | `/api/tickets/{id}/comments` | Ticket comments | USER |
| GET | `/api/notifications` | Get notifications | USER |
| POST | `/api/notifications/{id}/read` | Mark as read | USER |
| GET | `/api/users` | List users | ADMIN |
| PATCH | `/api/users/{id}/role` | Update user role | ADMIN |
| POST | `/api/auth/demo-login` | Demo authentication | Public |

## Environment Variables

**Backend** (`backend/src/main/resources/application-prod.properties`):
```properties
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
```

**Frontend** (`.env`):
```
VITE_API_URL=http://your-backend-url/api
```

## CI/CD

GitHub Actions workflow runs on every push to `main`/`develop`:
1. **Backend**: `mvn clean verify` (build + test)
2. **Frontend**: `npm ci && npm run lint && npm run build`
