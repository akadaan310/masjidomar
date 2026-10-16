import { test, expect, type Browser } from "@playwright/test";
import { randomBytes } from "node:crypto";
import { demoCred, latestEmailLink, login } from "./helpers";

// Full showcase workflow against the real local backend. Requires: supabase db reset,
// npm run demo:bootstrap, and the app running (npm run build && npm start).
test.describe.configure({ mode: "serial" });

const SHOTS = "docs/screenshots/workflow";
const newMemberEmail = `e2e-member-${randomBytes(3).toString("hex")}@example.test`;
const newMemberPassword = `Pw${randomBytes(9).toString("base64url")}9a`;
const questionSubject = `Visiting with my elderly father ${randomBytes(2).toString("hex")}`;
const imamAnswer = "Thank you for asking. Please come a little before the prayer; a chair can be placed at the back of the hall. (E2E reply)";
let questionUrl = "";

async function freshPage(browser: Browser, width = 1280, height = 900) {
  const ctx = await browser.newContext({ viewport: { width, height } });
  return { ctx, page: await ctx.newPage() };
}

test("1. member credentials are refused at the admin and imam portals", async ({ browser }) => {
  const { ctx, page } = await freshPage(browser);
  const member = demoCred("member-demo");
  for (const portal of ["/admin/login", "/imam/login"] as const) {
    await page.goto(portal);
    await page.getByLabel("Email", { exact: true }).fill(member.email);
    await page.getByLabel("Password", { exact: true }).fill(member.password);
    await page.locator("form:has(#email) button[type=submit]").click();
    await expect(page.locator("main").getByRole("alert")).toContainText(/does not have administrator access|not authorised for the imam desk/);
  }
  // Signed out again: protected pages redirect to login
  await page.goto("/admin");
  await expect(page).toHaveURL(/\/admin\/login/);
  await ctx.close();
});

test("2. admin edits an iqamah time, publishes, and the public page + masjid screen update", async ({ browser }) => {
  const { ctx, page } = await freshPage(browser, 1440, 900);
  await page.goto("/prayer-times");
  await page.screenshot({ path: `${SHOTS}/01-prayer-times-before.png`, fullPage: true });
  await expect(page.getByText("1:52 PM")).toHaveCount(0);

  await login(page, "/admin/login", demoCred("admin-demo"), /\/admin$/);
  await page.goto("/admin/prayer");
  const startDraft = page.getByRole("button", { name: /Edit as new draft/ });
  if (await startDraft.isVisible()) await startDraft.click();
  await expect(page.getByText(/Editing draft v/)).toBeVisible();

  const dhuhr = page.locator("li", { has: page.locator('input[name="prayer"][value="dhuhr"]') }).first();
  await dhuhr.getByLabel("Fixed").check();
  await dhuhr.getByLabel("Time (24h)").fill("13:52");
  await dhuhr.getByRole("button", { name: "Save" }).click();
  await expect(dhuhr.getByRole("status")).toContainText("saved");
  await expect(page.getByRole("table", { name: "Draft preview" })).toContainText("1:52 PM");
  await page.screenshot({ path: `${SHOTS}/02-admin-draft-preview.png`, fullPage: true });

  // Publishing without verification is refused
  await page.getByRole("button", { name: "Publish schedule" }).click();
  await expect(page.locator("main").getByRole("alert")).toContainText(/confirm the times were checked/);
  await page.getByLabel(/I confirm these iqamah/).check();
  await page.getByRole("button", { name: "Publish schedule" }).click();
  await expect(page.getByRole("status").filter({ hasText: "Published" })).toBeVisible();

  const pub = await ctx.newPage();
  await pub.goto("/prayer-times");
  await expect(pub.getByRole("table", { name: /Prayer times for/ })).toContainText("1:52 PM");
  await expect(pub.getByText("Demo schedule — not current prayer times").first()).toBeVisible(); // still a demo while in concept mode
  await pub.screenshot({ path: `${SHOTS}/03-prayer-times-after.png`, fullPage: true });

  await pub.setViewportSize({ width: 1920, height: 1080 });
  await pub.goto("/display");
  await expect(pub.getByLabel("Today's prayer times")).toContainText("1:52 PM");
  await pub.screenshot({ path: `${SHOTS}/04-display-after.png` });
  await ctx.close();
});

test("3. a new member signs up, verifies email, and asks a private question", async ({ browser }) => {
  const { ctx, page } = await freshPage(browser, 390, 844);
  await page.goto("/signup");
  await page.getByLabel(/What should we call you/).fill("Yusuf");
  await page.getByLabel("Email", { exact: true }).fill(newMemberEmail);
  await page.getByLabel("Password", { exact: true }).fill(newMemberPassword);
  await page.getByRole("checkbox", { name: /privacy notice/ }).check();
  await page.getByRole("button", { name: "Create account" }).click();
  await expect(page.getByRole("status")).toContainText("Check your email");

  const link = await latestEmailLink(newMemberEmail);
  await page.goto(link);
  await expect(page).toHaveURL(/\/community/);

  await page.goto("/ask");
  await page.getByLabel("Topic", { exact: true }).selectOption("community");
  await page.getByLabel("Subject", { exact: true }).fill(questionSubject);
  await page.getByLabel("Your question", { exact: true }).fill("My father uses a walker. Is there somewhere he can sit during prayer, and is there a step at the entrance?");
  await page.getByRole("checkbox", { name: /Show my display name/ }).check();
  await page.getByRole("checkbox", { name: /replies come from a person/ }).check();
  await page.screenshot({ path: `${SHOTS}/05-member-ask.png`, fullPage: true });
  await page.getByRole("button", { name: "Send my question privately" }).click();
  await expect(page).toHaveURL(/\/questions\/[0-9a-f-]{36}\?sent=1/);
  questionUrl = new URL(page.url()).pathname;
  await expect(page.getByText("Your question was sent privately.")).toBeVisible();
  await ctx.close();
});

test("4. another member cannot open that question (no IDOR)", async ({ browser }) => {
  const { ctx, page } = await freshPage(browser);
  await login(page, "/login", demoCred("member-demo"), /\/community/);
  const res = await page.goto(questionUrl);
  expect(res?.status()).toBe(404);
  await expect(page.getByText("This page isn't here")).toBeVisible();
  await expect(page.getByText(questionSubject)).toHaveCount(0);
  // ...and is shown a friendly forbidden state (no data) in staff areas
  await page.goto("/admin");
  await expect(page.getByText("This area is for authorised staff")).toBeVisible();
  await page.goto("/imam");
  await expect(page.getByText("This area is for authorised staff")).toBeVisible();
  await ctx.close();
});

test("5. imam acknowledges, drafts privately, previews and sends the answer", async ({ browser }) => {
  const { ctx, page } = await freshPage(browser, 1440, 900);
  await login(page, "/imam/login", demoCred("imam-demo"), /\/imam$/);
  await expect(page.getByText(questionSubject)).toBeVisible();
  await page.screenshot({ path: `${SHOTS}/06-imam-inbox.png`, fullPage: true });
  await page.getByText(questionSubject).click();
  await expect(page.getByText("from Yusuf")).toBeVisible();
  await page.getByRole("button", { name: "Acknowledge receipt" }).click();
  await expect(page.locator("main header").getByText("Acknowledged", { exact: true })).toBeVisible();
  await page.getByLabel(/Draft \(visible only to you/).fill(imamAnswer);
  await page.getByRole("button", { name: "Save draft" }).click();
  await expect(page.getByText("Preview — exactly what the asker will see")).toBeVisible();
  await page.getByLabel(/I have reviewed this reply/).check();
  await page.screenshot({ path: `${SHOTS}/07-imam-preview.png`, fullPage: true });
  await page.getByRole("button", { name: "Send to asker only" }).click();
  await expect(page.locator("main header").getByText("Answered", { exact: true })).toBeVisible();
  await expect(page.locator("article").filter({ hasText: imamAnswer })).toContainText("not yet read");
  await ctx.close();
});

test("6. the member sees the answer; admin sees only aggregate metadata", async ({ browser }) => {
  const m = await freshPage(browser, 390, 844);
  await login(m.page, "/login", { email: newMemberEmail, password: newMemberPassword }, /\/community/);
  await expect(m.page.getByText(/1 new reply/)).toBeVisible();
  await m.page.goto(questionUrl);
  await expect(m.page.getByText(imamAnswer)).toBeVisible();
  await expect(m.page.getByText("Answered").first()).toBeVisible();
  await m.page.screenshot({ path: `${SHOTS}/08-member-answer.png`, fullPage: true });
  await m.ctx.close();

  const a = await freshPage(browser, 1440, 900);
  await login(a.page, "/admin/login", demoCred("admin-demo"), /\/admin$/);
  await a.page.goto("/admin/questions");
  await expect(a.page.getByRole("heading", { name: "Question queue" })).toBeVisible();
  await expect(a.page.getByText(questionSubject)).toHaveCount(0);
  await expect(a.page.getByText(imamAnswer)).toHaveCount(0);
  await a.page.screenshot({ path: `${SHOTS}/09-admin-aggregate-only.png`, fullPage: true });
  await a.ctx.close();
});

test("7. signing out ends the session", async ({ browser }) => {
  const { ctx, page } = await freshPage(browser, 1440, 900);
  await login(page, "/login", demoCred("member-demo"), /\/community/);
  await page.getByRole("button", { name: "Sign out" }).first().click();
  await page.goto("/community");
  await expect(page).toHaveURL(/\/login\?next=/);
  await ctx.close();
});
