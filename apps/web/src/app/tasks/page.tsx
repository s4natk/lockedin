import { auth } from "@clerk/nextjs/server";
import { SiteHeader } from "@/components/site-header";
import { TasksBoard } from "./tasks-board";

export default async function TasksPage() {
  const { isAuthenticated, redirectToSignIn } = await auth();

  if (!isAuthenticated) {
    return redirectToSignIn();
  }

  return (
    <main className="mx-auto min-h-screen max-w-3xl px-5 py-8 sm:px-6">
      <SiteHeader />
      <p className="mt-12 font-mono text-xs tracking-[0.18em] text-zinc-600">WORK</p>
      <h1 className="mt-2 text-3xl font-medium tracking-tight sm:text-4xl">Tasks</h1>
      <p className="mt-3 max-w-md text-zinc-400">Add a category, then attach a task to it.</p>
      <TasksBoard />
    </main>
  );
}
