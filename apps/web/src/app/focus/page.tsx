import { auth } from "@clerk/nextjs/server";
import { Suspense } from "react";
import { FocusSession } from "./focus-session";

export default async function FocusPage() {
  const { isAuthenticated, redirectToSignIn } = await auth();

  if (!isAuthenticated) {
    return redirectToSignIn();
  }

  return (
    <main className="mx-auto min-h-screen max-w-3xl px-6 py-8">
      <p className="font-mono text-xs tracking-[0.28em] text-zinc-500">LOCKEDIN</p>
      <h1 className="mt-10 text-4xl font-medium tracking-tight">Focus</h1>
      <p className="mt-3 max-w-md text-zinc-400">Pick a task, then stay with the clock.</p>
      <div className="mt-10">
        <Suspense>
          <FocusSession />
        </Suspense>
      </div>
    </main>
  );
}
