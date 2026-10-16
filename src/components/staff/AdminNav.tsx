"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { CalendarDays, Clock, FileText, Gauge, HandHeart, Image as ImageIcon, MessagesSquare, MonitorPlay, ScrollText, Settings, Users, Megaphone, BookOpenCheck } from "lucide-react";

const ITEMS = [
  { href: "/admin", label: "Today", icon: Gauge, roles: ["admin", "editor", "moderator"] },
  { href: "/admin/prayer", label: "Prayer editor", icon: Clock, roles: ["admin"] },
  { href: "/admin/announcements", label: "Announcements", icon: Megaphone, roles: ["admin", "editor"] },
  { href: "/admin/programs", label: "Programs & events", icon: CalendarDays, roles: ["admin", "editor"] },
  { href: "/admin/faq", label: "Q&A moderation", icon: BookOpenCheck, roles: ["admin", "moderator"] },
  { href: "/admin/questions", label: "Question queue", icon: MessagesSquare, roles: ["admin", "moderator"] },
  { href: "/admin/media", label: "Photos & media", icon: ImageIcon, roles: ["admin", "editor"] },
  { href: "/admin/volunteer", label: "Volunteering", icon: HandHeart, roles: ["admin", "editor"] },
  { href: "/admin/display", label: "Masjid screen", icon: MonitorPlay, roles: ["admin"] },
  { href: "/admin/members", label: "Members & roles", icon: Users, roles: ["admin"] },
  { href: "/admin/settings", label: "Settings", icon: Settings, roles: ["admin"] },
  { href: "/admin/audit", label: "Audit log", icon: ScrollText, roles: ["admin"] },
  { href: "/admin/pages", label: "Page status", icon: FileText, roles: ["admin", "editor"] },
];

export function AdminNav({ roles }: { roles: string[] }) {
  const pathname = usePathname();
  const items = ITEMS.filter((i) => i.roles.some((r) => roles.includes(r)));
  return (
    <nav aria-label="Administration" className="min-w-0 lg:sticky lg:top-6 lg:self-start">
      <ul className="flex gap-1 overflow-x-auto pb-2 lg:flex-col lg:overflow-visible lg:pb-0">
        {items.map(({ href, label, icon: Icon }) => {
          const active = href === "/admin" ? pathname === "/admin" : pathname.startsWith(href);
          return (
            <li key={href} className="shrink-0">
              <Link
                href={href}
                aria-current={active ? "page" : undefined}
                className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold text-pine hover:bg-chalk aria-[current=page]:bg-pine aria-[current=page]:text-ivory"
              >
                <Icon aria-hidden className="size-4" /> {label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
