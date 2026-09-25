import { auth } from "@clerk/nextjs/server";
import Link from "next/link";

type HistorySession = {
  id: string;
  mode: string;
  status: "active" | "completed" | "cancelled";
  plannedDuration: number;
  actualDuration: number | null;
  xpEarned: number;
  startedAt: string;
  task: { title: string } | null;
};

function formatMinutes(seconds: number | null) {
  const minutes = Math.floor((seconds ?? 0) / 60);
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  if (hours === 0) return `${rest}m`;
  return `${hours}h ${String(rest).padStart(2, "0")}m`;
}

export default async function HistoryPage() {
  const { isAuthenticated, redirectToSignIn, getToken } = await auth();

  if (!isAuthenticated) {
    return redirectToSignIn();
  }

  const token = await getToken();
  const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001";
  let sessions: HistorySession[] | null = null;

  if (token) {
    try {
      const response = await fetch(`${apiUrl}/sessions`, {
        headers: { Authorization: `Bearer ${token}` },
        cache: "no-store",
      });
      if (response.ok) sessions = (await response.json()) as HistorySession[];
    } catch {
      sessions = null;
    }
  }

  return (
    <main className="mx-auto min-h-screen max-w-3xl px-6 py-8">
      <div className="flex items-center gap-6">
        <p className="font-mono text-xs tracking-[0.28em] text-zinc-500">LOCKEDIN</p>
        <Link href="/" className="text-sm text-zinc-400">
          Home
        </Link>
        <Link href="/focus" className="text-sm text-zinc-400">
          Focus
        </Link>
      </div>
      <h1 className="mt-10 text-4xl font-medium tracking-tight">History</h1>
      {sessions ? (
        sessions.length === 0 ? (
          <p className="mt-8 text-sm text-zinc-500">No sessions yet.</p>
        ) : (
          <ul className="mt-10 space-y-4">
            {sessions.map((session) => (
              <li key={session.id} className="flex items-baseline justify-between gap-4">
                <span>{session.task?.title ?? "Focus"}</span>
                <span className="shrink-0 font-mono text-xs text-zinc-500">
                  {session.status} · {formatMinutes(session.actualDuration ?? session.plannedDuration)} ·{" "}
                  {session.xpEarned} XP
                </span>
              </li>
            ))}
          </ul>
        )
      ) : (
        <p className="mt-8 text-sm text-zinc-400">Could not load history.</p>
      )}
    </main>
  );
}
