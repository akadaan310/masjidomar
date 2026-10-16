"use client";
import Link from "next/link";

export default function ErrorPage({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <main id="main" className="flex min-h-[60dvh] items-center justify-center px-4">
      <div className="max-w-md text-center" role="alert">
        <h1 className="font-display text-3xl text-pine">Something went wrong</h1>
        <p className="mt-3 text-muted">Please try again. If prayer times don&apos;t load, check with the masjid directly.</p>
        <div className="mt-6 flex justify-center gap-3">
          <button onClick={reset} className="btn btn-primary">Try again</button>
          <Link href="/" className="btn btn-secondary">Home</Link>
        </div>
      </div>
    </main>
  );
}
