import { auth } from "@clerk/nextjs/server";
import { SiteHeader } from "@/components/site-header";

type DashboardTask = { id: string; title: string; completed: boolean };

type RecentSession = {
  id: string;
  status: "active" | "completed" | "cancelled";
  actualDuration: number | null;
  xpEarned: number;
  startedAt: string;
  task: { title: string } | null;
};

type Dashboard = {
  focusedMinutes: number;
  sessionCount: number;
  tasks: DashboardTask[];
  recentSessions: RecentSession[];
};

function formatMinutes(minutes: number) {
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  if (hours === 0) return `${rest}m`;
  return `${hours}h ${String(rest).padStart(2, "0")}m`;
}

export default async function DashboardPage() {
  const { isAuthenticated, redirectToSignIn, getToken } = await auth();

  if (!isAuthenticated) {
    return redirectToSignIn();
  }

  const token = await getToken();
  const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001";
  let dashboard: Dashboard | null = null;

  if (token) {
    try {
      const response = await fetch(`${apiUrl}/dashboard`, {
        headers: { Authorization: `Bearer ${token}` },
        cache: "no-store",
      });
      if (response.ok) dashboard = (await response.json()) as Dashboard;
    } catch {
      dashboard = null;
    }
  }

  return (
    <main className="mx-auto min-h-screen max-w-3xl px-5 py-8 sm:px-6">
      <SiteHeader />
      <p className="mt-12 font-mono text-xs tracking-[0.18em] text-zinc-600">DASHBOARD</p>
      <h1 className="mt-2 text-3xl font-medium tracking-tight sm:text-4xl">Today</h1>
      {dashboard ? (
        <>
          <div className="mt-10 grid max-w-lg grid-cols-2 gap-3">
            <div className="rounded-2xl border border-zinc-800 px-5 py-4">
              <p className="font-mono text-xs tracking-[0.2em] text-zinc-500">FOCUS TIME</p>
              <p className="mt-3 text-3xl tabular-nums">{formatMinutes(dashboard.focusedMinutes)}</p>
            </div>
            <div className="rounded-2xl border border-zinc-800 px-5 py-4">
              <p className="font-mono text-xs tracking-[0.2em] text-zinc-500">SESSIONS</p>
              <p className="mt-3 text-3xl tabular-nums">{dashboard.sessionCount}</p>
            </div>
          </div>
          <section className="mt-12">
            <h2 className="font-mono text-xs tracking-[0.2em] text-zinc-500">TASKS</h2>
            {dashboard.tasks.length === 0 ? (
              <p className="mt-4 text-sm text-zinc-500">No open tasks.</p>
            ) : (
              <ul className="mt-4 divide-y divide-white/10">
                {dashboard.tasks.map((task) => (
                  <li key={task.id} className={`py-3 ${task.completed ? "text-zinc-500 line-through" : "text-zinc-100"}`}>
                    {task.title}
                  </li>
                ))}
              </ul>
            )}
          </section>
          <section className="mt-12">
            <h2 className="font-mono text-xs tracking-[0.2em] text-zinc-500">RECENT SESSIONS</h2>
            {dashboard.recentSessions.length === 0 ? (
              <p className="mt-4 text-sm text-zinc-500">No sessions yet.</p>
            ) : (
              <ul className="mt-4 divide-y divide-white/10">
                {dashboard.recentSessions.map((session) => (
                  <li key={session.id} className="flex flex-col gap-1 py-3 sm:flex-row sm:items-baseline sm:justify-between sm:gap-4">
                    <span>{session.task?.title ?? "Focus"}</span>
                    <span className="font-mono text-xs text-zinc-500">
                      {session.status} · {formatMinutes(Math.floor((session.actualDuration ?? 0) / 60))} · {session.xpEarned} XP
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </>
      ) : (
        <p className="mt-8 text-sm text-zinc-400">Could not load today.</p>
      )}
    </main>
  );
}
