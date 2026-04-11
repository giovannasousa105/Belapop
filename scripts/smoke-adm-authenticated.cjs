#!/usr/bin/env node
const { spawn } = require("node:child_process");
const fs = require("node:fs");
const path = require("node:path");

const dotenv = require("dotenv");

dotenv.config({ path: path.join(process.cwd(), ".env.local") });

const HOST = "127.0.0.1";
const PORT = Number(process.env.ADM_SMOKE_PORT || 3025);
const BASE_URL =
  String(process.env.ADM_SMOKE_BASE_URL || process.env.SMOKE_ADM_BASE_URL || "").trim() ||
  `http://${HOST}:${PORT}`;
const READY_TIMEOUT_MS = 120_000;
const USE_EXISTING_SERVER = process.env.ADM_SMOKE_USE_EXISTING_SERVER === "1";
const nextBin = require.resolve("next/dist/bin/next");

const email = String(process.env.ADM_SMOKE_EMAIL || "helena.master@belapop.internal").trim();
const password = String(process.env.ADM_SMOKE_PASSWORD || "BelaPopADM#2026").trim();

const ROUTES = [
  "/adm",
  "/adm/dashboard-executivo",
  "/adm/qualidade-catalogo",
  "/adm/curadoria/produtos?status=em-revisao",
  "/adm/operacao/parceiros?status=alerta",
  "/adm/operacao/pedidos-criticos?priority=critica",
  "/adm/operacao/logistica?status=alerta",
  "/adm/financeiro?priority=alta",
  "/adm/financeiro/reembolsos?status=pendente",
  "/adm/catalogo-marca/reviews?status=critico",
  "/adm/curadoria/documentos?status=pendente",
  "/adm/gestao/log-atividades?action=aprovou"
];

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

function parseSetCookies(response) {
  const raw = typeof response.headers.getSetCookie === "function"
    ? response.headers.getSetCookie()
    : (() => {
        const single = response.headers.get("set-cookie");
        return single ? [single] : [];
      })();

  return raw
    .map((value) => String(value).split(";")[0]?.trim())
    .filter(Boolean)
    .join("; ");
}

async function waitForServer() {
  const startedAt = Date.now();
  let lastError = "server_not_started";

  while (Date.now() - startedAt < READY_TIMEOUT_MS) {
    try {
      const response = await fetch(`${BASE_URL}/adm/login`, { redirect: "manual" });
      if (response.status < 500) return;
      lastError = `http_${response.status}`;
    } catch (error) {
      lastError = error instanceof Error ? error.message : String(error);
    }

    await sleep(1500);
  }

  throw new Error(`Servidor nao ficou pronto em ${READY_TIMEOUT_MS}ms (${lastError}).`);
}

async function loginAdm() {
  const response = await fetch(`${BASE_URL}/api/adm/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password, next: "/adm" })
  });

  const body = await response.json().catch(() => null);
  if (!response.ok || !body?.ok) {
    throw new Error(`Falha no login do ADM: ${response.status} ${JSON.stringify(body)}`);
  }

  const cookie = parseSetCookies(response);
  if (!cookie) {
    throw new Error("Nao foi possivel obter cookie da sessao do ADM.");
  }

  return {
    cookie,
    redirectTo: body.redirectTo
  };
}

async function assertAdmPage(pathname, cookie) {
  const response = await fetch(`${BASE_URL}${pathname}`, {
    method: "GET",
    headers: { Cookie: cookie },
    redirect: "follow"
  });
  const html = await response.text();

  if (response.status !== 200) {
    throw new Error(`Pagina ${pathname} respondeu ${response.status}.`);
  }

  if (!html.includes("<html")) {
    throw new Error(`Pagina ${pathname} nao retornou HTML valido.`);
  }

  if (response.url.includes("/adm/login")) {
    throw new Error(`Pagina ${pathname} redirecionou para o login mesmo apos autenticacao.`);
  }

  return {
    pathname,
    finalUrl: response.url,
    bytes: Buffer.byteLength(html, "utf8")
  };
}

async function run() {
  if (!USE_EXISTING_SERVER && !fs.existsSync(path.join(process.cwd(), ".next", "BUILD_ID"))) {
    throw new Error("Build de producao ausente. Rode `npm run build` antes do smoke.");
  }

  const server = USE_EXISTING_SERVER
    ? null
    : spawn(process.execPath, [nextBin, "start", "-p", String(PORT), "-H", HOST], {
        cwd: process.cwd(),
        env: {
          ...process.env,
          ADM_DATA_SOURCE_MODE: process.env.ADM_DATA_SOURCE_MODE || "supabase",
          NEXT_PUBLIC_SITE_URL: BASE_URL,
          APP_URL: BASE_URL
        },
        stdio: ["ignore", "pipe", "pipe"]
      });

  let stdoutTail = "";
  let stderrTail = "";

  if (server) {
    server.stdout.on("data", (chunk) => {
      stdoutTail = `${stdoutTail}${chunk.toString()}`.slice(-6000);
    });
    server.stderr.on("data", (chunk) => {
      stderrTail = `${stderrTail}${chunk.toString()}`.slice(-6000);
    });
  }

  const stopServer = async () => {
    if (!server) return;
    if (server.killed || server.exitCode !== null) return;
    server.kill("SIGTERM");
    await sleep(1500);
    if (server.exitCode === null) server.kill("SIGKILL");
  };

  try {
    await waitForServer();
    const session = await loginAdm();
    const checks = [];

    for (const route of ROUTES) {
      checks.push(await assertAdmPage(route, session.cookie));
    }

    console.log("== Smoke ADM autenticado concluido ==");
    console.log(
      JSON.stringify(
        {
          baseUrl: BASE_URL,
          redirectTo: session.redirectTo,
          routesChecked: checks.length,
          checks
        },
        null,
        2
      )
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error("[FAIL] Smoke ADM autenticado:", message);
    if (stdoutTail) console.error("\n--- next stdout tail ---\n" + stdoutTail);
    if (stderrTail) console.error("\n--- next stderr tail ---\n" + stderrTail);
    process.exitCode = 1;
  } finally {
    await stopServer();
  }
}

run().catch((error) => {
  console.error("[FAIL] Smoke ADM autenticado:", error instanceof Error ? error.message : String(error));
  process.exit(1);
});
