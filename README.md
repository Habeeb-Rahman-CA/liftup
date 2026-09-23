# Liftup - Next.js, NestJS & Neon DB Monorepo

A modern full-stack template featuring **Next.js 16** (App Router, Tailwind CSS, shadcn/ui), **NestJS 11** (Modular REST API), and **Neon DB** (Serverless PostgreSQL) configured with **Prisma ORM**.

---

## 🏗️ Architecture

```
liftup/
├── frontend/             # Next.js 16 (React 19, Tailwind CSS v4, shadcn/ui)
│   ├── src/app/          # Next.js App Router
│   ├── src/components/ui # shadcn/ui components (Button, Card, Badge)
│   └── next.config.ts    # Configured with proxy to NestJS /api
├── backend/              # NestJS 11 (TypeScript, ESM, Vitest)
│   ├── src/prisma/       # PrismaService & PrismaModule
│   ├── src/health/       # Database & Server Health Check (/api/health)
│   ├── prisma/           # schema.prisma configured for Neon DB
│   └── .env.example      # Neon connection string templates
└── package.json          # Root npm workspaces orchestration
```

---

## 🚀 Quick Start

### 1. Configure Neon Database
1. Create a serverless PostgreSQL database at [neon.tech](https://neon.tech).
2. Copy your connection details into `backend/.env` (use `backend/.env.example` as a template):

```env
PORT=4000

# Pooled connection string (with ?sslmode=require) for queries:
DATABASE_URL="postgresql://[user]:[password]@[endpoint]-pooler.[region].aws.neon.tech/neondb?sslmode=require"

# Direct / unpooled connection string (without -pooler) for migrations:
DIRECT_URL="postgresql://[user]:[password]@[endpoint].[region].aws.neon.tech/neondb?sslmode=require"
```

3. Push your Prisma schema to Neon:
```bash
npm run prisma:push
```

### 2. Run the Development Servers
Start both frontend and backend concurrently:
```bash
npm run dev
```

- **Frontend**: [http://localhost:3000](http://localhost:3000)
- **Backend API**: [http://localhost:4000/api](http://localhost:4000/api)
- **Health Check**: [http://localhost:4000/api/health](http://localhost:4000/api/health) (or via frontend proxy: `http://localhost:3000/api/health`)

---

## 🛠️ Monorepo Scripts

| Command | Description |
|---|---|
| `npm run dev` | Run Next.js (`:3000`) and NestJS (`:4000`) concurrently |
| `npm run dev:frontend` | Start Next.js development server only |
| `npm run dev:backend` | Start NestJS development server with watch mode |
| `npm run build` | Build both frontend and backend |
| `npm run test` | Run backend test suites (Vitest) |
| `npm run prisma:push` | Push schema changes directly to Neon DB |
| `npm run prisma:migrate` | Create and apply Prisma migrations |
| `npm run prisma:studio` | Launch Prisma Studio GUI database browser |

---

## 🎨 Adding More shadcn/ui Components

To add more shadcn/ui components:
```bash
cd frontend
npx shadcn@latest add dialog dropdown-menu input
```

