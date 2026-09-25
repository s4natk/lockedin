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

type Progression = {
  totalXp: number;
  level: number;
  currentLevelXp: number;
  nextLevelXp: number;
  currentStreak: number;
  longestStreak: number;
};

async function HomeProgress() {
  const { isAuthenticated, getToken } = await auth();
  if (!isAuthenticated) return null;

  const token = await getToken();
  if (!token) return null;

  const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001";
  let progression: Progression | null = null;

  try {
    const response = await fetch(`${apiUrl}/progression`, {
      headers: { Authorization: `Bearer ${token}` },
      cache: "no-store",
    });
    if (!response.ok) return null;
    progression = (await response.json()) as Progression;
  } catch {
    return null;
  }

  const span = progression.nextLevelXp - progression.currentLevelXp;
  const intoLevel = Math.max(0, progression.totalXp - progression.currentLevelXp);
  const progress = span <= 0 ? 0 : Math.min(1, intoLevel / span);

  return (
    <div className="mt-10 max-w-md">
      <div className="flex items-baseline justify-between gap-4">
        <p className="font-mono text-xs tracking-[0.2em] text-zinc-500">LEVEL {progression.level}</p>
        <p className="font-mono text-xs text-zinc-400">{progression.currentStreak} day streak</p>
      </div>
      <div className="mt-3 h-1 overflow-hidden rounded-full bg-zinc-800">
        <div className="h-full bg-zinc-100" style={{ width: `${progress * 100}%` }} />
      </div>
      <p className="mt-3 font-mono text-xs text-zinc-500">
        {progression.totalXp} / {progression.nextLevelXp} XP · longest {progression.longestStreak}
      </p>
    </div>
  );
}

export default function Home() {
  return (
    <main className="mx-auto flex min-h-screen max-w-3xl flex-col justify-between px-6 py-8">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-6">
          <p className="font-mono text-xs tracking-[0.28em] text-zinc-500">LOCKEDIN</p>
          <Link href="/tasks" className="text-sm text-zinc-400">
            Tasks
          </Link>
          <Link href="/focus" className="text-sm text-zinc-400">
            Focus
          </Link>
          <Link href="/dashboard" className="text-sm text-zinc-400">
            Dashboard
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
        <HomeProgress />
      </div>

      <p className="font-mono text-xs text-zinc-600">
        {STREAK_MINIMUM_MINUTES} minutes is enough to keep the streak.
      </p>
    </main>
  );
}
