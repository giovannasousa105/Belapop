const fs = require("fs");
const path = require("path");
const { chromium, devices } = require("playwright");

const BASE = "https://belapopoficial.com.br";
const OUT = path.join(process.cwd(), "tmp", "prod-qa-after-consent.json");

async function acceptCookies(page) {
  const accept = page.locator("button:has-text('ACEITAR TODOS'), button:has-text('Aceitar todos')").first();
  if (await accept.count()) {
    await accept.click({ timeout: 8000 }).catch(() => {});
    await page.waitForTimeout(1000);
  }
}

async function collect(page) {
  return page.evaluate(() => ({
    url: location.href,
    title: document.title,
    text: document.body.innerText.slice(0, 2500),
    overflow: {
      width: innerWidth,
      docWidth: document.documentElement.scrollWidth,
      hasHorizontalOverflow: document.documentElement.scrollWidth > innerWidth + 2,
    },
    buttons: Array.from(document.querySelectorAll("button,a,input[type='submit']"))
      .map((el) => ({
        tag: el.tagName,
        text: (el.textContent || el.getAttribute("aria-label") || el.getAttribute("value") || el.getAttribute("href") || "").trim().replace(/\s+/g, " ").slice(0, 140),
        href: el.getAttribute("href"),
        type: el.getAttribute("type"),
        disabled: el.hasAttribute("disabled"),
        visible: !!(el.offsetWidth || el.offsetHeight || el.getClientRects().length),
      }))
      .filter((x) => x.text || x.href)
      .slice(0, 100),
  }));
}

async function runFlow(context, name, fn) {
  const page = await context.newPage();
  const consoleMessages = [];
  const badResponses = [];
  const failures = [];
  page.on("console", (msg) => {
    if (["error", "warning"].includes(msg.type())) consoleMessages.push({ type: msg.type(), text: msg.text().slice(0, 500) });
  });
  page.on("response", (res) => {
    if (res.status() >= 400) badResponses.push({ status: res.status(), url: res.url() });
  });
  page.on("requestfailed", (req) => failures.push({ url: req.url(), error: req.failure()?.errorText }));
  try {
    const data = await fn(page);
    await page.screenshot({ path: path.join("tmp", `prod-consent-${name}.png`), fullPage: false }).catch(() => {});
    await page.close();
    return { name, ok: true, ...data, consoleMessages, badResponses, failures };
  } catch (error) {
    await page.screenshot({ path: path.join("tmp", `prod-consent-${name}-error.png`), fullPage: false }).catch(() => {});
    const url = page.url();
    const data = await collect(page).catch(() => null);
    await page.close();
    return { name, ok: false, error: String(error.message || error), url, data, consoleMessages, badResponses, failures };
  }
}

async function main() {
  const browser = await chromium.launch({ headless: true });
  const desktop = await browser.newContext({ viewport: { width: 1440, height: 1000 }, locale: "pt-BR" });
  const mobile = await browser.newContext({ ...devices["iPhone 14 Pro"], locale: "pt-BR" });
  const android = await browser.newContext({ ...devices["Pixel 7"], locale: "pt-BR" });
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
  for (const context of [desktop, mobile, android]) {
    await context.addInitScript((value) => {
      window.localStorage.setItem("bp_cookie_consent", JSON.stringify(value));
    }, consent);
    await context.addCookies([
      {
        name: "bp_cookie_consent",
        value: JSON.stringify(consent),
        domain: "belapopoficial.com.br",
        path: "/",
        httpOnly: false,
        secure: true,
        sameSite: "Lax",
      },
    ]);
  }

  const flows = [];

  flows.push(await runFlow(mobile, "mobile-home-after-consent", async (page) => {
    await page.goto(`${BASE}/`, { waitUntil: "domcontentloaded", timeout: 45000 });
    await acceptCookies(page);
    await page.waitForLoadState("networkidle", { timeout: 15000 }).catch(() => {});
    return await collect(page);
  }));

  flows.push(await runFlow(mobile, "mobile-menu", async (page) => {
    await page.goto(`${BASE}/`, { waitUntil: "domcontentloaded", timeout: 45000 });
    await acceptCookies(page);
    const menu = page.locator("button[aria-label*='menu' i], button:has-text('Abrir menu')").first();
    if (await menu.count()) await menu.click();
    await page.waitForTimeout(1000);
    return await collect(page);
  }));

  flows.push(await runFlow(desktop, "login-validation", async (page) => {
    await page.goto(`${BASE}/login?returnTo=%2Fcheckout`, { waitUntil: "domcontentloaded", timeout: 45000 });
    await acceptCookies(page);
    await page.waitForLoadState("networkidle", { timeout: 15000 }).catch(() => {});
    const before = await collect(page);
    const email = page.locator("input[type='email'], input[name*='email' i], input[placeholder*='email' i]").first();
    const password = page.locator("input[type='password']").first();
    if (await email.count()) await email.fill("qa-invalid-belapop@example.com");
    if (await password.count()) await password.fill("senha-invalida-123");
    const submit = page.locator("button:has-text('ACESSAR COLECAO'), button:has-text('Acessar'), button[type='submit']").first();
    if (await submit.count()) await submit.click();
    await page.waitForLoadState("networkidle", { timeout: 10000 }).catch(() => {});
    await page.waitForTimeout(1500);
    return { before, after: await collect(page) };
  }));

  flows.push(await runFlow(desktop, "oauth-buttons", async (page) => {
    await page.goto(`${BASE}/login`, { waitUntil: "domcontentloaded", timeout: 45000 });
    await acceptCookies(page);
    return await collect(page);
  }));

  flows.push(await runFlow(desktop, "pdp-add-cart-visible", async (page) => {
    await page.goto(`${BASE}/produto/serum-radiance-01`, { waitUntil: "domcontentloaded", timeout: 45000 });
    await acceptCookies(page);
    await page.waitForLoadState("networkidle", { timeout: 15000 }).catch(() => {});
    const visibleButtons = await page.locator("button,a").evaluateAll((els) => els.map((el) => ({
      text: (el.textContent || el.getAttribute("aria-label") || el.getAttribute("href") || "").trim().replace(/\s+/g, " ").slice(0, 140),
      href: el.getAttribute("href"),
      visible: !!(el.offsetWidth || el.offsetHeight || el.getClientRects().length),
      disabled: el.hasAttribute("disabled"),
    })).filter((x) => x.visible && (x.text || x.href)));
    const add = page.locator("button:visible:has-text('Adicionar'), button:visible:has-text('Comprar'), a:visible:has-text('Comprar'), a:visible:has-text('Adicionar')").first();
    let clicked = false;
    if (await add.count()) {
      await add.click();
      clicked = true;
      await page.waitForLoadState("networkidle", { timeout: 10000 }).catch(() => {});
      await page.waitForTimeout(1500);
    }
    return { clicked, page: await collect(page), visibleButtons: visibleButtons.slice(0, 60), localStorage: await page.evaluate(() => Object.entries(localStorage).filter(([k]) => /cart|carrinho|belapop/i.test(k)).slice(0, 20)) };
  }));

  flows.push(await runFlow(desktop, "cart-after-attempt", async (page) => {
    await page.goto(`${BASE}/carrinho`, { waitUntil: "domcontentloaded", timeout: 45000 });
    await acceptCookies(page);
    await page.waitForLoadState("networkidle", { timeout: 15000 }).catch(() => {});
    return await collect(page);
  }));

  flows.push(await runFlow(android, "android-home-after-consent", async (page) => {
    await page.goto(`${BASE}/`, { waitUntil: "domcontentloaded", timeout: 45000 });
    await acceptCookies(page);
    await page.waitForLoadState("networkidle", { timeout: 15000 }).catch(() => {});
    return await collect(page);
  }));

  await desktop.close();
  await mobile.close();
  await android.close();
  await browser.close();

  fs.writeFileSync(OUT, JSON.stringify({ generatedAt: new Date().toISOString(), flows }, null, 2));
  console.log(OUT);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
