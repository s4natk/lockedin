import { auth } from "@clerk/nextjs/server";
import Link from "next/link";

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
      <h1 className="mt-10 text-4xl font-medium tracking-tight">Environments</h1>
      {data ? (
        <>
          <p className="mt-3 font-mono text-xs text-zinc-500">Level {data.level}</p>
          <ul className="mt-10 space-y-6">
            {data.environments.map((item) => (
              <li key={item.code}>
                <p className={item.unlocked ? "text-zinc-100" : "text-zinc-600"}>{item.name}</p>
                <p className="mt-1 text-sm text-zinc-500">
                  {item.unlocked ? item.description : `Unlocks at level ${item.requiredLevel}`}
                </p>
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
