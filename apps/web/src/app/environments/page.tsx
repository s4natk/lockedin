import { auth } from "@clerk/nextjs/server";
import { SiteHeader } from "@/components/site-header";

type Environment = {
  code: string;
  name: string;
  description: string;
  requiredLevel: number;
  unlocked: boolean;
};

type Environments = {
  level: number;
  environments: Environment[];
};

export default async function EnvironmentsPage() {
  const { isAuthenticated, redirectToSignIn, getToken } = await auth();

  if (!isAuthenticated) {
    return redirectToSignIn();
  }

  const token = await getToken();
  const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001";
  let data: Environments | null = null;

  if (token) {
    try {
      const response = await fetch(`${apiUrl}/environments`, {
        headers: { Authorization: `Bearer ${token}` },
        cache: "no-store",
      });
      if (response.ok) data = (await response.json()) as Environments;
    } catch {
      data = null;
    }
  }

  return (
    <main className="mx-auto min-h-screen max-w-3xl px-5 py-8 sm:px-6">
      <SiteHeader />
      <p className="mt-12 font-mono text-xs tracking-[0.18em] text-zinc-600">ROOMS</p>
      <h1 className="mt-2 text-3xl font-medium tracking-tight sm:text-4xl">Environments</h1>
      {data ? (
        <>
          <p className="mt-3 font-mono text-xs text-zinc-500">Level {data.level}</p>
          <ul className="mt-10 divide-y divide-white/10">
            {data.environments.map((item, index) => (
              <li key={item.code} className="flex gap-4 py-4">
                <span className="font-mono text-xs text-zinc-600">
                  {String(index + 1).padStart(2, "0")}
                </span>
                <div>
                  <p className={item.unlocked ? "text-zinc-100" : "text-zinc-600"}>{item.name}</p>
                  <p className="mt-1 text-sm text-zinc-500">
                    {item.unlocked ? item.description : `Unlocks at level ${item.requiredLevel}`}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        </>
      ) : (
        <p className="mt-8 text-sm text-zinc-400">Could not load environments.</p>
      )}
    </main>
  );
}
