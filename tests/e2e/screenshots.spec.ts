import { test, expect, type Browser } from "@playwright/test";
import { demoCred, login } from "./helpers";

// Captures the review matrix into docs/screenshots and asserts there is no horizontal overflow.
const SIZES = [
  { name: "390x844", width: 390, height: 844 },
  { name: "768x1024", width: 768, height: 1024 },
  { name: "1440x900", width: 1440, height: 900 },
];
const PUBLIC = ["/", "/prayer-times", "/ask", "/display"];
const AUTHED: { path: string; portal: "/login" | "/imam/login" | "/admin/login"; who: "member-demo" | "imam-demo" | "admin-demo"; url: RegExp }[] = [
  { path: "/community", portal: "/login", who: "member-demo", url: /\/community/ },
  { path: "/imam", portal: "/imam/login", who: "imam-demo", url: /\/imam$/ },
  { path: "/admin", portal: "/admin/login", who: "admin-demo", url: /\/admin$/ },
];
const slug = (p: string) => (p === "/" ? "home" : p.slice(1).replace(/\//g, "-"));

async function capture(browser: Browser, path: string, size: (typeof SIZES)[number], auth?: (typeof AUTHED)[number]) {
  const ctx = await browser.newContext({ viewport: { width: size.width, height: size.height } });
  const page = await ctx.newPage();
  if (auth) await login(page, auth.portal, demoCred(auth.who), auth.url);
  await page.goto(path);
  await page.waitForLoadState("networkidle");
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
  await page.screenshot({ path: `docs/screenshots/${slug(path)}-${size.name}.png`, fullPage: path !== "/display" });
  await ctx.close();
  expect(overflow, `${path} @ ${size.name}`).toBeLessThanOrEqual(0);
}

for (const size of SIZES) {
  for (const path of PUBLIC) test(`screenshot ${path} @ ${size.name}`, async ({ browser }) => capture(browser, path, size));
  for (const a of AUTHED) test(`screenshot ${a.path} @ ${size.name}`, async ({ browser }) => capture(browser, a.path, size, a));
}

for (const big of [
  { name: "1920x1080", width: 1920, height: 1080 },
  { name: "3840x2160", width: 3840, height: 2160 },
]) {
  test(`masjid screen @ ${big.name}`, async ({ browser }) => {
    const ctx = await browser.newContext({ viewport: { width: big.width, height: big.height } });
    const page = await ctx.newPage();
    await page.goto("/display");
    await page.waitForLoadState("networkidle");
    const fits = await page.evaluate(() => ({ w: document.documentElement.scrollWidth <= window.innerWidth, h: document.documentElement.scrollHeight <= window.innerHeight }));
    await page.screenshot({ path: `docs/screenshots/display-${big.name}.png` });
    await ctx.close();
    expect(fits).toEqual({ w: true, h: true });
  });
}
