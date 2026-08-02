import { chromium } from "playwright";

const OUT = process.argv[2] || ".";
const base = "http://localhost:3000";
const ADMIN = { name: "sl_user", value: "anwar@anwarsupplies.com", domain: "localhost", path: "/" };
const IND = { name: "sl_industry", value: "physical", domain: "localhost", path: "/" };

const shots = [
  { name: "transfers", url: "/transfers", full: true },
  { name: "transfers-new", url: "/transfers/new", full: true },
  { name: "locations2", url: "/locations", full: true },
];

const browser = await chromium.launch();
for (const s of shots) {
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1 });
  await ctx.addCookies([ADMIN, IND]);
  const page = await ctx.newPage();
  await page.goto(base + s.url, { waitUntil: "networkidle" });
  await page.waitForTimeout(600);
  await page.screenshot({ path: `${OUT}/${s.name}.png`, fullPage: s.full });
  console.log("shot", s.name);
  await ctx.close();
}
await browser.close();
console.log("done");
