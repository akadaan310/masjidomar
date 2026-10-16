import { describe, expect, it } from "vitest";
import { renderMarkdown, escapeHtml, plainExcerpt } from "@/lib/markdown";
import { buildIcs, foldLine, icsEscape } from "@/lib/ics";
import { safeNext, signupSchema, iqamahRuleSchema, questionSchema } from "@/lib/validation";
import { throttle } from "@/lib/throttle";

describe("safe markdown", () => {
  it("escapes raw HTML and scripts", () => {
    const html = renderMarkdown('<script>alert(1)</script><img src=x onerror=alert(1)>');
    expect(html).not.toContain("<script");
    expect(html).not.toContain("<img");
    expect(html).toContain("&lt;script&gt;");
  });
  it("never links javascript: or data: URLs", () => {
    expect(renderMarkdown("[x](javascript:alert(1))")).not.toContain("href");
    expect(renderMarkdown("[x](data:text/html,hi)")).not.toContain("href");
  });
  it("cannot break out of the href attribute", () => {
    const html = renderMarkdown('[x](https://a.test/"onmouseover="alert(1))');
    expect(html).not.toMatch(/"\s*onmouseover=/);
  });
  it("supports the safe subset", () => {
    expect(renderMarkdown("**bold** and *it*")).toBe("<p><strong>bold</strong> and <em>it</em></p>");
    expect(renderMarkdown("- a\n- b")).toBe("<ul><li>a</li><li>b</li></ul>");
    expect(renderMarkdown("[site](https://example.org)")).toContain('rel="noopener noreferrer nofollow"');
  });
  it("escapes and excerpts", () => {
    expect(escapeHtml(`"'<>&`)).toBe("&quot;&#39;&lt;&gt;&amp;");
    expect(plainExcerpt("**Hello** [world](https://x.y)", 50)).toBe("Hello world");
  });
});

describe("ics", () => {
  it("escapes special characters and uses CRLF", () => {
    expect(icsEscape("a,b;c\\d\ne")).toBe("a\\,b\;c\\\\d\\ne");
    const ics = buildIcs({ uid: "1@x", title: "Open house, all welcome", description: "Line1\nLine2", location: "4801 E Busch Blvd, Tampa", startsAt: new Date("2026-10-25T21:00:00Z"), endsAt: new Date("2026-10-25T23:00:00Z"), stamp: new Date("2026-10-16T00:00:00Z") });
    expect(ics).toContain("DTSTART:20261025T210000Z\r\n");
    expect(ics).toContain("SUMMARY:Open house\\, all welcome\r\n");
    expect(ics.endsWith("END:VCALENDAR\r\n")).toBe(true);
  });
  it("folds long lines at 75 octets, including multibyte text", () => {
    const folded = foldLine("SUMMARY:" + "مسجد عمر ".repeat(20));
    for (const line of folded.split("\r\n")) expect(new TextEncoder().encode(line).length).toBeLessThanOrEqual(75);
  });
});

describe("validation", () => {
  it("blocks open redirects", () => {
    expect(safeNext("/community")).toBe("/community");
    expect(safeNext("//evil.test")).toBe("/");
    expect(safeNext("https://evil.test")).toBe("/");
    expect(safeNext("/\\evil.test")).toBe("/");
    expect(safeNext("/x?u=https://e.test")).toBe("/");
    expect(safeNext(undefined, "/a")).toBe("/a");
  });
  it("requires strong passwords, consent and an empty honeypot on signup", () => {
    const base = { email: "a@example.test", password: "Abcdefghij1", consent: true, language: "en" };
    expect(signupSchema.safeParse(base).success).toBe(true);
    expect(signupSchema.safeParse({ ...base, password: "short" }).success).toBe(false);
    expect(signupSchema.safeParse({ ...base, consent: false }).success).toBe(false);
    expect(signupSchema.safeParse({ ...base, website: "spam" }).success).toBe(false);
  });
  it("does not accept role fields on signup (mass assignment)", () => {
    const parsed = signupSchema.parse({ email: "a@example.test", password: "Abcdefghij1", consent: true, role: "admin" } as never);
    expect(parsed).not.toHaveProperty("role");
  });
  it("requires an explicit time or offset for iqamah rules", () => {
    expect(iqamahRuleSchema.safeParse({ prayer: "fajr", weekday: "", mode: "fixed", time: "", offset: "" }).success).toBe(false);
    expect(iqamahRuleSchema.safeParse({ prayer: "fajr", weekday: "", mode: "fixed", time: "06:30", offset: "" }).success).toBe(true);
    expect(iqamahRuleSchema.safeParse({ prayer: "fajr", weekday: "", mode: "fixed", time: "25:00", offset: "" }).success).toBe(false);
  });
  it("bounds question length and requires acknowledgement", () => {
    const q = { category: "worship", subject: "Hi there", body: "A sufficiently long question.", language: "en", acknowledge: true };
    expect(questionSchema.safeParse(q).success).toBe(true);
    expect(questionSchema.safeParse({ ...q, acknowledge: false }).success).toBe(false);
    expect(questionSchema.safeParse({ ...q, body: "x".repeat(5001) }).success).toBe(false);
  });
});

describe("throttle", () => {
  it("blocks after the limit within the window", () => {
    const key = `t-${Math.random()}`;
    for (let i = 0; i < 3; i++) expect(throttle(key, 3, 60_000).ok).toBe(true);
    const r = throttle(key, 3, 60_000);
    expect(r.ok).toBe(false);
    expect(r.retryAfterSec).toBeGreaterThan(0);
  });
});
