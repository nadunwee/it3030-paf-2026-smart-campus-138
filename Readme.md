# IT3030 PAF 2026 - Smart Campus Operations Hub

Backend implementation for **Module A: Facilities & Assets Catalogue** using **Spring Boot**.

## What Is Implemented

### Module A - Facilities / Resource Management (Backend)
- REST API base path: `http://localhost:8080/api/v1`
- Resource entity support for:
  - `type` (`LECTURE_HALL`, `LAB`, `MEETING_ROOM`, `EQUIPMENT`)
  - `capacity`
  - `location`
  - `status` (`ACTIVE`, `OUT_OF_SERVICE`)
  - `availabilityWindows` (`startDateTime`, `endDateTime`)
  - soft delete (`deleted` flag)

### Endpoints
- `GET /resources`
  - Optional filters: `type`, `capacityMin`, `location`, `status`, `availableOn`
  - Pagination: `page`, `size`
- `GET /resources/{id}`
- `POST /resources` (ADMIN only)
- `PATCH /resources/{id}` (ADMIN only)
- `DELETE /resources/{id}` (ADMIN only, soft delete)

### Security (current phase)
- Spring Security with HTTP Basic auth
- In-memory users:
  - `user` / `user123` -> role `USER`
  - `admin` / `admin123` -> role `ADMIN`
- Access rules:
  - `USER`: read-only (`GET`) and only active resources
  - `ADMIN`: full access to create/update/delete

### Validation & Error Handling
- Request validation with Jakarta Validation
- Availability window validation: `endDateTime` must be after `startDateTime`
- Structured API errors via `@RestControllerAdvice` (`400`, `403`, `404`, `500`)

### Persistence
- MySQL for normal app run (`application.yml`)
- H2 only for test scope (`application-test.yml`)

### Testing
- Integration tests for:
  - role restrictions
  - active-only visibility for USER
  - `availableOn` filtering
  - admin patch update

---

## Tech Stack
- Java 17
- Spring Boot 3.3.2
- Spring Web
- Spring Data JPA
- Spring Security
- MySQL Connector/J
- H2 (test only)
- Maven

---

## Project Prerequisites

Install the following:
- JDK 17
- Maven 3.9+
- MySQL Server 8+

---

## MySQL Setup

1. Log into MySQL as root (or another privileged user).
2. Create database:

```sql
CREATE DATABASE IF NOT EXISTS smartcampus
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;
```

3. Option A (quick local): use root credentials directly.
4. Option B (recommended): create a dedicated DB user.

```sql
CREATE USER IF NOT EXISTS 'smartcampus'@'localhost' IDENTIFIED BY 'your_password';
GRANT ALL PRIVILEGES ON smartcampus.* TO 'smartcampus'@'localhost';
FLUSH PRIVILEGES;
```

---

## Run the Backend

From project root (`.../it3030-paf-2026-smart-campus`), in PowerShell:

```powershell
$env:DB_HOST="localhost"
$env:DB_PORT="3306"
$env:DB_NAME="smartcampus"
$env:DB_USER="root"
$env:DB_PASSWORD="your_mysql_password"

mvn spring-boot:run
```

If startup succeeds, API will be available at:
- `http://localhost:8080`

---

## Quick API Test Commands

### 1) Get resources as USER
```powershell
curl.exe -u user:user123 "http://localhost:8080/api/v1/resources?size=5"
```

### 2) Create resource as ADMIN
```powershell
curl.exe -i -u admin:admin123 `
  -H "Content-Type: application/json" `
  -d '{
    "type":"LAB",
    "capacity":30,
    "location":"Lab 1",
    "status":"ACTIVE",
    "availabilityWindows":[
      {"startDateTime":"2026-03-23T10:00:00Z","endDateTime":"2026-03-23T12:00:00Z"}
    ]
  }' `
  -X POST "http://localhost:8080/api/v1/resources"
```

### 3) Patch resource (replace `<ID>`)
```powershell
curl.exe -i -u admin:admin123 `
  -H "Content-Type: application/json" `
  -d '{ "capacity": 99 }' `
  -X PATCH "http://localhost:8080/api/v1/resources/<ID>"
```

### 4) Soft-delete resource (replace `<ID>`)
```powershell
curl.exe -i -u admin:admin123 `
  -X DELETE "http://localhost:8080/api/v1/resources/<ID>"
```

---

## Run Tests

```powershell
mvn test
```

---

## Troubleshooting

- `Unknown database 'smartcampus'`
  - Create the database in MySQL.
- `Access denied for user ...`
  - Check `DB_USER` and `DB_PASSWORD`.
- Port conflict on `8080`
  - Stop existing process on port 8080 or change server port.

---

## Current Scope Note

This repository currently includes backend work focused on **Module A only** (Facilities & Assets Catalogue).  
Modules B, C, D, E and the React frontend can be added in later phases.