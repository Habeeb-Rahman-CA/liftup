# Project Roadmap

## Phase 1: Monorepo Foundation & Tooling (Completed)
- [x] Configure **pnpm workspaces** and **Turborepo** task pipeline.
- [x] Migrate frontend to `apps/web` (Next.js 16 + shadcn/ui + Tailwind CSS v4).
- [x] Migrate backend to `apps/api` (NestJS 11 + Prisma ORM + Neon PostgreSQL).
- [x] Establish shared packages (`@liftup/types`, `@liftup/config`, `@liftup/eslint-config`).
- [x] Set up health check endpoints and reverse proxy orchestration.

---

## Phase 2: Authentication & Authorization (Next Up)
- [ ] Implement user authentication (JWT / Session-based with NextAuth / Auth0 / Supabase / Custom NestJS Passport).
- [ ] User schema definition in `apps/api/prisma/schema.prisma`.
- [ ] Role-Based Access Control (RBAC) guards in NestJS (`@Roles('ADMIN')`).
- [ ] Shared user session context and authentication middleware in `apps/web`.

---

## Phase 3: Core Domain Features
- [ ] Define core database models and relations.
- [ ] CRUD controllers, services, and DTO validation with `class-validator` / `zod`.
- [ ] Client data fetching integration with React Query / SWR / Server Actions.
- [ ] UI design system expansion with additional shadcn/ui components.

---

## Phase 4: DevOps, CI/CD & Observability
- [ ] GitHub Actions workflow for linting, testing, and Turborepo remote caching.
- [ ] Automated Neon database migration execution on deploy.
- [ ] Containerization with Docker multi-stage builds.
- [ ] OpenTelemetry logging and Sentry error tracking.
