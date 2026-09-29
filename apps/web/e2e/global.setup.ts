import { randomBytes } from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { createClerkClient } from "@clerk/backend";
import { clerk, clerkSetup } from "@clerk/testing/playwright";
import { test as setup } from "@playwright/test";

setup.describe.configure({ mode: "serial" });

const authFile = path.join(__dirname, "../playwright/.clerk/user.json");
const email = process.env.E2E_CLERK_USER_EMAIL ?? "lockedin+clerk_test@example.com";

setup("configure Clerk", async () => {
  await clerkSetup({ dotenv: false });

  const secretKey = process.env.CLERK_SECRET_KEY;
  if (!secretKey) {
    throw new Error("CLERK_SECRET_KEY is missing. Add it to apps/api/.env before running Playwright.");
  }

  const client = createClerkClient({ secretKey });
  const { data: users } = await client.users.getUserList({ emailAddress: [email] });

  if (users.length === 0) {
    await client.users.createUser({
      emailAddress: [email],
      password: `Li-${randomBytes(18).toString("base64url")}aA1!`,
      firstName: "Locked",
      lastName: "In",
    });
  }
});

setup("authenticate", async ({ page }) => {
  fs.mkdirSync(path.dirname(authFile), { recursive: true });

  await page.goto("/");
  await clerk.signIn({ page, emailAddress: email });
  await page.goto("/focus");
  await page.getByRole("heading", { name: "Focus" }).waitFor();
  await page.context().storageState({ path: authFile });
});
