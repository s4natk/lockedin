import { auth } from "@clerk/nextjs/server";
import { Suspense } from "react";
import { SiteHeader } from "@/components/site-header";
import { ENVIRONMENT_TREATMENT, activeEnvironment, type EnvironmentCode } from "./environment";
import { FocusSession } from "./focus-session";

type Environments = {
  environments: { code: string; name: string; unlocked: boolean }[];
};

export default async function FocusPage() {
  const { isAuthenticated, redirectToSignIn, getToken } = await auth();

  if (!isAuthenticated) {
    return redirectToSignIn();
  }

  const token = await getToken();
  const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001";
  let environment: { code: EnvironmentCode; name: string } = { code: "library", name: "Library" };

  if (token) {
    try {
      const response = await fetch(`${apiUrl}/environments`, {
        headers: { Authorization: `Bearer ${token}` },
        cache: "no-store",
      });
      if (response.ok) {
        const data = (await response.json()) as Environments;
        environment = activeEnvironment(data.environments);
      }
    } catch {
      environment = { code: "library", name: "Library" };
    }
  }

  const treatment = ENVIRONMENT_TREATMENT[environment.code];

  return (
    <main className={`min-h-screen ${treatment.page}`}>
      <div className="mx-auto max-w-3xl px-5 py-8 sm:px-6">
        <SiteHeader wordmarkClass={treatment.ink} linkClass={treatment.ink} />
        <p className={`mt-12 font-mono text-xs tracking-[0.18em] ${treatment.ink}`}>SESSION</p>
        <h1 className="mt-2 text-3xl font-medium tracking-tight sm:text-4xl">Focus</h1>
        <p className={`mt-3 max-w-md ${treatment.ink}`}>{environment.name}</p>
        <div className="mt-10">
          <Suspense>
            <FocusSession accentClass={treatment.accent} />
          </Suspense>
        </div>
      </div>
    </main>
  );
}
