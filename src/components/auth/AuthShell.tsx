import { LogoMark } from "@/components/brand/Logo";

export function AuthShell({ title, subtitle, children, tone = "member" }: { title: string; subtitle?: React.ReactNode; children: React.ReactNode; tone?: "member" | "admin" | "imam" }) {
  const accent = tone === "admin" ? "bg-pine" : tone === "imam" ? "bg-navy" : "bg-evergreen";
  return (
    <div className="container-page flex justify-center py-12 sm:py-20">
      <div className="card w-full max-w-md overflow-hidden">
        <div className={`${accent} flex items-center gap-3 px-6 py-5 text-ivory`}>
          <LogoMark tone="reverse" className="h-10 w-auto" />
          <div>
            <h1 className="font-display text-2xl">{title}</h1>
            {subtitle && <p className="text-sm text-sage">{subtitle}</p>}
          </div>
        </div>
        <div className="p-6 sm:p-8">{children}</div>
      </div>
    </div>
  );
}
