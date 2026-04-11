const puppeteer = require("puppeteer-core");

const BASE_URL = "http://localhost:3000";
const LOGIN_URL = `${BASE_URL}/adm/login`;
const DASHBOARD_URL = `${BASE_URL}/adm/dashboard-executivo`;
const EMAIL = "helena.master@belapop.internal";
const PASSWORD = "BelaPopADM#2026";

async function login(page) {
  await page.goto(LOGIN_URL, { waitUntil: "networkidle2", timeout: 120000 });
  const payload = await page.evaluate(
    async ({ email, password }) => {
      const response = await fetch("/api/adm/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          email,
          password,
          next: "/adm/dashboard-executivo"
        })
      });

      const json = await response.json().catch(() => null);
      return {
        ok: response.ok,
        json
      };
    },
    { email: EMAIL, password: PASSWORD }
  );

  if (!payload.ok || !payload.json?.ok) {
    throw new Error(`Falha no login: ${JSON.stringify(payload)}`);
  }
}

async function capture() {
  const browser = await puppeteer.launch({
    headless: true,
    executablePath: "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
    defaultViewport: null,
    args: ["--no-sandbox", "--disable-dev-shm-usage"]
  });

  try {
    const page = await browser.newPage();
    await page.setViewport({ width: 1440, height: 1400, deviceScaleFactor: 1 });
    await login(page);
    await page.goto(DASHBOARD_URL, { waitUntil: "networkidle2", timeout: 120000 });
    await page.screenshot({
      path: "tmp/adm-dashboard-executive-desktop.png",
      fullPage: true
    });
    await page.screenshot({
      path: "tmp/adm-dashboard-executive-desktop-fold.png",
      fullPage: false
    });

    const mobile = await browser.newPage();
    await mobile.setViewport({
      width: 390,
      height: 1200,
      isMobile: true,
      hasTouch: true,
      deviceScaleFactor: 2
    });
    await login(mobile);
    await mobile.goto(DASHBOARD_URL, { waitUntil: "networkidle2", timeout: 120000 });
    await mobile.screenshot({
      path: "tmp/adm-dashboard-executive-mobile.png",
      fullPage: true
    });
  } finally {
    await browser.close();
  }
}

capture().catch((error) => {
  console.error(error);
  process.exit(1);
});
