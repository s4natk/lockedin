# LockedIn

LockedIn is a focus app for students who are tired of staring at a timer and having nothing to show for it.

You pick a task, pick how long you want to work, and start a session. Rain, a fireplace, whatever you want in the background. When you finish, the time counts: XP, a level, a streak if you put in at least 25 focused minutes that day. Keep going and you unlock achievements and a few study environments, from a quiet library to a cabin to a space station.

The useful part is the record. You can see how long you actually studied, which tasks got done, and how the week broke down between school, projects, LeetCode, and reading. It sits somewhere between a Pomodoro timer, a study dashboard, and a small progression game. The game part is the levels and the unlocks. The rest is just a clean place to work.

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
