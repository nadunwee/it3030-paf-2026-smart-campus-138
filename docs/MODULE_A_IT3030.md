# Module A: IT3030 PDF requirements vs this project

This document maps **Module A – Facilities & Assets Catalogue** from the IT3030 PAF Assignment 2026 to the **smart-campus-fullstack** implementation. Other modules (B–E) are out of scope here.

## What the assignment requires (Module A)

1. **Catalogue of bookable resources**: lecture halls, labs, meeting rooms, and equipment (e.g. projectors, cameras).
2. **Per-resource metadata**: type, capacity, location, availability windows, and status (e.g. ACTIVE / OUT_OF_SERVICE).
3. **Search and filtering**, e.g. by type, capacity, and location.

## Implementation mapping

### Resource types

| PDF expectation | Implementation |
|-----------------|----------------|
| Lecture halls, labs, meeting rooms, equipment | `ResourceType`: `LECTURE_HALL`, `LAB`, `MEETING_ROOM`, `EQUIPMENT` — see `backend/src/main/java/com/it3030/paf/smartcampus/domain/enums/ResourceType.java` |

Equipment is one category; specific devices (projector vs camera) are separate resource records, not separate enum values.

### Metadata

| Field | Implementation |
|-------|----------------|
| Type, capacity, location, availability windows, status | `FacilityResource` entity and DTOs under `backend/.../domain` and `backend/.../api/dto` |
| Status ACTIVE / OUT_OF_SERVICE | `ResourceStatus` enum: `ACTIVE`, `OUT_OF_SERVICE` |

### Search and filtering

| PDF expectation | Implementation |
|-----------------|----------------|
| By type, capacity, location | `GET /api/v1/resources` query params: `type`, `capacityMin`, `location`, plus `status` (admin), `availableOn`, pagination — `ResourceController` + `FacilityResourceService` + `FacilityResourceSpecifications` |

Non-admin users only see **ACTIVE** resources in list/detail (enforced in service layer).

### React UI

| Area | Location |
|------|----------|
| Facilities & Assets Catalogue (search, filters, table, pagination) | `frontend/src/app/pages/FacilitiesCatalogue.tsx` |
| Resource detail (metadata + availability windows) | `frontend/src/app/pages/ResourceDetail.tsx` |
| Create / edit resource | `frontend/src/app/pages/ResourceForm.tsx` |
| Nav: Facilities, Add resource (admin) | `frontend/src/app/components/Navbar.tsx` |
| Dashboard module card → catalogue | `frontend/src/app/pages/Dashboard.tsx` |

## Workspace note

The **`it3030-paf-2026-smart-campus`** template (if present elsewhere) may still be a bare Vite starter unless you have merged this app into it. The **authoritative Module A implementation** for this repo is under **smart-campus-fullstack**.

## Authentication (operator note)

Public pages do **not** display demo passwords. Users may **self-register** via `POST /api/v1/auth/register` (role **USER**). The first **ADMIN** is created at startup when none exists; set `ADMIN_USERNAME` and `ADMIN_PASSWORD` in deployment. See the repository [**README**](../README.md).

## Beyond Module A (full assignment)

Not covered by Module A alone:

- **Modules B–D**: Bookings, maintenance tickets, notifications — separate features.
- **Module E (OAuth 2.0)**: Sign-in still uses **HTTP Basic** against the API; OAuth would be an additional implementation.
