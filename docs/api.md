# REST API Documentation

## Base URLs

- **Direct API Base**: `http://localhost:4000/api/v1`
- **Frontend Reverse Proxy**: `http://localhost:3000/api/v1`
- **Interactive Swagger / OpenAPI Docs**: `http://localhost:4000/api/docs`

---

## API Versioning

Liftup API uses **URI-based versioning**:

- Prefix: `/api/v1/`
- Example: `/api/v1/health`, `/api/v1/workouts`, `/api/v1/users`

---

## Response & Error Conventions

All API responses follow the contracts defined in `@liftup/types`.

### Standard Success Structure

```json
{
  "success": true,
  "data": {},
  "timestamp": "2026-09-23T12:00:00.000Z"
}
```

### Standard Error Structure (`AllExceptionsFilter`)

```json
{
  "success": false,
  "statusCode": 400,
  "error": {
    "code": "BAD_REQUEST",
    "message": "Validation failed on field 'email'",
    "details": ["email must be a valid email address"]
  },
  "path": "/api/v1/users",
  "timestamp": "2026-09-23T12:00:00.000Z"
}
```

---

## Logging & Observability

All inbound HTTP calls are automatically logged by `LoggingInterceptor`:

- Format: `[METHOD] /url STATUS_CODE - LATENCYms [IP: ...] [Agent: ...]`
- Error logging with execution timings and stack traces on 5xx failures.

---

## Core Endpoints

### 1. Health Check

Checks the operating status of the NestJS server and its connectivity/latency to the Neon PostgreSQL database.

- **URL**: `GET /api/v1/health`
- **Access**: Public
- **Success Response (200 OK)**:

```json
{
  "status": "ok",
  "service": "liftup-api",
  "version": "v1",
  "timestamp": "2026-09-23T12:00:00.000Z",
  "database": {
    "provider": "Neon (PostgreSQL)",
    "status": "connected",
    "latencyMs": 18
  }
}
```
