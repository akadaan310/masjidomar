import { readFileSync, existsSync } from "node:fs";
import { expect, type Page } from "@playwright/test";

export type Cred = { email: string; password: string };

/** Reads the gitignored DEMO_ACCESS.txt produced by scripts/bootstrap-demo.mjs. */
export function demoCred(key: "admin-demo" | "imam-demo" | "member-demo"): Cred {
  if (!existsSync("DEMO_ACCESS.txt")) throw new Error("Run `npm run demo:bootstrap` first (creates DEMO_ACCESS.txt).");
  const section = readFileSync("DEMO_ACCESS.txt", "utf8").split(`[${key}]`)[1];
  return { email: section.match(/email:\s+(\S+)/)![1], password: section.match(/password:\s+(\S+)/)![1] };
}

export async function login(page: Page, path: "/login" | "/admin/login" | "/imam/login", cred: Cred, expectUrl: RegExp) {
  await page.goto(path);
  await page.getByLabel("Email", { exact: true }).fill(cred.email);
  await page.getByLabel("Password", { exact: true }).fill(cred.password);
  await page.locator("form:has(#email) button[type=submit]").click();
  await expect(page).toHaveURL(expectUrl);
}

export const MAILPIT = process.env.MAILPIT_URL ?? "http://127.0.0.1:54324";

/** Fetch the newest email to `to` from the local Mailpit inbox and return the first link in it. */
export async function latestEmailLink(to: string): Promise<string> {
  for (let i = 0; i < 30; i++) {
    const res = await fetch(`${MAILPIT}/api/v1/search?query=${encodeURIComponent(`to:"${to}"`)}`);
    const json = (await res.json()) as { messages?: { ID: string }[] };
    if (json.messages?.length) {
      const msg = (await (await fetch(`${MAILPIT}/api/v1/message/${json.messages[0].ID}`)).json()) as { HTML: string; Text: string };
      const m = (msg.Text + msg.HTML).match(/https?:\/\/[^\s"'<>]+verify[^\s"'<>]+/);
      if (m) return m[0].replace(/&amp;/g, "&");
    }
    await new Promise((r) => setTimeout(r, 500));
  }
  throw new Error(`No email found for ${to}`);
}
