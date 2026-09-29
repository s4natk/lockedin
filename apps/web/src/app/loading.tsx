import { StatusMessage } from "@/components/status-message";

export default function Loading() {
  return (
    <main className="mx-auto min-h-screen max-w-3xl px-6 py-8">
      <p className="font-mono text-xs tracking-[0.28em] text-zinc-500">LOCKEDIN</p>
      <StatusMessage>Loading</StatusMessage>
    </main>
  );
}
