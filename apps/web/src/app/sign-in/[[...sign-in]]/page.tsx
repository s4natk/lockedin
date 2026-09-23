import { SignIn } from "@clerk/nextjs";

export default function SignInPage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-8 px-6 py-16">
      <p className="font-mono text-xs tracking-[0.28em] text-zinc-500">LOCKEDIN</p>
      <SignIn />
    </main>
  );
}
