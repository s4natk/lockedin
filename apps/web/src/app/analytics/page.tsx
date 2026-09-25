import { auth } from "@clerk/nextjs/server";
import Link from "next/link";
import { AnalyticsCharts } from "./charts";

type Weekly = { days: { date: string; minutes: number }[] };
type Categories = { categories: { id: string; name: string; minutes: number; share: number }[] };

export default async function AnalyticsPage() {
  const { isAuthenticated, redirectToSignIn, getToken } = await auth();

  if (!isAuthenticated) {
    return redirectToSignIn();
  }

  const token = await getToken();
  const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001";
  let weekly: Weekly | null = null;
  let categories: Categories | null = null;

  if (token) {
    try {
      const headers = { Authorization: `Bearer ${token}` };
      const [weeklyResponse, categoryResponse] = await Promise.all([
        fetch(`${apiUrl}/analytics/weekly`, { headers, cache: "no-store" }),
        fetch(`${apiUrl}/analytics/categories`, { headers, cache: "no-store" }),
      ]);
      if (weeklyResponse.ok && categoryResponse.ok) {
        weekly = (await weeklyResponse.json()) as Weekly;
        categories = (await categoryResponse.json()) as Categories;
      }
    } catch {
      weekly = null;
    }
  }

  return (
    <main className="mx-auto min-h-screen max-w-3xl px-6 py-8">
      <div className="flex items-center gap-6">
        <p className="font-mono text-xs tracking-[0.28em] text-zinc-500">LOCKEDIN</p>
        <Link href="/" className="text-sm text-zinc-400">
          Home
        </Link>
        <Link href="/dashboard" className="text-sm text-zinc-400">
          Dashboard
        </Link>
      </div>
      <h1 className="mt-10 text-4xl font-medium tracking-tight">Analytics</h1>
      <p className="mt-3 max-w-md text-zinc-400">The last seven days, and where the hours went.</p>
      {weekly && categories ? (
        <AnalyticsCharts days={weekly.days} categories={categories.categories} />
      ) : (
        <p className="mt-8 text-sm text-zinc-400">Could not load analytics.</p>
      )}
    </main>
  );
}
