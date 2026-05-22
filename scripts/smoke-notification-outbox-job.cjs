#!/usr/bin/env node

const baseUrl = (process.env.BELAPOP_BASE_URL || process.env.BASE_URL || "http://localhost:3001").replace(/\/$/, "");
const secret =
  process.env.INTERNAL_JOBS_SECRET ||
  process.env.INTERNAL_JOB_SECRET ||
  process.env.CRON_SECRET ||
  process.env.CRON_JOB_SECRET;
const limit = process.env.OUTBOX_LIMIT || "1";
const authOnly = process.env.SMOKE_AUTH_ONLY === "1";

const query = authOnly
  ? "auth_check=1"
  : `limit=${encodeURIComponent(limit)}`;
const endpoint = `${baseUrl}/api/internal/jobs/process-notification-outbox?${query}`;

async function readJson(response) {
  const text = await response.text();
  try {
    return { text, json: JSON.parse(text) };
  } catch {
    return { text, json: null };
  }
}

async function assertUnauthorized() {
  const response = await fetch(endpoint, { method: "POST" });
  const body = await readJson(response);
  if (response.status !== 401) {
    throw new Error(`Expected 401 without secret, got ${response.status}: ${body.text.slice(0, 500)}`);
  }
  console.log("OK unauthenticated request returned 401");
}

async function assertAuthorized() {
  if (!secret) {
    throw new Error(
      "Missing INTERNAL_JOBS_SECRET, INTERNAL_JOB_SECRET, CRON_SECRET or CRON_JOB_SECRET for authorized smoke."
    );
  }

  const response = await fetch(endpoint, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${secret}`,
      "Content-Type": "application/json"
    }
  });
  const body = await readJson(response);
  if (!response.ok) {
    throw new Error(`Expected 2xx with secret, got ${response.status}: ${body.text.slice(0, 800)}`);
  }
  if (!body.json || body.json.ok !== true) {
    throw new Error(`Expected JSON { ok: true }, got: ${body.text.slice(0, 800)}`);
  }
  if (typeof body.json.processed !== "number") {
    throw new Error(`Expected numeric processed field, got: ${body.text.slice(0, 800)}`);
  }
  console.log(`OK authorized request returned ${response.status}: processed=${body.json.processed}`);
}

(async () => {
  console.log(`Smoke target: ${endpoint}`);
  if (authOnly) {
    console.log("Smoke mode: auth-only, no outbox rows will be claimed.");
  }
  await assertUnauthorized();
  await assertAuthorized();
})().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
