# Liftup Monorepo

A modern full-stack monorepo featuring **Next.js 16** (App Router, Tailwind CSS, shadcn/ui), **NestJS 11** (Modular REST API), and **Neon Serverless PostgreSQL** with **Prisma ORM**, managed via **pnpm workspaces** and **Turborepo**.

---

## 🏗️ Structure

```
liftup/
│
├── apps/
│   ├── web/                 # Next.js 16 App Router (@liftup/web)
│   └── api/                 # NestJS 11 REST API (@liftup/api)
│
├── packages/
│   ├── types/               # Shared TypeScript types & DTOs (@liftup/types)
│   ├── config/              # Shared tsconfig presets (@liftup/config)
│   └── eslint-config/       # Shared linting configs (@liftup/eslint-config)
│
├── docs/
│   ├── architecture.md      # System architecture & component design
│   ├── database.md          # Neon DB setup & Prisma workflows
│   ├── api.md               # REST API documentation & specifications
│   └── roadmap.md           # Product & engineering roadmap
│
├── .gitignore
├── package.json             # Root orchestration scripts
├── pnpm-workspace.yaml      # pnpm workspace definition
├── turbo.json               # Turborepo task pipeline
└── README.md
```

---

## 🚀 Quick Start

### 1. Install Dependencies
```bash
pnpm install
```

### 2. Configure Database
1. Create a serverless PostgreSQL database at [neon.tech](https://neon.tech).
2. Copy your connection strings into `apps/api/.env` (refer to `apps/api/.env.example`):
```env
PORT=4000
DATABASE_URL="postgresql://[user]:[password]@[endpoint]-pooler.[region].aws.neon.tech/neondb?sslmode=require"
DIRECT_URL="postgresql://[user]:[password]@[endpoint].[region].aws.neon.tech/neondb?sslmode=require"
```

3. Push the Prisma schema to Neon:
```bash
pnpm prisma:push
```

### 3. Run Development Servers
Start both the web application and backend API concurrently with Turborepo:
```bash
pnpm dev
```

- **Web App**: [http://localhost:3000](http://localhost:3000)
- **API Server**: [http://localhost:4000/api](http://localhost:4000/api)
- **Health Check**: [http://localhost:4000/api/health](http://localhost:4000/api/health) (or via reverse proxy at `http://localhost:3000/api/health`)

---

## 🛠️ Monorepo Commands

| Command | Description |
|---|---|
| `pnpm dev` | Run all apps concurrently in development mode with Turborepo |
| `pnpm dev:web` | Start Next.js frontend development server only (`:3000`) |
| `pnpm dev:api` | Start NestJS backend development server only (`:4000`) |
| `pnpm start` | Start both frontend and backend production servers concurrently |
| `pnpm start:web` | Start Next.js production server only |
| `pnpm start:api` | Start NestJS backend production server only |
| `pnpm build` | Build all apps and packages |
| `pnpm build:web` | Build Next.js production bundle |
| `pnpm build:api` | Build NestJS server bundle |
| `pnpm test` | Run test suites across the monorepo |
| `pnpm lint` | Run linter across all workspaces |
| `pnpm prisma:generate` | Generate Prisma Client artifacts in `apps/api` |
| `pnpm prisma:push` | Push schema changes directly to Neon DB |
| `pnpm prisma:migrate` | Run database migrations |
| `pnpm prisma:studio` | Launch Prisma Studio web GUI |

---

## 📚 Documentation
For detailed guides and architecture, explore the [`docs/`](file:///c:/Users/habeebu/Desktop/Habeeb/Personal/liftup/docs) directory:
- [Architecture Guide](file:///c:/Users/habeebu/Desktop/Habeeb/Personal/liftup/docs/architecture.md)
- [Database & Neon Configuration](file:///c:/Users/habeebu/Desktop/Habeeb/Personal/liftup/docs/database.md)
- [API Specifications](file:///c:/Users/habeebu/Desktop/Habeeb/Personal/liftup/docs/api.md)
- [Project Roadmap](file:///c:/Users/habeebu/Desktop/Habeeb/Personal/liftup/docs/roadmap.md)
