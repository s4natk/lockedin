"use client";

import { useAuth } from "@clerk/nextjs";
import { FOCUS_MODE_IDS, FOCUS_MODES, type FocusModeId } from "@lockedin/shared";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { AmbientAudio } from "./ambient-audio";
import { formatRemaining, useFocusTimer } from "./use-focus-timer";

type Task = { id: string; title: string };

type Session = {
  id: string;
  mode: FocusModeId;
  plannedDuration: number;
  expectedEndAt: string;
  pausedAt: string | null;
  task: { id: string; title: string } | null;
};

type Completion = {
  xpEarned: number;
  bonusXp: number;
  bonusKind: "first" | "third" | null;
  streakBonus: number;
  totalXp: number;
  level: number;
  currentStreak: number;
};

const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001";

export function FocusSession() {
  const { getToken } = useAuth();
  const searchParams = useSearchParams();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [taskId, setTaskId] = useState(searchParams.get("task") ?? "");
  const [mode, setMode] = useState<FocusModeId>("pomodoro");
  const [focusMinutes, setFocusMinutes] = useState(25);
  const [session, setSession] = useState<Session | null>(null);
  const [completion, setCompletion] = useState<Completion | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const { remainingSeconds, progress } = useFocusTimer(
    session?.expectedEndAt ?? null,
    session?.plannedDuration ?? 0,
    session?.pausedAt ?? null,
  );

  const load = useCallback(async () => {
    const token = await getToken();
    if (!token) return;

    const headers = { Authorization: `Bearer ${token}` };
    const [taskResponse, activeResponse] = await Promise.all([
      fetch(`${apiUrl}/tasks`, { headers }),
      fetch(`${apiUrl}/sessions/active`, { headers }),
    ]);

    if (!taskResponse.ok || !activeResponse.ok) {
      setError("Could not load the focus session.");
      return;
    }

    const nextTasks = (await taskResponse.json()) as Task[];
    setTasks(nextTasks);
    setTaskId((current) => current || searchParams.get("task") || nextTasks[0]?.id || "");

    const active = (await activeResponse.json()) as Session | null;
    if (active) setSession(active);
  }, [getToken, searchParams]);

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      void load();
    }, 0);

    return () => window.clearTimeout(timeout);
  }, [load]);

  async function start(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setPending(true);
    const token = await getToken();
    if (!token) return;

    const response = await fetch(`${apiUrl}/sessions/start`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        mode,
        taskId,
        ...(mode === "custom" ? { focusMinutes } : {}),
      }),
    });
    setPending(false);

    if (!response.ok) {
      setError(response.status === 409 ? "A session is already running." : "Could not start.");
      return;
    }

    setCompletion(null);
    setSession((await response.json()) as Session);
  }

  async function finish() {
    if (!session || pending) return;
    setPending(true);
    setError(null);
    const token = await getToken();
    if (!token) return;

    const response = await fetch(`${apiUrl}/sessions/${session.id}/complete`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
    });
    setPending(false);

    if (!response.ok) {
      setError("Could not finish the session.");
      return;
    }

    setCompletion((await response.json()) as Completion);
    setSession(null);
  }

  async function cancel() {
    if (!session || pending) return;
    setPending(true);
    setError(null);
    const token = await getToken();
    if (!token) return;

    const response = await fetch(`${apiUrl}/sessions/${session.id}/cancel`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
    });
    setPending(false);

    if (!response.ok) {
      setError("Could not cancel the session.");
      return;
    }

    setSession(null);
  }

  async function togglePause() {
    if (!session || pending) return;
    setPending(true);
    setError(null);
    const token = await getToken();
    if (!token) return;

    const action = session.pausedAt ? "resume" : "pause";
    const response = await fetch(`${apiUrl}/sessions/${session.id}/${action}`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
    });
    setPending(false);

    if (!response.ok) {
      setError("Could not update the timer.");
      return;
    }

    setSession((await response.json()) as Session);
  }

  if (session) {
    const title = session.task?.title ?? "Focus";

    return (
      <div className="flex min-h-[70vh] flex-col items-center justify-center text-center">
        <p className="font-mono text-xs tracking-[0.28em] text-zinc-500">
          {FOCUS_MODES[session.mode].label}
        </p>
        <h1 className="mt-6 max-w-lg text-3xl font-medium tracking-tight">{title}</h1>
        <p className="mt-10 font-mono text-7xl tracking-tight tabular-nums">
          {formatRemaining(remainingSeconds)}
        </p>
        <div className="mt-8 h-1 w-full max-w-sm overflow-hidden rounded-full bg-zinc-800">
          <div className="h-full bg-zinc-100" style={{ width: `${progress * 100}%` }} />
        </div>
        {session.pausedAt ? <p className="mt-6 text-sm text-zinc-400">Paused</p> : null}
        {remainingSeconds === 0 ? (
          <p className="mt-6 text-sm text-zinc-400">Time is up.</p>
        ) : null}
        {error ? <p className="mt-6 text-sm text-zinc-400">{error}</p> : null}
        <AmbientAudio active={remainingSeconds > 0} />
        <div className="mt-10 flex gap-3">
          <button
            type="button"
            onClick={() => void togglePause()}
            disabled={pending || remainingSeconds === 0}
            className="rounded-full border border-zinc-800 px-5 py-2 text-sm text-zinc-400"
          >
            {session.pausedAt ? "Resume" : "Pause"}
          </button>
          <button
            type="button"
            onClick={() => void cancel()}
            disabled={pending}
            className="rounded-full border border-zinc-800 px-5 py-2 text-sm text-zinc-400"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={() => void finish()}
            disabled={pending}
            className="rounded-full border border-zinc-700 px-5 py-2 text-sm text-zinc-100"
          >
            Finish
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-xl">
      {completion ? (
        <p className="mb-8 font-mono text-sm text-zinc-300">
          +{completion.xpEarned} XP
          {completion.bonusXp > 0
            ? ` · +${completion.bonusXp} ${completion.bonusKind === "third" ? "third session" : "first session"}`
            : ""}
          {completion.streakBonus > 0 ? ` · +${completion.streakBonus} seven-day streak` : ""} · Level{" "}
          {completion.level} · {completion.currentStreak} day streak
        </p>
      ) : null}
      <form className="flex flex-col gap-3" onSubmit={start}>
        <select
          value={taskId}
          onChange={(event) => setTaskId(event.target.value)}
          required
          className="rounded-full border border-zinc-800 bg-zinc-950 px-4 py-2 text-sm outline-none"
        >
          {tasks.length === 0 ? <option value="">Add a task first</option> : null}
          {tasks.map((task) => (
            <option key={task.id} value={task.id}>
              {task.title}
            </option>
          ))}
        </select>
        <div className="flex gap-3">
          <select
            value={mode}
            onChange={(event) => setMode(event.target.value as FocusModeId)}
            className="min-w-0 flex-1 rounded-full border border-zinc-800 bg-zinc-950 px-4 py-2 text-sm outline-none"
          >
            {FOCUS_MODE_IDS.map((id) => (
              <option key={id} value={id}>
                {FOCUS_MODES[id].label}
                {FOCUS_MODES[id].focusMinutes ? ` · ${FOCUS_MODES[id].focusMinutes}m` : ""}
              </option>
            ))}
          </select>
          {mode === "custom" ? (
            <input
              type="number"
              min={1}
              max={180}
              value={focusMinutes}
              onChange={(event) => setFocusMinutes(Number(event.target.value))}
              aria-label="Focus minutes"
              className="w-24 rounded-full border border-zinc-800 bg-transparent px-3 py-2 text-sm outline-none"
            />
          ) : null}
          <button
            type="submit"
            disabled={pending || tasks.length === 0}
            className="rounded-full border border-zinc-700 px-4 py-2 text-sm text-zinc-200"
          >
            Start
          </button>
        </div>
      </form>
      {error ? <p className="mt-3 text-sm text-zinc-400">{error}</p> : null}
      <Link href="/tasks" className="mt-8 inline-block text-sm text-zinc-500">
        Tasks
      </Link>
    </div>
  );
}
