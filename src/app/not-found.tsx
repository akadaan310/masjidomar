import Link from "next/link";
import { LogoMark } from "@/components/brand/Logo";

export default function NotFound() {
  return (
    <main id="main" className="flex min-h-dvh items-center justify-center bg-ivory px-4">
      <div className="max-w-md text-center">
        <LogoMark className="mx-auto h-20 w-auto" />
        <h1 className="font-display mt-6 text-4xl text-pine">This page isn&apos;t here</h1>
        <p className="mt-3 text-muted">It may have moved, or it may be private. If you followed a link to a question, sign in with the account that asked it.</p>
        <div className="mt-6 flex flex-wrap justify-center gap-3">
          <Link href="/" className="btn btn-primary">Home</Link>
          <Link href="/prayer-times" className="btn btn-secondary">Prayer times</Link>
        </div>
      </div>
    </main>
  );
}
