import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

const PAGES = ["/", "/prayer-times", "/ask", "/welcome", "/welcome?lang=ar", "/visit", "/programs", "/announcements", "/faq", "/volunteer", "/support", "/about", "/privacy", "/accessibility", "/login", "/signup", "/admin/login", "/imam/login", "/display"];

for (const path of PAGES) {
  test(`no serious accessibility violations on ${path}`, async ({ page }) => {
    await page.goto(path);
    const results = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"]).analyze();
    const serious = results.violations.filter((v) => v.impact === "serious" || v.impact === "critical");
    expect(serious.map((v) => `${v.id}: ${v.nodes.length} node(s) — ${v.nodes[0]?.target}`)).toEqual([]);
  });
}

test("no horizontal overflow at 320px on key pages", async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 720 });
  for (const path of ["/", "/prayer-times", "/ask", "/welcome?lang=ar", "/visit", "/programs"]) {
    await page.goto(path);
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
    expect(overflow, path).toBeLessThanOrEqual(0);
  }
});

test("public pages never mention the agency and show the concept disclosure", async ({ page }) => {
  for (const path of ["/", "/about", "/visit", "/prayer-times"]) {
    await page.goto(path);
    const text = (await page.locator("body").innerText()).toLowerCase();
    expect(text, path).not.toContain("scorpio");
    expect(text, path).toContain("concept preview");
  }
});
