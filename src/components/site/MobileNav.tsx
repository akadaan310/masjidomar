"use client";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { Menu, X } from "lucide-react";
import { signOut } from "@/app/actions/session";

export type NavItem = { href: string; label: string };

export function MobileNav({
  items,
  menuLabel,
  closeLabel,
  signOutLabel,
  languageSlot,
}: {
  items: NavItem[];
  menuLabel: string;
  closeLabel: string;
  signOutLabel?: string;
  languageSlot?: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const buttonRef = useRef<HTMLButtonElement>(null);
  const [lastPath, setLastPath] = useState(pathname);

  if (pathname !== lastPath) {
    setLastPath(pathname);
    setOpen(false);
  }

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setOpen(false);
        buttonRef.current?.focus();
      }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open]);

  return (
    <div className="lg:hidden">
      <button
        ref={buttonRef}
        type="button"
        className="btn btn-secondary min-h-11 px-3"
        aria-expanded={open}
        aria-controls="mobile-nav"
        onClick={() => setOpen((v) => !v)}
      >
        {open ? <X aria-hidden className="size-5" /> : <Menu aria-hidden className="size-5" />}
        <span>{open ? closeLabel : menuLabel}</span>
      </button>
      <nav
        id="mobile-nav"
        aria-label="Main"
        hidden={!open}
        className="absolute inset-x-0 top-full z-40 border-b border-pine/10 bg-ivory shadow-lg"
      >
        <ul className="container-page grid gap-1 py-4 sm:grid-cols-2">
          {items.map((item) => (
            <li key={item.href}>
              <Link
                href={item.href}
                aria-current={pathname === item.href ? "page" : undefined}
                className="block rounded-xl px-4 py-3 text-lg font-semibold text-pine hover:bg-sage-100 aria-[current=page]:bg-sage-100"
              >
                {item.label}
              </Link>
            </li>
          ))}
        </ul>
        <div className="container-page flex flex-wrap items-center gap-2 pb-5">
          {languageSlot}
          {signOutLabel && (
            <form action={signOut}>
              <input type="hidden" name="next" value="/" />
              <button type="submit" className="btn btn-secondary">
                {signOutLabel}
              </button>
            </form>
          )}
        </div>
      </nav>
    </div>
  );
}
