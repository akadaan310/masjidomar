import { z } from "zod";

const trimmed = (min: number, max: number) => z.string().trim().min(min).max(max);
const hhmm = z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, "Use 24-hour HH:MM");
const slug = z.string().trim().toLowerCase().regex(/^[a-z0-9]+(-[a-z0-9]+)*$/, "Lowercase letters, numbers and dashes").max(80);
const checkbox = z.preprocess((v) => v === "on" || v === "true" || v === true, z.boolean());

export const signupSchema = z.object({
  email: z.email().max(254),
  password: z
    .string()
    .min(10, "At least 10 characters")
    .max(128)
    .regex(/[a-z]/, "Include a lowercase letter")
    .regex(/[A-Z]/, "Include an uppercase letter")
    .regex(/\d/, "Include a number"),
  displayName: z.string().trim().max(60).default(""),
  language: z.enum(["en", "ar"]).default("en"),
  consent: z.literal(true, { error: "Please accept the privacy notice to continue" }),
  website: z.string().max(0, "Leave this field empty").default(""), // honeypot
});

export const loginSchema = z.object({
  email: z.email().max(254),
  password: z.string().min(1).max(128),
  next: z.string().max(200).default("/"),
  website: z.string().max(0).default(""),
});

export const questionSchema = z.object({
  category: z.enum(["worship", "family", "new_muslim", "community", "other"]),
  subject: trimmed(3, 140),
  body: trimmed(10, 5000),
  language: z.enum(["en", "ar"]),
  isSensitive: checkbox,
  showName: checkbox,
  faqConsent: checkbox,
  acknowledge: z.literal(true, { error: "Please confirm you have read how your question is handled" }),
  website: z.string().max(0).default(""),
});

export const replySchema = z.object({ questionId: z.uuid(), body: trimmed(1, 8000) });

export const iqamahRuleSchema = z
  .object({
    prayer: z.enum(["fajr", "dhuhr", "asr", "maghrib", "isha"]),
    weekday: z.union([z.literal(""), z.coerce.number().int().min(0).max(6)]).transform((v) => (v === "" ? null : v)),
    mode: z.enum(["fixed", "offset"]),
    time: z.union([z.literal(""), hhmm]).default(""),
    offset: z.union([z.literal(""), z.coerce.number().int().min(0).max(90)]).default(""),
  })
  .refine((r) => (r.mode === "fixed" ? r.time !== "" : r.offset !== ""), { message: "Provide a time (fixed) or minutes (offset)" });

export const publicationMetaSchema = z.object({
  id: z.uuid(),
  title: trimmed(1, 120),
  method: z.enum(["NorthAmerica", "MuslimWorldLeague", "Egyptian", "Karachi", "UmmAlQura", "MoonsightingCommittee"]),
  madhab: z.enum(["shafi", "hanafi"]),
  effectiveFrom: z.iso.date(),
  notice: z.string().trim().max(600).default(""),
  adj_fajr: z.coerce.number().int().min(-30).max(30).default(0),
  adj_sunrise: z.coerce.number().int().min(-30).max(30).default(0),
  adj_dhuhr: z.coerce.number().int().min(-30).max(30).default(0),
  adj_asr: z.coerce.number().int().min(-30).max(30).default(0),
  adj_maghrib: z.coerce.number().int().min(-30).max(30).default(0),
  adj_isha: z.coerce.number().int().min(-30).max(30).default(0),
});

export const overrideSchema = z.object({
  publicationId: z.uuid(),
  onDate: z.iso.date(),
  prayer: z.enum(["fajr", "dhuhr", "asr", "maghrib", "isha"]),
  time: hhmm,
  kind: z.enum(["ramadan", "eid", "holiday", "jumuah", "other"]),
  note: z.string().trim().max(200).default(""),
});

export const jumuahSchema = z
  .object({
    publicationId: z.uuid(),
    label: trimmed(1, 60),
    khutbah: hhmm,
    iqamah: hhmm,
    language: z.string().trim().max(60).default(""),
    note: z.string().trim().max(200).default(""),
    sortOrder: z.coerce.number().int().min(0).max(20).default(0),
  })
  .refine((j) => j.iqamah >= j.khutbah, { message: "Iqamah must be at or after the khutbah" });

export const announcementSchema = z.object({
  id: z.union([z.literal(""), z.uuid()]).default(""),
  slug,
  title: trimmed(3, 140),
  titleAr: z.string().trim().max(140).default(""),
  body: z.string().trim().max(8000).default(""),
  bodyAr: z.string().trim().max(8000).default(""),
  urgency: z.enum(["normal", "urgent"]),
  audience: z.enum(["public", "members", "staff"]),
  status: z.enum(["draft", "published", "archived"]),
  publishAt: z.string().trim().default(""),
  expiresAt: z.string().trim().default(""),
  showOnDisplay: checkbox,
});

export const programSchema = z.object({
  id: z.union([z.literal(""), z.uuid()]).default(""),
  slug,
  title: trimmed(3, 140),
  titleAr: z.string().trim().max(140).default(""),
  summary: z.string().trim().max(400).default(""),
  description: z.string().trim().max(8000).default(""),
  category: z.enum(["class", "family", "lecture", "youth", "seasonal", "community", "other"]),
  scheduleNote: z.string().trim().max(200).default(""),
  audienceNote: z.string().trim().max(200).default(""),
  status: z.enum(["draft", "published", "archived"]),
});

export const eventSchema = z
  .object({
    id: z.union([z.literal(""), z.uuid()]).default(""),
    slug,
    title: trimmed(3, 140),
    titleAr: z.string().trim().max(140).default(""),
    description: z.string().trim().max(8000).default(""),
    startsAt: z.string().regex(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/, "Choose a start date and time"),
    endsAt: z.string().regex(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/, "Choose an end date and time"),
    location: trimmed(3, 200),
    capacity: z.union([z.literal(""), z.coerce.number().int().min(1).max(5000)]).default(""),
    rsvpEnabled: checkbox,
    waitlistEnabled: checkbox,
    status: z.enum(["draft", "published", "cancelled", "archived"]),
    cancelNote: z.string().trim().max(300).default(""),
    programId: z.union([z.literal(""), z.uuid()]).default(""),
  })
  .refine((e) => e.endsAt > e.startsAt, { message: "End must be after start" });

export const volunteerOppSchema = z.object({
  id: z.union([z.literal(""), z.uuid()]).default(""),
  title: trimmed(3, 140),
  titleAr: z.string().trim().max(140).default(""),
  description: z.string().trim().max(4000).default(""),
  commitment: z.string().trim().max(200).default(""),
  status: z.enum(["draft", "published", "archived"]),
});

export const volunteerInquirySchema = z.object({
  opportunityId: z.union([z.literal(""), z.uuid()]).default(""),
  message: z.string().trim().max(1500).default(""),
  contactPreference: z.enum(["email", "in_person"]),
  consent: z.literal(true, { error: "Consent is needed so the team may contact you" }),
  website: z.string().max(0).default(""),
});

export const faqSchema = z.object({
  id: z.union([z.literal(""), z.uuid()]).default(""),
  question: trimmed(5, 600),
  answer: trimmed(5, 8000),
  category: z.enum(["worship", "family", "new_muslim", "community", "visiting", "other"]),
  language: z.enum(["en", "ar"]),
  status: z.enum(["draft", "published", "archived"]),
});

export const settingsSchema = z.object({
  orgNameEn: trimmed(2, 80),
  orgNameAr: trimmed(2, 80),
  addressLine: trimmed(3, 120),
  city: trimmed(2, 60),
  region: trimmed(2, 20),
  postalCode: z.string().trim().regex(/^\d{5}(-\d{4})?$/),
  latitude: z.coerce.number().min(-90).max(90),
  longitude: z.coerce.number().min(-180).max(180),
  phone: z.string().trim().max(30).regex(/^[\d\s()+.-]*$/, "Digits and ( ) + - only"),
  phoneVerified: checkbox,
  email: z.union([z.literal(""), z.email()]).default(""),
  emailVerified: checkbox,
  conceptMode: checkbox,
  allowIndexing: checkbox,
  heroSource: z.enum(["concept", "approved_photo", "none"]),
  accessibilityInfo: z.string().trim().max(1500).default(""),
  accessibilityVerified: checkbox,
  parkingInfo: z.string().trim().max(1500).default(""),
  parkingVerified: checkbox,
  givingInfo: z.string().trim().max(1500).default(""),
  givingVerified: checkbox,
  imamHoursNote: z.string().trim().max(300).default(""),
  supportEscalationUrl: z.union([z.literal(""), z.url({ protocol: /^https$/ })]).default(""),
  imamSharedQueue: checkbox,
  requireStaffMfa: checkbox,
  defaultLanguage: z.enum(["en", "ar"]),
  questionRetentionDays: z.coerce.number().int().min(30).max(3650),
  notificationMode: z.enum(["none", "outbox_only"]),
});

export const displaySchema = z.object({
  panels: z.array(z.enum(["prayers", "next", "jumuah", "announcements", "program"])).max(8),
  quietMode: checkbox,
  languageMode: z.enum(["en", "ar", "bilingual"]),
  theme: z.enum(["evergreen", "navy", "ivory"]),
  showSeconds: checkbox,
});

export const mediaSchema = z.object({
  altText: trimmed(3, 300),
  altTextAr: z.string().trim().max(300).default(""),
  credit: trimmed(2, 200),
  source: z.enum(["mosque_supplied", "commissioned", "ai_concept"]),
  peopleConsent: z.enum(["not_applicable", "obtained", "pending"]),
  rightsCleared: checkbox,
  publishApproved: checkbox,
});

/** Only allow same-site relative redirects (prevents open redirects). */
export function safeNext(next: string | null | undefined, fallback = "/"): string {
  if (!next || typeof next !== "string") return fallback;
  if (!next.startsWith("/") || next.startsWith("//") || next.startsWith("/\\") || next.includes("://")) return fallback;
  return next;
}

export function firstError(err: z.ZodError): string {
  const issue = err.issues[0];
  return issue ? `${issue.path.length ? `${issue.path.join(".")}: ` : ""}${issue.message}` : "Invalid input";
}
