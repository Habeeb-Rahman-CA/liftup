# REST API Documentation

## Base URLs
- **Direct API**: `http://localhost:4000/api`
- **Frontend Reverse Proxy**: `http://localhost:3000/api`

---

## Response Conventions

All API endpoints follow standardized JSON response structures defined in `@liftup/types`.

### Standard Success Structure
```json
{
  "success": true,
  "data": {},
  "message": "Operation completed successfully",
  "timestamp": "2026-09-23T12:00:00.000Z"
}
```

### Standard Error Structure
```json
{
  "success": false,
  "error": {
    "code": "BAD_REQUEST",
    "details": "Validation failed on field 'email'"
  },
  "timestamp": "2026-09-23T12:00:00.000Z"
}
```

---

## Core Endpoints

### 1. Health Check
Checks the operating status of the NestJS server and its connectivity/latency to the Neon PostgreSQL database.

- **URL**: `GET /api/health`
- **Access**: Public
- **Success Response (200 OK)**:
```json
{
  "status": "ok",
  "service": "liftup-api",
  "timestamp": "2026-09-23T12:00:00.000Z",
  "database": {
    "provider": "Neon (PostgreSQL)",
    "status": "connected",
    "latencyMs": 18
  }
}
```
- **Error Response (200 / 503 Service Unavailable)**:
```json
{
  "status": "error",
  "service": "liftup-api",
  "timestamp": "2026-09-23T12:00:00.000Z",
  "database": {
    "provider": "Neon (PostgreSQL)",
    "status": "disconnected",
    "error": "Connection timeout"
  }
}
```
