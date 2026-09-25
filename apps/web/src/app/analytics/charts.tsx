"use client";

import { Bar, BarChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

type Day = { date: string; minutes: number };
type Category = { id: string; name: string; minutes: number; share: number };

const tooltipStyle = {
  background: "#111113",
  border: "1px solid #27272a",
  borderRadius: 8,
  color: "#fafafa",
};

function weekday(date: string) {
  return new Intl.DateTimeFormat("en-US", { weekday: "short", timeZone: "UTC" }).format(
    new Date(`${date}T00:00:00.000Z`),
  );
}

export function AnalyticsCharts({ days, categories }: { days: Day[]; categories: Category[] }) {
  const week = days.map((day) => ({ ...day, label: weekday(day.date) }));

  return (
    <div className="mt-10 space-y-12">
      <section>
        <h2 className="font-mono text-xs tracking-[0.2em] text-zinc-500">WEEK</h2>
        <div className="mt-4 h-56">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={week}>
              <XAxis dataKey="label" tick={{ fill: "#a1a1aa", fontSize: 12 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: "#a1a1aa", fontSize: 12 }} axisLine={false} tickLine={false} width={32} />
              <Tooltip contentStyle={tooltipStyle} cursor={{ fill: "#18181b" }} />
              <Bar dataKey="minutes" fill="#fafafa" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </section>
      <section>
        <h2 className="font-mono text-xs tracking-[0.2em] text-zinc-500">CATEGORIES</h2>
        {categories.length === 0 ? (
          <p className="mt-4 text-sm text-zinc-500">No finished sessions yet.</p>
        ) : (
          <div className="mt-4 h-56">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={categories} layout="vertical" margin={{ left: 16 }}>
                <XAxis type="number" hide />
                <YAxis
                  type="category"
                  dataKey="name"
                  width={96}
                  tick={{ fill: "#a1a1aa", fontSize: 12 }}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip contentStyle={tooltipStyle} cursor={{ fill: "#18181b" }} />
                <Bar dataKey="minutes" fill="#fafafa" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
        <ul className="mt-4 space-y-2">
          {categories.map((category) => (
            <li key={category.id} className="flex justify-between font-mono text-xs text-zinc-400">
              <span>{category.name}</span>
              <span>
                {category.minutes}m · {category.share}%
              </span>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
