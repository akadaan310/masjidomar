import Link from "next/link";
import { LogoMark } from "@/components/brand/Logo";
import { signOut } from "@/app/actions/session";

export function StaffTopBar({ label, tone, email, children }: { label: string; tone: "admin" | "imam"; email?: string; children?: React.ReactNode }) {
  return (
    <header className={`${tone === "admin" ? "bg-pine" : "bg-navy"} text-ivory`}>
      <div className="mx-auto flex min-h-16 max-w-[90rem] flex-wrap items-center gap-3 px-4 py-2 sm:px-6">
        <Link href="/" className="flex items-center gap-3 rounded-lg" aria-label="Masjid Omar — back to the public website">
          <LogoMark tone="reverse" className="h-9 w-auto" />
          <span className="font-display text-lg">Masjid Omar</span>
        </Link>
        <span className="badge bg-ivory/15 text-ivory">{label}</span>
        <div className="ms-auto flex items-center gap-2">
          {children}
          {email && <span className="hidden text-sm text-sage md:inline">{email}</span>}
          {email && (
            <form action={signOut}>
              <input type="hidden" name="next" value={tone === "admin" ? "/admin/login" : "/imam/login"} />
              <button type="submit" className="btn min-h-10 border border-ivory/30 px-4 text-sm text-ivory hover:bg-ivory/10">Sign out</button>
            </form>
          )}
        </div>
      </div>
    </header>
  );
}
