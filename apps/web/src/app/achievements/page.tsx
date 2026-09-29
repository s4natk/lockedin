import { auth } from "@clerk/nextjs/server";
import { SiteHeader } from "@/components/site-header";

type Achievement = {
  code: string;
  name: string;
  description: string;
  earnedAt: string | null;
};

export default async function AchievementsPage() {
  const { isAuthenticated, redirectToSignIn, getToken } = await auth();

  if (!isAuthenticated) {
    return redirectToSignIn();
  }

  const token = await getToken();
  const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001";
  let achievements: Achievement[] | null = null;

  if (token) {
    try {
      const response = await fetch(`${apiUrl}/achievements`, {
        headers: { Authorization: `Bearer ${token}` },
        cache: "no-store",
      });
      if (response.ok) achievements = (await response.json()) as Achievement[];
    } catch {
      achievements = null;
    }
  }

  const earned = achievements?.filter((item) => item.earnedAt).length ?? 0;

  return (
    <main className="mx-auto min-h-screen max-w-3xl px-5 py-8 sm:px-6">
      <SiteHeader />
      <p className="mt-12 font-mono text-xs tracking-[0.18em] text-zinc-600">MARKS</p>
      <h1 className="mt-2 text-3xl font-medium tracking-tight sm:text-4xl">Achievements</h1>
      {achievements ? (
        <>
          <p className="mt-3 font-mono text-xs text-zinc-500">
            {earned} / {achievements.length}
          </p>
          {achievements.length === 0 ? (
            <p className="mt-8 text-sm text-zinc-500">No achievements yet.</p>
          ) : null}
          <ul className="mt-10 divide-y divide-white/10">
            {achievements.map((item, index) => (
              <li key={item.code} className="flex gap-4 py-4">
                <span className="font-mono text-xs text-zinc-600">
                  {String(index + 1).padStart(2, "0")}
                </span>
                <div>
                  <p className={item.earnedAt ? "text-zinc-100" : "text-zinc-600"}>{item.name}</p>
                  <p className="mt-1 text-sm text-zinc-500">{item.description}</p>
                </div>
              </li>
            ))}
          </ul>
        </>
      ) : (
        <p className="mt-8 text-sm text-zinc-400">Could not load achievements.</p>
      )}
    </main>
  );
}
