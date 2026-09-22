# LockedIn

Gamified productivity for students. Focus sessions become progression: pick a task, choose a focus mode, study, earn XP, keep a streak, and unlock achievements.

The core loop is **choose task → choose focus mode → focus → complete session → earn XP → maintain streak → review productivity**.

## Stack

| Layer | Technology |
| --- | --- |
| Language | TypeScript |
| Frontend | Next.js (App Router), React, Tailwind CSS, shadcn/ui |
| Animation / charts | Motion, Recharts |
| Client data | TanStack Query |
| Backend | NestJS (REST) |
| Database | MySQL via Prisma |
| Auth | Clerk |
| Tests | Vitest, Playwright, Jest |
| CI | GitHub Actions |
| Hosting | Vercel (web), Railway (API + MySQL) |

## Architecture

```text
User
  │
  ▼
Next.js  (apps/web)
  │  HTTPS / REST
  ▼
NestJS   (apps/api)
  │  Prisma
  ▼
MySQL

Clerk authenticates the browser session.
The API validates the Clerk session token on each request.
```

```text
lockedin/
├── apps/
│   ├── web/          Next.js
│   └── api/          NestJS
├── packages/
│   └── shared/       Shared TypeScript types and constants
├── package.json
├── pnpm-workspace.yaml
└── tsconfig.base.json
```

XP, streaks, and achievements are calculated on the server inside a database transaction. The client never submits an XP amount.

## Prerequisites

- Node.js 20 or newer
- pnpm 11
- MySQL 8 (local or Railway), added when the API schema lands
- A Clerk application, added when authentication lands

## Getting started

```bash
pnpm install
pnpm dev
```

Copy `.env.example` to `.env` files inside each app once those apps exist. Do not commit secrets.

## Out of scope for v1

Redis, WebSockets, Docker, Kubernetes, AI features, Spotify, leaderboards, friends, notifications, and a mobile app.
