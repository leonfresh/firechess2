import { chromium } from "playwright";
import { writeFileSync } from "fs";

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
await page.goto("http://localhost:3000", { waitUntil: "networkidle", timeout: 30000 }).catch(() => {});
await page.waitForTimeout(3000);
const path = "/c/Users/leonf/nextjs/firechess2/.hermes/screenshots/homepage.png";
await page.screenshot({ path, fullPage: false });
console.log("Screenshot:", path);
await browser.close();
