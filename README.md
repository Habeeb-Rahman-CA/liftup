<p align="center">
  <picture>
    <source media="(prefers-color-scheme: dark)" srcset="apps/web/public/liftup-dark.png">
    <img src="apps/web/public/liftup-light.png" alt="LiftUp Icon" width="120">
  </picture>
</p>

# LiftUp

LiftUp is a minimalist, distraction-free strength and nutrition tracking application designed for lifters who want to focus on progressive overload and consistent habits without unnecessary clutter. Plan your weekly splits, log workouts set-by-set in real time, record your daily nutrition, and watch your numbers climb.

---

## Why LiftUp

Traditional fitness apps often overwhelm users with cluttered feeds, paywalled basic features, and confusing workflows. LiftUp is built around what actually matters to a lifter on the gym floor:

- Fast, frictionless logging: Start a workout in seconds, record weights and reps with minimal taps, and track rest intervals effortlessly.
- Clear progressive overload: Instantly see your previous session metrics so you always know what numbers you need to beat.
- Integrated nutrition: Connect your training routine with your meal plans and daily nutrition checklists to keep fueling consistent.
- Mobile and desktop ready: Responsive interface with progressive web app (PWA) support designed for smooth interaction on your phone at the gym.

---

## Core Features

### Active Workout Tracker
- Interactive live session recording with support for warmup and working sets.
- Log weight, repetitions, and Rate of Perceived Exertion (RPE) for every completed set.
- Set completion toggles, workout duration timers, and exercise sequencing.
- Flexibility to add spontaneous exercises, log rest days, or record skip reasons with notes.

### Routine and Schedule Builder
- Create structured weekly training splits (such as Push / Pull / Legs, Upper / Lower, or Full Body).
- Assign specific target rep ranges, set counts, and custom notes to individual workout days.
- Automatically loads today's planned routine based on the day of the week.

### Exercise Library
- Comprehensive movement catalog organized across major muscle groups: Chest, Back, Legs, Shoulders, Arms, Core, and Cardio.
- Step-by-step instructions, technique pointers, and movement guidelines.
- Quick search and filtering to easily find movements and add them to your routines or active sessions.

### Nutrition and Meal Planning
- Build personalized daily meal plans divided into customizable meal slots.
- Track macro-friendly food items with quantity and portion specifications.
- Interactive daily checklists to verify meals and food items as you eat throughout the day.
- Custom food library tracking calories, protein, carbohydrates, fats, and dietary fiber.

### Progress and History
- Comprehensive workout history review showing completed sessions, total logged volume, and notes.
- Performance charts and progression trends highlighting personal records and strength gains.
- Complete audit of daily nutrition logs and meal compliance over time.

---

## User Workflow

1. Plan Your Routine
   Define your weekly split in the Workout Schedules section. Assign movements to each day, designate target sets and rep brackets, and mark planned rest days.

2. Hit the Gym
   Open the Dashboard to see today's scheduled session. Select Start Workout to launch the active logger. Enter the weight and reps achieved on each set as you rest.

3. Fuel Your Recovery
   Check your Meals dashboard to view your nutrition targets for the day. Check off food items as you consume them to ensure you hit your macro goals.

4. Review Your Progress
   Visit the Progress tab to view your strength growth curves, volume benchmarks, and historical personal records.

---

## Quick Start

Follow these steps to run LiftUp locally on your machine.

### Prerequisites

- Node.js (version 20 or higher)
- pnpm (version 9 or higher)
- PostgreSQL database (or a free serverless instance from Neon)

### 1. Clone and Install Dependencies

```bash
git clone https://github.com/your-username/liftup.git
cd liftup
pnpm install
```

### 2. Configure Environment Variables

Create the API environment configuration:

```bash
cp apps/api/.env.example apps/api/.env
```

Update `DATABASE_URL` and `DIRECT_URL` in `apps/api/.env` with your PostgreSQL connection string:

```env
PORT=4000
DATABASE_URL="postgresql://user:password@endpoint-pooler.region.aws.neon.tech/neondb?sslmode=require"
DIRECT_URL="postgresql://user:password@endpoint.region.aws.neon.tech/neondb?sslmode=require"
JWT_SECRET="your-development-jwt-secret"
JWT_EXPIRES_IN="7d"
```

Push the database schema:

```bash
pnpm prisma:push
```

### 3. Start the Application

Run the web frontend and API backend concurrently:

```bash
pnpm dev
```

Once the servers start, open your browser:

- Web Application: [http://localhost:3000](http://localhost:3000)
- Backend REST API: [http://localhost:4000/api](http://localhost:4000/api)
- API Health Check: [http://localhost:4000/api/health](http://localhost:4000/api/health)

---

## Available Commands

| Command | Description |
| --- | --- |
| `pnpm dev` | Start web and API development servers concurrently |
| `pnpm dev:web` | Start Next.js frontend only (`:3000`) |
| `pnpm dev:api` | Start NestJS API backend only (`:4000`) |
| `pnpm build` | Build all applications and shared packages for production |
| `pnpm start` | Launch production servers |
| `pnpm test` | Execute unit and integration tests |
| `pnpm lint` | Run code quality and lint checks across the workspace |
| `pnpm prisma:studio` | Launch the Prisma Studio visual database editor |
| `pnpm prisma:push` | Synchronize Prisma schema definitions with the database |

---

## Architecture and Documentation

LiftUp is structured as a high-performance monorepo:

- `apps/web`: Next.js 16 App Router interface styled with Tailwind CSS and shadcn/ui.
- `apps/api`: Modular NestJS 11 REST API engine powered by Prisma ORM.
- `packages/types`: Shared TypeScript definitions and data transfer objects.
- `packages/config`: Centralized TypeScript configurations.
- `packages/eslint-config`: Shared linting configurations.

For deeper technical specifications, refer to the documentation:

- [System Architecture](docs/architecture.md)
- [Database Configuration](docs/database.md)
- [API Documentation](docs/api.md)

---

## License

This project is licensed under the MIT License.
