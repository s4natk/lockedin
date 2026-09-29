import { defineRailway, github, mysql, preserve, project, service } from "railway/iac";

const build = [
  "pnpm install --frozen-lockfile --prod=false",
  "pnpm --filter @lockedin/shared build",
  "pnpm --filter @lockedin/api exec prisma generate --config prisma7.config.ts",
  "pnpm --filter @lockedin/api build",
].join(" && ");

export default defineRailway(() => {
  const db = mysql("mysql");

  const api = service("api", {
    source: github("s4natk/lockedin", { branch: "main" }),
    build,
    preDeploy: "pnpm --filter @lockedin/api exec prisma migrate deploy --config prisma7.config.ts",
    start: "pnpm --filter @lockedin/api start:prod",
    healthcheck: "/health",
    healthcheckTimeout: 120,
    env: {
      DATABASE_URL: db.env.MYSQL_URL,
      FRONTEND_URL: preserve(),
      CLERK_SECRET_KEY: preserve(),
    },
  });

  return project("lockedin", {
    resources: [db, api],
  });
});
