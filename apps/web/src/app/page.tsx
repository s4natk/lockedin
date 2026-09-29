import { Show, SignInButton, UserButton } from "@clerk/nextjs";
import Link from "next/link";
import { auth } from "@clerk/nextjs/server";
import { STREAK_MINIMUM_MINUTES } from "@lockedin/shared";
import { SiteHeader } from "@/components/site-header";
import { StatusMessage } from "@/components/status-message";

const steps = [
  {
    number: "01",
    title: "Pick a task",
    body: "Name the category, then the assignment you are actually going to finish.",
  },
  {
    number: "02",
    title: "Run the timer",
    body: "Pomodoro, deep work, or a length you choose. Pause if you have to leave.",
  },
  {
    number: "03",
    title: "Keep the record",
    body: "The session becomes XP, a streak, and a week you can look back at.",
  },
];

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
  let failed = false;

  try {
    const response = await fetch(`${apiUrl}/progression`, {
      headers: { Authorization: `Bearer ${token}` },
      cache: "no-store",
    });
    if (!response.ok) failed = true;
    else progression = (await response.json()) as Progression;
  } catch {
    failed = true;
  }

  if (failed || !progression) {
    return <StatusMessage>Could not load your progress.</StatusMessage>;
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
    <main className="mx-auto flex min-h-screen max-w-5xl flex-col px-5 py-8 sm:px-8">
      <SiteHeader showNav={false} wordmarkClass="text-zinc-300">
        <Show when="signed-out">
          <SignInButton>
            <button
              type="button"
              className="shrink-0 rounded-full border border-zinc-700 px-4 py-2 text-sm whitespace-nowrap text-zinc-200"
            >
              Sign in
            </button>
          </SignInButton>
        </Show>
        <Show when="signed-in">
          <div className="flex shrink-0 items-center gap-4">
            <SignedInEmail />
            <UserButton />
          </div>
        </Show>
      </SiteHeader>

      <div className="pt-16 sm:pt-24">
        <h1 className="max-w-xl text-4xl leading-[1.05] font-medium tracking-tight sm:text-5xl">
          Sit down.
          <br />
          Finish the session.
        </h1>
        <p className="mt-5 max-w-md text-lg leading-relaxed text-zinc-400">
          A timer for the assignment in front of you. The hours, the streak, and the XP stay with it.
        </p>
        <div className="mt-8 flex flex-wrap gap-3">
          <Show when="signed-out">
            <SignInButton>
              <button
                type="button"
                className="rounded-full bg-zinc-100 px-5 py-2.5 text-sm text-zinc-950"
              >
                Sign in
              </button>
            </SignInButton>
          </Show>
          <Show when="signed-in">
            <Link
              href="/focus"
              className="rounded-full bg-zinc-100 px-5 py-2.5 text-sm text-zinc-950"
            >
              Start a session
            </Link>
            <Link
              href="/tasks"
              className="rounded-full border border-zinc-700 px-5 py-2.5 text-sm text-zinc-200"
            >
              Tasks
            </Link>
          </Show>
        </div>
        <HomeProgress />
      </div>

      <section className="mt-20 border-t border-white/10 pt-10 sm:mt-28">
        <p className="font-mono text-xs tracking-[0.18em] text-zinc-600">A SESSION</p>
        <ol className="mt-8 grid gap-8 sm:grid-cols-3 sm:gap-0">
          {steps.map((step) => (
            <li key={step.number} className="sm:border-l sm:border-white/10 sm:px-6 sm:first:border-l-0 sm:first:pl-0">
              <p className="font-mono text-xs text-zinc-600">{step.number}</p>
              <h2 className="mt-3 text-base font-medium">{step.title}</h2>
              <p className="mt-2 max-w-xs text-sm leading-relaxed text-zinc-500">{step.body}</p>
            </li>
          ))}
        </ol>
      </section>

      <p className="mt-20 font-mono text-xs text-zinc-600">
        {STREAK_MINIMUM_MINUTES} minutes is enough to keep the streak.
      </p>
    </main>
  );
}
