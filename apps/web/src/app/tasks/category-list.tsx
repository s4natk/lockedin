"use client";

import { useAuth } from "@clerk/nextjs";
import { useCallback, useEffect, useState } from "react";

type Category = {
  id: string;
  name: string;
};

const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001";

export function CategoryList() {
  const { getToken } = useAuth();
  const [categories, setCategories] = useState<Category[]>([]);
  const [name, setName] = useState("");
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    const token = await getToken();
    if (!token) return;

    const response = await fetch(`${apiUrl}/categories`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!response.ok) {
      setError("Could not load categories.");
      return;
    }

    setCategories((await response.json()) as Category[]);
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

    const response = await fetch(`${apiUrl}/categories`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ name }),
    });

    if (!response.ok) {
      setError(
        response.status === 409
          ? "You already have a category with that name."
          : "Could not create that category.",
      );
      return;
    }

    setName("");
    await load();
  }

  return (
    <div className="max-w-md">
      <form className="flex gap-3" onSubmit={onSubmit}>
        <input
          value={name}
          onChange={(event) => setName(event.target.value)}
          placeholder="School"
          maxLength={40}
          required
          className="min-w-0 flex-1 rounded-full border border-zinc-800 bg-transparent px-4 py-2 text-sm outline-none"
        />
        <button
          type="submit"
          className="rounded-full border border-zinc-700 px-4 py-2 text-sm text-zinc-200"
        >
          Add
        </button>
      </form>
      {error ? <p className="mt-3 text-sm text-zinc-400">{error}</p> : null}
      <ul className="mt-8 space-y-3">
        {categories.map((category) => (
          <li key={category.id} className="text-zinc-200">
            {category.name}
          </li>
        ))}
      </ul>
    </div>
  );
}
