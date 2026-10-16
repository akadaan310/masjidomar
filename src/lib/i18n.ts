import "server-only";
import { cookies } from "next/headers";

export type Lang = "en" | "ar";

export async function getLang(): Promise<Lang> {
  const c = await cookies();
  return c.get("lang")?.value === "ar" ? "ar" : "en";
}

const dict = {
  en: {
    skip: "Skip to main content",
    home: "Home",
    prayerTimes: "Prayer times",
    visit: "Visit",
    programs: "Programs",
    announcements: "Announcements",
    ask: "Ask the Imam",
    welcome: "New here?",
    faq: "Questions & answers",
    volunteer: "Volunteer",
    support: "Support",
    about: "About",
    community: "My community",
    signIn: "Sign in",
    signOut: "Sign out",
    menu: "Menu",
    close: "Close",
    language: "العربية",
    conceptBanner: "Private concept preview — not an official Masjid Omar website. Content, images and times are awaiting the masjid's approval.",
    next: "Next",
    adhan: "Adhan",
    iqamah: "Iqamah",
    awaiting: "Schedule awaiting confirmation",
    demoSchedule: "Demo schedule — not current prayer times",
    directions: "Get directions",
    call: "Call",
  },
  ar: {
    skip: "تخطَّ إلى المحتوى الرئيسي",
    home: "الرئيسية",
    prayerTimes: "مواقيت الصلاة",
    visit: "الزيارة",
    programs: "البرامج",
    announcements: "الإعلانات",
    ask: "اسأل الإمام",
    welcome: "زائر جديد؟",
    faq: "أسئلة وأجوبة",
    volunteer: "التطوع",
    support: "الدعم",
    about: "عن المسجد",
    community: "مجتمعي",
    signIn: "تسجيل الدخول",
    signOut: "تسجيل الخروج",
    menu: "القائمة",
    close: "إغلاق",
    language: "English",
    conceptBanner: "معاينة مفاهيمية خاصة — ليست موقعًا رسميًا لمسجد عمر. المحتوى والصور والمواقيت بانتظار موافقة المسجد.",
    next: "الصلاة القادمة",
    adhan: "الأذان",
    iqamah: "الإقامة",
    awaiting: "الجدول بانتظار التأكيد",
    demoSchedule: "جدول تجريبي — ليست مواقيت الصلاة الحالية",
    directions: "الاتجاهات",
    call: "اتصال",
  },
} as const;

export type Dict = { [K in keyof (typeof dict)["en"]]: string };

export function t(lang: Lang): Dict {
  return dict[lang];
}
