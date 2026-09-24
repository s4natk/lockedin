import { auth } from "@clerk/nextjs/server";
import { CategoryList } from "./category-list";

export default async function TasksPage() {
  const { isAuthenticated, redirectToSignIn } = await auth();

  if (!isAuthenticated) {
    return redirectToSignIn();
  }

  return (
    <main className="mx-auto min-h-screen max-w-3xl px-6 py-8">
      <p className="font-mono text-xs tracking-[0.28em] text-zinc-500">LOCKEDIN</p>
      <h1 className="mt-10 text-4xl font-medium tracking-tight">Categories</h1>
      <p className="mt-3 max-w-md text-zinc-400">
        School, projects, LeetCode, reading. Tasks will use these later.
      </p>
      <div className="mt-8">
        <CategoryList />
      </div>
    </main>
  );
}
