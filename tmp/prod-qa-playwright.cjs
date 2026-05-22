const fs = require("fs");
const path = require("path");
const { chromium, devices } = require("playwright");

const BASE = "https://belapopoficial.com.br";
const OUT = path.join(process.cwd(), "tmp", "prod-qa-report.json");

const ptIssues = [
  ["voce", "você"],
  ["voces", "vocês"],
  ["hidratacao", "hidratação"],
  ["comeca", "começa"],
  ["comecar", "começar"],
  ["diagnostico", "diagnóstico"],
  ["rotina recomendada", "ok"],
  ["informacao", "informação"],
  ["seguranca", "segurança"],
  ["politica", "política"],
  ["privacidade", "ok"],
  ["avaliacao", "avaliação"],
  ["oleosidade", "ok"],
  ["maquiagem", "ok"],
  ["carrinho", "ok"],
  ["autocuidado", "ok"],
  ["preco", "preço"],
  ["frete gratis", "frete grátis"],
  ["produtos coreanos originais", "ok"],
  ["protecao", "proteção"],
  ["sensivel", "sensível"],
  ["aparencia", "aparência"],
  ["beneficios", "benefícios"],
  ["tambem", "também"],
  ["nao", "não"],
  ["ate", "até"],
  ["ja", "já"],
  ["sera", "será"],
];

const pages = [
  "/",
  "/skin-scan",
  "/skin-scan/foco",
  "/catalogo",
  "/kits",
  "/produto/serum-radiance-01",
  "/produto/gel-limpeza-veludo",
  "/carrinho",
  "/checkout",
  "/login",
  "/register",
  "/sobre",
];

function pickInteresting(items, limit = 20) {
  return items
    .filter(Boolean)
    .slice(0, limit);
}

async function scanPage(context, route, label) {
  const page = await context.newPage();
  const logs = [];
  const requestFailures = [];
  const badResponses = [];
  const pageErrors = [];

  page.on("console", (msg) => {
    if (["error", "warning"].includes(msg.type())) {
      logs.push({ type: msg.type(), text: msg.text().slice(0, 500) });
    }
  });
  page.on("requestfailed", (req) => {
    requestFailures.push({ url: req.url(), failure: req.failure()?.errorText });
  });
  page.on("response", (res) => {
    if (res.status() >= 400) {
      badResponses.push({ status: res.status(), url: res.url() });
    }
  });
  page.on("pageerror", (err) => pageErrors.push(err.message));

  const url = `${BASE}${route}`;
  let status = null;
  let loadError = null;
  try {
    const response = await page.goto(url, { waitUntil: "domcontentloaded", timeout: 45000 });
    status = response?.status() ?? null;
    await page.waitForLoadState("networkidle", { timeout: 15000 }).catch(() => {});
  } catch (error) {
    loadError = String(error.message || error);
  }

  const data = await page.evaluate(() => {
    const text = document.body?.innerText || "";
    const headings = Array.from(document.querySelectorAll("h1,h2,h3"))
      .slice(0, 12)
      .map((el) => ({ tag: el.tagName, text: el.textContent?.trim().replace(/\s+/g, " ").slice(0, 160) }));
    const buttons = Array.from(document.querySelectorAll("button,a,input[type='submit']"))
      .slice(0, 80)
      .map((el) => ({
        tag: el.tagName,
        text: (el.textContent || el.getAttribute("aria-label") || el.getAttribute("value") || "").trim().replace(/\s+/g, " ").slice(0, 140),
        href: el.getAttribute("href"),
        type: el.getAttribute("type"),
      }))
      .filter((x) => x.text || x.href);
    const meta = {
      title: document.title,
      description: document.querySelector("meta[name='description']")?.getAttribute("content") || null,
      canonical: document.querySelector("link[rel='canonical']")?.getAttribute("href") || null,
      ogTitle: document.querySelector("meta[property='og:title']")?.getAttribute("content") || null,
      ogImage: document.querySelector("meta[property='og:image']")?.getAttribute("content") || null,
    };
    const bodyFont = getComputedStyle(document.body).fontFamily;
    const h1 = document.querySelector("h1");
    const h1Style = h1
      ? {
          fontFamily: getComputedStyle(h1).fontFamily,
          fontWeight: getComputedStyle(h1).fontWeight,
          fontSize: getComputedStyle(h1).fontSize,
          lineHeight: getComputedStyle(h1).lineHeight,
        }
      : null;
    const overflow = {
      width: window.innerWidth,
      docWidth: document.documentElement.scrollWidth,
      bodyWidth: document.body.scrollWidth,
      hasHorizontalOverflow: document.documentElement.scrollWidth > window.innerWidth + 2,
    };
    const images = Array.from(document.images).map((img) => ({
      src: img.currentSrc || img.src,
      alt: img.alt || "",
      loading: img.loading || "",
      width: img.width,
      height: img.height,
      naturalWidth: img.naturalWidth,
      naturalHeight: img.naturalHeight,
      complete: img.complete,
    }));
    return { text, headings, buttons, meta, bodyFont, h1Style, overflow, images };
  }).catch((error) => ({ evalError: String(error.message || error) }));

  const lower = (data.text || "").toLowerCase();
  const accentIssues = ptIssues
    .filter(([word, expected]) => expected !== "ok" && new RegExp(`\\b${word}\\b`, "i").test(lower))
    .map(([word, expected]) => {
      const idx = lower.indexOf(word);
      return {
        found: word,
        expected,
        context: (data.text || "").slice(Math.max(0, idx - 45), idx + word.length + 45).replace(/\s+/g, " "),
      };
    });

  let screenshot = null;
  try {
    screenshot = path.join("tmp", `prod-${label}-${route.replace(/[^a-z0-9]+/gi, "-") || "home"}.png`);
    await page.screenshot({ path: screenshot, fullPage: false });
  } catch {}

  const finalUrl = page.url();
  await page.close();
  return {
    route,
    url,
    finalUrl,
    status,
    loadError,
    title: data.meta?.title,
    meta: data.meta,
    headings: data.headings,
    buttons: pickInteresting(data.buttons || [], 25),
    bodyFont: data.bodyFont,
    h1Style: data.h1Style,
    overflow: data.overflow,
    accentIssues,
    console: pickInteresting(logs),
    pageErrors: pickInteresting(pageErrors),
    badResponses: pickInteresting(badResponses, 30),
    requestFailures: pickInteresting(requestFailures, 30),
    imagesSummary: {
      total: data.images?.length || 0,
      missingAlt: (data.images || []).filter((i) => !i.alt).length,
      lazy: (data.images || []).filter((i) => i.loading === "lazy").length,
      notLoaded: (data.images || []).filter((i) => !i.complete || i.naturalWidth === 0).length,
    },
    screenshot,
  };
}

async function safeInteraction(context, name, fn) {
  const page = await context.newPage();
  const logs = [];
  const badResponses = [];
  const pageErrors = [];
  page.on("console", (msg) => {
    if (["error", "warning"].includes(msg.type())) logs.push({ type: msg.type(), text: msg.text().slice(0, 500) });
  });
  page.on("response", (res) => {
    if (res.status() >= 400) badResponses.push({ status: res.status(), url: res.url() });
  });
  page.on("pageerror", (err) => pageErrors.push(err.message));
  try {
    const result = await fn(page);
    await page.close();
    return { name, ok: true, ...result, console: logs, badResponses, pageErrors };
  } catch (error) {
    const currentUrl = page.url();
    await page.screenshot({ path: path.join("tmp", `prod-interaction-${name}.png`), fullPage: false }).catch(() => {});
    await page.close();
    return { name, ok: false, error: String(error.message || error), currentUrl, console: logs, badResponses, pageErrors };
  }
}

async function main() {
  fs.mkdirSync(path.join(process.cwd(), "tmp"), { recursive: true });
  const browser = await chromium.launch({ headless: true });
  const desktop = await browser.newContext({ viewport: { width: 1440, height: 1000 }, locale: "pt-BR" });
  const mobile = await browser.newContext({ ...devices["iPhone 14 Pro"], locale: "pt-BR" });
  const android = await browser.newContext({ ...devices["Pixel 7"], locale: "pt-BR" });

  const report = {
    generatedAt: new Date().toISOString(),
    base: BASE,
    desktop: [],
    mobile: [],
    android: [],
    interactions: [],
  };

  for (const route of pages) report.desktop.push(await scanPage(desktop, route, "desktop"));
  for (const route of ["/", "/catalogo", "/produto/serum-radiance-01", "/carrinho", "/checkout", "/login"]) {
    report.mobile.push(await scanPage(mobile, route, "iphone"));
  }
  for (const route of ["/", "/catalogo", "/produto/serum-radiance-01", "/carrinho", "/checkout"]) {
    report.android.push(await scanPage(android, route, "android"));
  }

  report.interactions.push(await safeInteraction(desktop, "checkout-auth-redirect", async (page) => {
    const res = await page.goto(`${BASE}/checkout`, { waitUntil: "domcontentloaded", timeout: 45000 });
    await page.waitForLoadState("networkidle", { timeout: 15000 }).catch(() => {});
    return { status: res?.status() ?? null, finalUrl: page.url(), bodyText: (await page.locator("body").innerText()).slice(0, 1000) };
  }));

  report.interactions.push(await safeInteraction(desktop, "login-invalid-email-password", async (page) => {
    const res = await page.goto(`${BASE}/login?returnTo=%2Fcheckout`, { waitUntil: "domcontentloaded", timeout: 45000 });
    await page.waitForLoadState("networkidle", { timeout: 15000 }).catch(() => {});
    const bodyBefore = await page.locator("body").innerText();
    const inputs = await page.locator("input").evaluateAll((els) => els.map((el) => ({
      type: el.getAttribute("type"),
      name: el.getAttribute("name"),
      placeholder: el.getAttribute("placeholder"),
      autocomplete: el.getAttribute("autocomplete"),
    })));
    const buttons = await page.locator("button,a").evaluateAll((els) => els.map((el) => (el.textContent || el.getAttribute("aria-label") || el.getAttribute("href") || "").trim()).filter(Boolean).slice(0, 40));
    const email = page.locator("input[type='email'], input[name*='email' i], input[placeholder*='email' i]").first();
    const password = page.locator("input[type='password']").first();
    if (await email.count()) await email.fill("qa-invalid-belapop@example.com");
    if (await password.count()) await password.fill("senha-invalida-123");
    const submit = page.locator("button[type='submit'], button:has-text('Entrar'), button:has-text('login'), button:has-text('Login')").first();
    if (await submit.count()) {
      await submit.click();
      await page.waitForLoadState("networkidle", { timeout: 10000 }).catch(() => {});
      await page.waitForTimeout(1500);
    }
    const bodyAfter = await page.locator("body").innerText();
    return {
      status: res?.status() ?? null,
      finalUrl: page.url(),
      inputs,
      buttons,
      changedText: bodyAfter !== bodyBefore,
      bodyAfter: bodyAfter.slice(0, 1400),
    };
  }));

  report.interactions.push(await safeInteraction(desktop, "pdp-add-cart-attempt", async (page) => {
    const res = await page.goto(`${BASE}/produto/serum-radiance-01`, { waitUntil: "domcontentloaded", timeout: 45000 });
    await page.waitForLoadState("networkidle", { timeout: 15000 }).catch(() => {});
    const buttons = await page.locator("button,a").evaluateAll((els) => els.map((el, index) => ({
      index,
      text: (el.textContent || el.getAttribute("aria-label") || el.getAttribute("href") || "").trim().replace(/\s+/g, " ").slice(0, 120),
      disabled: el.hasAttribute("disabled"),
      href: el.getAttribute("href"),
    })).filter((x) => x.text || x.href));
    const add = page.locator("button:has-text('Adicionar'), button:has-text('carrinho'), button:has-text('Comprar'), a:has-text('Comprar'), a:has-text('carrinho')").first();
    let clicked = false;
    if (await add.count()) {
      await add.click();
      clicked = true;
      await page.waitForLoadState("networkidle", { timeout: 10000 }).catch(() => {});
      await page.waitForTimeout(1500);
    }
    return {
      status: res?.status() ?? null,
      finalUrl: page.url(),
      clicked,
      buttons: buttons.slice(0, 50),
      cartText: (await page.locator("body").innerText()).slice(0, 1800),
      localStorage: await page.evaluate(() => Object.keys(localStorage).filter((k) => /cart|carrinho|belapop/i.test(k)).map((key) => ({ key, value: localStorage.getItem(key)?.slice(0, 300) }))),
    };
  }));

  report.interactions.push(await safeInteraction(desktop, "cart-edit-controls", async (page) => {
    const res = await page.goto(`${BASE}/carrinho`, { waitUntil: "domcontentloaded", timeout: 45000 });
    await page.waitForLoadState("networkidle", { timeout: 15000 }).catch(() => {});
    return {
      status: res?.status() ?? null,
      finalUrl: page.url(),
      bodyText: (await page.locator("body").innerText()).slice(0, 1800),
      controls: await page.locator("button,input,select,a").evaluateAll((els) => els.map((el) => ({
        tag: el.tagName,
        text: (el.textContent || el.getAttribute("aria-label") || el.getAttribute("placeholder") || el.getAttribute("href") || "").trim().replace(/\s+/g, " ").slice(0, 120),
        type: el.getAttribute("type"),
        value: el.getAttribute("value"),
      })).filter((x) => x.text || x.type || x.value).slice(0, 60)),
    };
  }));

  await desktop.close();
  await mobile.close();
  await android.close();
  await browser.close();
  fs.writeFileSync(OUT, JSON.stringify(report, null, 2));
  console.log(OUT);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
