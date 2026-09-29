# LockedIn

LockedIn is a focus app for students who are tired of staring at a timer and having nothing to show for it.

You pick a task, pick how long you want to work, and start a session. Rain or a fireplace can sit in the background. When you finish, the time counts: XP, a level, and a streak if you put in at least 25 focused minutes that day. Keep going and you unlock achievements and a few study environments, from a quiet library to a cabin to a space station.

The useful part is the record. You can see how long you actually studied, which tasks got done, and how the week broke down. It sits somewhere between a Pomodoro timer, a study dashboard, and a small progression game.

## Stack

| Layer | Technology |
| --- | --- |
| Language | TypeScript |
| Frontend | Next.js (App Router), React, Tailwind CSS |
| Animation / charts | Motion, Recharts |
| Backend | NestJS (REST) |
| Database | MySQL via Prisma |
| Auth | Clerk |
| Tests | Vitest, Playwright |
| CI | GitHub Actions |
| Hosting | Vercel (web), Railway (API + MySQL) |

## Prerequisites

- Node.js 20 or newer
- pnpm 11
- MySQL 8 on `localhost:3306`
- A [Clerk](https://clerk.com) application

## Getting started

```bash
pnpm install
```

Copy `.env.example` to `apps/api/.env` and `apps/web/.env.local`. Fill in the Clerk keys in both files. The example database URL expects MySQL user `root`, password `password`, and a database named `lockedin`.

```bash
pnpm --filter @lockedin/api exec prisma generate --config prisma7.config.ts
pnpm --filter @lockedin/api exec prisma migrate deploy --config prisma7.config.ts
pnpm dev
```

The web app is at [http://localhost:3000](http://localhost:3000). The API is at [http://localhost:3001](http://localhost:3001), and `GET /health` returns `{ "status": "ok" }`.

In the Clerk dashboard, set the sign-in and sign-up paths to `/sign-in` and `/sign-up`, and allow `http://localhost:3000`.

## Checks

```bash
pnpm lint
pnpm typecheck
pnpm test
pnpm --filter @lockedin/api test:e2e
pnpm --filter @lockedin/web test:e2e
```

GitHub Actions runs lint, typecheck, the unit tests, and the API tests against MySQL. The Playwright walkthrough signs in through Clerk, so it stays a local command and uses the keys in your env files.

## Deploy

The web app goes to Vercel. The API and MySQL go to Railway. Set the URLs to point at each other, then redeploy the web app once so `NEXT_PUBLIC_API_URL` is baked into the client.

### Vercel

Import this repository and set the root directory to `apps/web`. `apps/web/vercel.json` installs the workspace and builds the shared package before Next.js.

Environment variables:

- `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`
- `CLERK_SECRET_KEY`
- `NEXT_PUBLIC_CLERK_SIGN_IN_URL` = `/sign-in`
- `NEXT_PUBLIC_CLERK_SIGN_UP_URL` = `/sign-up`
- `NEXT_PUBLIC_CLERK_SIGN_IN_FALLBACK_REDIRECT_URL` = `/`
- `NEXT_PUBLIC_CLERK_SIGN_UP_FALLBACK_REDIRECT_URL` = `/`
- `NEXT_PUBLIC_API_URL` = the public Railway API URL

In Clerk, add the Vercel domain to the allowed origins.

### Railway

The API service and a MySQL database are described in `.railway/railway.ts`. From the repo root, with the [Railway CLI](https://docs.railway.com/cli) installed and this project linked:

```bash
pnpm add -Dw railway
railway login
railway link
railway config apply
```

`apply` creates the API and MySQL, wires `DATABASE_URL` to MySQL, and runs migrations before the process starts. The health check is `GET /health`.

After the first apply, set these on the API service. Later applies keep the values you already saved.

- `CLERK_SECRET_KEY`
- `FRONTEND_URL` = the Vercel URL, for example `https://your-app.vercel.app`

Copy the API's public URL into `NEXT_PUBLIC_API_URL` on Vercel and redeploy the web app.

## Out of scope for v1

Redis, WebSockets, Docker, Kubernetes, AI features, Spotify, leaderboards, friends, notifications, and a mobile app.
