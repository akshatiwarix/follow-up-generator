import Link from "next/link";
import { TryItForm } from "@/app/components/try-it-form";

export default function TryItPage() {
  return (
    <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-10 sm:px-6 lg:px-8">
      <Link href="/" className="text-sm underline decoration-line-strong underline-offset-4 hover:decoration-ink">
        ← Back to Follow-Up Library
      </Link>
      <header className="mt-4 max-w-3xl">
        <h1 className="font-display text-3xl italic text-ink sm:text-4xl">Try It Yourself</h1>
        <p className="mt-2 text-ink-dim">
          Fill in a meeting — leave a field blank or unconfirmed to see whether the model states
          the gap instead of inventing something to fill it.
        </p>
      </header>
      <div className="mt-8">
        <TryItForm />
      </div>
    </main>
  );
}
