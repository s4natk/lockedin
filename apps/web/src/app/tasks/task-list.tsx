"use client";

import { useAuth } from "@clerk/nextjs";
import { useCallback, useEffect, useState } from "react";

type Category = { id: string; name: string };

type Task = {
  id: string;
  title: string;
  completed: boolean;
  estimatedSessions: number;
  category: { id: string; name: string } | null;
};

const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001";

export function TaskList() {
  const { getToken } = useAuth();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [title, setTitle] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [estimatedSessions, setEstimatedSessions] = useState(1);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    const token = await getToken();
    if (!token) return;

    const headers = { Authorization: `Bearer ${token}` };
    const [taskResponse, categoryResponse] = await Promise.all([
      fetch(`${apiUrl}/tasks`, { headers }),
      fetch(`${apiUrl}/categories`, { headers }),
    ]);

    if (!taskResponse.ok || !categoryResponse.ok) {
      setError("Could not load tasks.");
      return;
    }

    const nextCategories = (await categoryResponse.json()) as Category[];
    setCategories(nextCategories);
    setTasks((await taskResponse.json()) as Task[]);
    setCategoryId((current) => current || nextCategories[0]?.id || "");
  }, [getToken]);

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      void load();
    }, 0);

    return () => window.clearTimeout(timeout);
  }, [load]);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    const token = await getToken();
    if (!token) return;

    const response = await fetch(`${apiUrl}/tasks`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ title, categoryId, estimatedSessions }),
    });

    if (!response.ok) {
      setError("Could not create that task.");
      return;
    }

    setTitle("");
    setEstimatedSessions(1);
    await load();
  }

  async function toggle(task: Task) {
    const token = await getToken();
    if (!token) return;

    await fetch(`${apiUrl}/tasks/${task.id}`, {
      method: "PATCH",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ completed: !task.completed }),
    });
    await load();
  }

  return (
    <div className="max-w-xl">
      <form className="flex flex-col gap-3" onSubmit={onSubmit}>
        <input
          value={title}
          onChange={(event) => setTitle(event.target.value)}
          placeholder="Finish CS234 assignment"
          maxLength={120}
          required
          className="rounded-full border border-zinc-800 bg-transparent px-4 py-2 text-sm outline-none"
        />
        <div className="flex gap-3">
          <select
            value={categoryId}
            onChange={(event) => setCategoryId(event.target.value)}
            required
            className="min-w-0 flex-1 rounded-full border border-zinc-800 bg-zinc-950 px-4 py-2 text-sm outline-none"
          >
            {categories.length === 0 ? <option value="">Add a category first</option> : null}
            {categories.map((category) => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </select>
          <input
            type="number"
            min={1}
            max={20}
            value={estimatedSessions}
            onChange={(event) => setEstimatedSessions(Number(event.target.value))}
            aria-label="Estimated sessions"
            className="w-20 rounded-full border border-zinc-800 bg-transparent px-3 py-2 text-sm outline-none"
          />
          <button
            type="submit"
            className="rounded-full border border-zinc-700 px-4 py-2 text-sm text-zinc-200"
          >
            Add
          </button>
        </div>
      </form>
      {error ? <p className="mt-3 text-sm text-zinc-400">{error}</p> : null}
      <ul className="mt-8 space-y-3">
        {tasks.map((task) => (
          <li key={task.id}>
            <button
              type="button"
              onClick={() => void toggle(task)}
              className="flex w-full items-baseline justify-between gap-4 text-left"
            >
              <span className={task.completed ? "text-zinc-500 line-through" : "text-zinc-100"}>
                {task.title}
              </span>
              <span className="shrink-0 font-mono text-xs text-zinc-500">
                {task.category?.name ?? "No category"} · {task.estimatedSessions}
              </span>
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
