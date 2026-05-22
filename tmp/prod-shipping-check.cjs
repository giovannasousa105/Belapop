const fs = require("fs");
const path = require("path");
const { chromium } = require("playwright");

const BASE = "https://belapopoficial.com.br";
const OUT = path.join(process.cwd(), "tmp", "prod-shipping-check.json");

async function main() {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1440, height: 1000 }, locale: "pt-BR" });
  const consent = {
    choice: "accepted_all",
    necessary: true,
    performance: true,
    functionality: true,
    advertising: true,
    analytics: true,
    marketing: true,
    updatedAt: new Date().toISOString(),
  };
  await context.addInitScript((value) => window.localStorage.setItem("bp_cookie_consent", JSON.stringify(value)), consent);
  await context.addCookies([{ name: "bp_cookie_consent", value: JSON.stringify(consent), domain: "belapopoficial.com.br", path: "/", secure: true, sameSite: "Lax" }]);

  const page = await context.newPage();
  const events = [];
  page.on("response", async (res) => {
    if (/shipping|frete|quote|cart|checkout/i.test(res.url()) || res.status() >= 400) {
      let body = "";
      try { body = (await res.text()).slice(0, 1500); } catch {}
      events.push({ status: res.status(), url: res.url(), body });
    }
  });
  page.on("console", (msg) => {
    if (["error", "warning"].includes(msg.type())) events.push({ console: msg.type(), text: msg.text().slice(0, 500) });
  });

  await page.goto(`${BASE}/produto/serum-radiance-01`, { waitUntil: "domcontentloaded", timeout: 45000 });
  await page.waitForLoadState("networkidle", { timeout: 15000 }).catch(() => {});
  await page.locator("button:visible:has-text('Adicionar ao carrinho')").first().click({ timeout: 15000 });
  await page.waitForLoadState("networkidle", { timeout: 10000 }).catch(() => {});
  await page.goto(`${BASE}/carrinho`, { waitUntil: "domcontentloaded", timeout: 45000 });
  await page.waitForLoadState("networkidle", { timeout: 15000 }).catch(() => {});
  const before = await page.locator("body").innerText();

  const cepInput = page.locator("input[placeholder*='CEP' i], input[name*='cep' i], input").last();
  if (await cepInput.count()) {
    await cepInput.fill("01001000");
  }
  const calc = page.locator("button:visible:has-text('Calcular')").first();
  if (await calc.count()) {
    await calc.click({ timeout: 15000 });
  }
  await page.waitForLoadState("networkidle", { timeout: 15000 }).catch(() => {});
  await page.waitForTimeout(2000);
  const after = await page.locator("body").innerText();
  const storage = await page.evaluate(() => Object.fromEntries(Object.entries(localStorage).filter(([k]) => /cart|carrinho|belapop/i.test(k))));
  await page.screenshot({ path: path.join("tmp", "prod-shipping-check.png"), fullPage: false }).catch(() => {});

  await browser.close();
  fs.writeFileSync(OUT, JSON.stringify({ before: before.slice(0, 2500), after: after.slice(0, 3500), storage, events }, null, 2));
  console.log(OUT);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
