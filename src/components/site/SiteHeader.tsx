import Link from "next/link";
import { Logo } from "@/components/brand/Logo";
import { MobileNav, type NavItem } from "@/components/site/MobileNav";
import { LanguageToggle } from "@/components/site/LanguageToggle";
import { getSessionUser } from "@/lib/auth";
import { getLang, t } from "@/lib/i18n";
import { signOut } from "@/app/actions/session";
import { Suspense } from "react";

export async function SiteHeader() {
  const lang = await getLang();
  const d = t(lang);
  const user = await getSessionUser();
  const primary: NavItem[] = [
    { href: "/prayer-times", label: d.prayerTimes },
    { href: "/visit", label: d.visit },
    { href: "/programs", label: d.programs },
    { href: "/ask", label: d.ask },
    { href: "/welcome", label: d.welcome },
  ];
  const secondary: NavItem[] = [
    { href: "/announcements", label: d.announcements },
    { href: "/faq", label: d.faq },
    { href: "/volunteer", label: d.volunteer },
    { href: "/support", label: d.support },
    { href: "/about", label: d.about },
  ];
  const staffLinks: NavItem[] = [];
  if (user?.roles.includes("admin") || user?.roles.includes("editor") || user?.roles.includes("moderator"))
    staffLinks.push({ href: "/admin", label: "Admin" });
  if (user?.roles.includes("imam")) staffLinks.push({ href: "/imam", label: "Imam desk" });
  const account: NavItem[] = user ? [{ href: "/community", label: d.community }, ...staffLinks] : [{ href: "/login", label: d.signIn }];

  return (
    <header className="relative z-30 border-b border-pine/10 bg-ivory/95 backdrop-blur supports-[backdrop-filter]:bg-ivory/85">
      <div className="container-page flex min-h-[4.5rem] items-center justify-between gap-3">
        <Link href="/" className="shrink-0 rounded-lg py-2" aria-label="Masjid Omar — home">
          <Logo />
        </Link>
        <nav aria-label="Main" className="hidden lg:block">
          <ul className="flex items-center gap-1">
            {primary.map((item) => (
              <li key={item.href}>
                <Link href={item.href} className="rounded-full px-3 py-2 text-[0.95rem] font-semibold text-pine hover:bg-sage-100">
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
        <div className="flex items-center gap-1">
          <Suspense>
            <LanguageToggle current={lang} label={d.language} className="hidden sm:block" />
          </Suspense>
          <div className="hidden items-center gap-1 lg:flex">
            {account.map((a) => (
              <Link key={a.href} href={a.href} className="btn btn-secondary min-h-11 px-4 text-sm">
                {a.label}
              </Link>
            ))}
            {user && (
              <form action={signOut}>
                <input type="hidden" name="next" value="/" />
                <button className="btn btn-ghost min-h-11 px-3 text-sm" type="submit">
                  {d.signOut}
                </button>
              </form>
            )}
          </div>
          <MobileNav
            items={[...primary, ...secondary, ...account]}
            menuLabel={d.menu}
            closeLabel={d.close}
            signOutLabel={user ? d.signOut : undefined}
            languageSlot={
              <Suspense>
                <LanguageToggle current={lang} label={d.language} className="sm:hidden" />
              </Suspense>
            }
          />
        </div>
      </div>
    </header>
  );
}
