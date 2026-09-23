# Database Documentation

## Database Overview
Liftup uses **Neon Serverless PostgreSQL** paired with **Prisma ORM** for type-safe database queries and migrations.

---

## Neon Architecture & Connection Strategies

Neon provides serverless PostgreSQL with autoscaling and built-in connection pooling via PgBouncer.

```mermaid
flowchart LR
    AppServer["apps/api (NestJS)"] -->|DATABASE_URL (Pooled / Port 5432)| PgBouncer["Neon Connection Pooler"]
    PgBouncer --> NeonCompute["Neon PostgreSQL Compute"]
    
    Migrations["Prisma CLI (Migrations)"] -->|DIRECT_URL (Direct Connection)| NeonCompute
```

### Connection URLs
In `apps/api/.env`:

1. **`DATABASE_URL` (Pooled Connection)**
   - Used by the runtime NestJS application for querying.
   - Includes `-pooler` in the hostname and `?sslmode=require`.
   - Prevents connection exhaustion in serverless or highly concurrent environments.
   ```env
   DATABASE_URL="postgresql://[user]:[password]@[endpoint]-pooler.[region].aws.neon.tech/neondb?sslmode=require"
   ```

2. **`DIRECT_URL` (Direct Connection)**
   - Used specifically by Prisma for DDL operations, migrations, and advisory locking.
   - Bypasses PgBouncer.
   ```env
   DIRECT_URL="postgresql://[user]:[password]@[endpoint].[region].aws.neon.tech/neondb?sslmode=require"
   ```

---

## Prisma Schema Configuration

Located at `apps/api/prisma/schema.prisma`:

```prisma
datasource db {
  provider  = "postgresql"
  url       = env("DATABASE_URL")
  directUrl = env("DIRECT_URL")
}

generator client {
  provider = "prisma-client-js"
}
```

---

## Domain Models

### 1. User Domain
- `User`: Core identity, timezone, avatar, profile metadata.

### 2. Workout Domain
```mermaid
graph TD
    User["User"] -->|1:N| WorkoutSchedule["WorkoutSchedule (Template)"]
    WorkoutSchedule -->|1:N| WorkoutDay["WorkoutDay (e.g. Push Day)"]
    User -->|1:N| WorkoutSession["WorkoutSession (Status: PLANNED, IN_PROGRESS, COMPLETED, SKIPPED, REST)"]
    WorkoutDay -.->|Optional Reference| WorkoutSession
    WorkoutSession -->|1:N| ExerciseLog["ExerciseLog (order, note)"]
    Exercise["Exercise (Master Catalog)"] -->|1:N| ExerciseLog
    ExerciseLog -->|1:N| SetLog["SetLog (Type: WARMUP | WORKING, setNumber, reps, weight, completed, note)"]
```

#### Enums
- **`WorkoutSessionStatus`**: `PLANNED` \| `IN_PROGRESS` \| `COMPLETED` \| `SKIPPED` \| `REST`
- **`SetType`**: `WARMUP` \| `WORKING`

---

## Database Workflows & Commands

From the monorepo root:

| Command | Action | Description |
|---|---|---|
| `pnpm prisma:generate` | `prisma generate` | Generates the Prisma Client TypeScript artifacts. |
| `pnpm prisma:push` | `prisma db push` | Pushes the schema state directly to Neon without creating migration files (recommended for rapid prototyping). |
| `pnpm prisma:migrate` | `prisma migrate dev` | Creates and executes formal SQL migration scripts. |
| `pnpm prisma:studio` | `prisma studio` | Opens an interactive web GUI to view and edit database rows. |
