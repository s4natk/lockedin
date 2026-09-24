import { Show, SignInButton, UserButton } from "@clerk/nextjs";
import Link from "next/link";
import { auth } from "@clerk/nextjs/server";
import { STREAK_MINIMUM_MINUTES } from "@lockedin/shared";

async function SignedInEmail() {
  const { isAuthenticated, getToken } = await auth();
  if (!isAuthenticated) return null;

  const token = await getToken();
  if (!token) return null;

  const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001";

  let email: string | null = null;

  try {
    const response = await fetch(`${apiUrl}/users/me`, {
      headers: { Authorization: `Bearer ${token}` },
      cache: "no-store",
    });
    if (!response.ok) return null;
    const user = (await response.json()) as { email: string };
    email = user.email;
  } catch {
    return null;
  }

  return <p className="font-mono text-xs text-zinc-500">{email}</p>;
}

export default function Home() {
  return (
    <main className="mx-auto flex min-h-screen max-w-3xl flex-col justify-between px-6 py-8">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-6">
          <p className="font-mono text-xs tracking-[0.28em] text-zinc-500">LOCKEDIN</p>
          <Link href="/tasks" className="text-sm text-zinc-400">
            Categories
          </Link>
        </div>
        <Show when="signed-out">
          <SignInButton>
            <button
              type="button"
              className="rounded-full border border-zinc-700 px-4 py-2 text-sm text-zinc-200"
            >
              Sign in
            </button>
          </SignInButton>
        </Show>
        <Show when="signed-in">
          <div className="flex items-center gap-4">
            <SignedInEmail />
            <UserButton />
          </div>
        </Show>
      </div>

      <div>
        <h1 className="max-w-xl text-5xl leading-tight font-medium tracking-tight">
          Sit down. Finish the session.
        </h1>
        <p className="mt-5 max-w-md text-lg text-zinc-400">
          Pick a task, start a timer, and keep the hours, the streak, and the XP.
        </p>
      </div>

      <p className="font-mono text-xs text-zinc-600">
        {STREAK_MINIMUM_MINUTES} minutes is enough to keep the streak.
      </p>
    </main>
  );
}
