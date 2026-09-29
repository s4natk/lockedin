import fs from "node:fs";
import path from "node:path";
import { defineConfig, devices } from "@playwright/test";

const webRoot = __dirname;
const repoRoot = path.resolve(webRoot, "../..");

function loadEnvFile(file: string) {
  if (!fs.existsSync(file)) return;

  for (const line of fs.readFileSync(file, "utf8").split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq === -1) continue;
    const key = trimmed.slice(0, eq).trim();
    let value = trimmed.slice(eq + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    if (process.env[key] === undefined) process.env[key] = value;
  }
}

loadEnvFile(path.join(webRoot, ".env.local"));
loadEnvFile(path.join(repoRoot, "apps/api/.env"));

if (!process.env.CLERK_PUBLISHABLE_KEY && process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY) {
  process.env.CLERK_PUBLISHABLE_KEY = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY;
}

process.env.E2E_CLERK_USER_EMAIL ??= "lockedin+clerk_test@example.com";

const baseURL = "http://localhost:3000";

export default defineConfig({
  testDir: path.join(webRoot, "e2e"),
  outputDir: path.join(webRoot, "test-results"),
  fullyParallel: false,
  workers: 1,
  timeout: 60_000,
  expect: { timeout: 15_000 },
  use: {
    baseURL,
    trace: "retain-on-failure",
  },
  webServer: [
    {
      command: "pnpm --filter @lockedin/api dev",
      url: "http://localhost:3001/health",
      reuseExistingServer: true,
      cwd: repoRoot,
      timeout: 120_000,
    },
    {
      command: "pnpm --filter @lockedin/web dev",
      url: baseURL,
      reuseExistingServer: true,
      cwd: repoRoot,
      timeout: 120_000,
    },
  ],
  projects: [
    {
      name: "global setup",
      testMatch: /global\.setup\.ts/,
    },
    {
      name: "chromium",
      testMatch: /.*\.spec\.ts/,
      use: {
        ...devices["Desktop Chrome"],
        storageState: path.join(webRoot, "playwright/.clerk/user.json"),
      },
      dependencies: ["global setup"],
    },
  ],
});
