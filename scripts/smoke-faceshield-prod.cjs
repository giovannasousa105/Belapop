#!/usr/bin/env node
const { randomUUID } = require("node:crypto");
const path = require("node:path");

const dotenv = require("dotenv");
const { createClient } = require("@supabase/supabase-js");

dotenv.config({ path: path.join(process.cwd(), ".env.local") });

const BASE_URL = String(process.env.SMOKE_FACESHIELD_BASE_URL || "https://belapopoficial.com.br").trim();
const FACE_IMAGE_URL = String(
  process.env.SMOKE_FACESHIELD_IMAGE_URL || "https://raw.githubusercontent.com/opencv/opencv/master/samples/data/lena.jpg"
).trim();
const KEEP_RECORDS = process.argv.includes("--keep");

const supabaseUrl = String(process.env.NEXT_PUBLIC_SUPABASE_URL || "").trim();
const supabaseAnonKey = String(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "").trim();
const serviceRoleKey = String(process.env.SUPABASE_SERVICE_ROLE_KEY || "").trim();

if (!supabaseUrl || !supabaseAnonKey || !serviceRoleKey) {
  throw new Error(
    "NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY e SUPABASE_SERVICE_ROLE_KEY sao obrigatorios."
  );
}

const admin = createClient(supabaseUrl, serviceRoleKey, {
  auth: { persistSession: false, autoRefreshToken: false }
});

const browser = createClient(supabaseUrl, supabaseAnonKey, {
  auth: { persistSession: false, autoRefreshToken: false }
});

async function ensureJson(response) {
  const text = await response.text();
  return text ? JSON.parse(text) : null;
}

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

async function createTempUser(label) {
  const email = `${label}-${Date.now()}@belapop-smoke.local`;
  const password = `Bp!${randomUUID()}Aa1`;

  const created = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { full_name: `Smoke ${label}` }
  });

  if (created.error || !created.data.user) {
    throw new Error(`Falha ao criar usuario temporario (${label}): ${created.error?.message ?? "desconhecido"}`);
  }

  return {
    userId: created.data.user.id,
    email,
    password
  };
}

async function upsertProfile(userId, email) {
  const result = await admin.from("profiles").upsert({
    id: userId,
    email,
    role: "customer",
    full_name: "Smoke FaceShield"
  });

  if (result.error) {
    throw new Error(`Falha ao criar profile customer: ${result.error.message}`);
  }
}

async function grantCustomerRole(userId) {
  const membershipsUpsert = await admin
    .from("user_role_memberships")
    .upsert([{ user_id: userId, role: "customer", source: "smoke-faceshield-prod" }], {
      onConflict: "user_id,role"
    });

  if (membershipsUpsert.error && membershipsUpsert.error.code !== "42P01") {
    throw new Error(`Falha ao gravar memberships: ${membershipsUpsert.error.message}`);
  }

  const activeUpsert = await admin
    .from("user_roles")
    .upsert({ user_id: userId, role: "customer" }, { onConflict: "user_id" });

  if (activeUpsert.error) {
    throw new Error(`Falha ao gravar active role: ${activeUpsert.error.message}`);
  }

  const userLookup = await admin.auth.admin.getUserById(userId);
  if (userLookup.error || !userLookup.data.user) {
    throw new Error(`Falha ao reler usuario ${userId} para app_metadata.`);
  }

  const metadataUpdate = await admin.auth.admin.updateUserById(userId, {
    app_metadata: {
      ...(userLookup.data.user.app_metadata || {}),
      role: "customer"
    }
  });

  if (metadataUpdate.error) {
    throw new Error(`Falha ao atualizar app_metadata: ${metadataUpdate.error.message}`);
  }
}

async function signInAndSyncSession(credentials) {
  const signedIn = await browser.auth.signInWithPassword({
    email: credentials.email,
    password: credentials.password
  });

  if (signedIn.error || !signedIn.data.session) {
    throw new Error(`Falha no sign in temporario: ${signedIn.error?.message ?? "sem sessao"}`);
  }

  const syncResponse = await fetch(`${BASE_URL}/api/auth/sync-session`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      accessToken: signedIn.data.session.access_token,
      refreshToken: signedIn.data.session.refresh_token
    })
  });

  const syncJson = await ensureJson(syncResponse);
  if (!syncResponse.ok) {
    throw new Error(`Falha ao sincronizar sessao: ${JSON.stringify(syncJson)}`);
  }

  const cookie = parseSetCookies(syncResponse);
  if (!cookie) {
    throw new Error("Nao foi possivel obter cookies da sessao sincronizada.");
  }

  return { cookie };
}

async function fetchWithSession(pathname, options, cookie) {
  return fetch(`${BASE_URL}${pathname}`, {
    ...options,
    headers: {
      ...(options?.headers || {}),
      Cookie: cookie
    }
  });
}

function parseStoragePath(url, bucket) {
  if (!url) return null;
  try {
    const parsed = new URL(url);
    const marker = `/storage/v1/object/public/${bucket}/`;
    const index = parsed.pathname.indexOf(marker);
    if (index === -1) return null;
    return decodeURIComponent(parsed.pathname.slice(index + marker.length));
  } catch {
    return null;
  }
}

async function downloadFaceBuffer() {
  const response = await fetch(FACE_IMAGE_URL);
  if (!response.ok) {
    throw new Error(`Falha ao baixar imagem base do smoke: ${response.status} ${FACE_IMAGE_URL}`);
  }

  return Buffer.from(await response.arrayBuffer());
}

async function assertUrlOk(url) {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Asset inacessivel: ${url} (${response.status})`);
  }
}

async function cleanupArtifacts(state) {
  const storagePaths = Array.from(state.storagePaths);

  if (!KEEP_RECORDS && storagePaths.length > 0) {
    try {
      await admin.storage.from("skin-scans").remove(storagePaths);
    } catch {}
  }

  if (state.faceScanId) {
    try {
      await admin.from("face_scan_findings").delete().eq("scan_id", state.faceScanId);
    } catch {}
    try {
      await admin.from("skin_heatmap_regions").delete().eq("scan_id", state.faceScanId);
    } catch {}
    try {
      await admin.from("skin_scores").delete().eq("scan_id", state.faceScanId);
    } catch {}
    try {
      await admin.from("liveness_results").delete().eq("scan_id", state.faceScanId);
    } catch {}
  }

  if (state.userId) {
    try {
      await admin.from("skin_progress").delete().eq("user_id", state.userId);
    } catch {}
    try {
      await admin.from("skin_images").delete().eq("user_id", state.userId);
    } catch {}
    try {
      await admin.from("face_scans").delete().eq("user_id", state.userId);
    } catch {}
    try {
      await admin.from("skin_embeddings").delete().eq("user_id", state.userId);
    } catch {}
    try {
      await admin.from("routine_simulations").delete().eq("user_id", state.userId);
    } catch {}
    try {
      await admin.from("routine_carts").delete().eq("user_id", state.userId);
    } catch {}
    try {
      await admin.from("skincare_usage").delete().eq("user_id", state.userId);
    } catch {}
    try {
      await admin.from("skin_outcomes").delete().eq("user_id", state.userId);
    } catch {}
    try {
      await admin.from("treatment_outcomes").delete().eq("user_id", state.userId);
    } catch {}
  }

  if (Array.isArray(state.skinTwinIds) && state.skinTwinIds.length > 0) {
    try {
      await admin.from("skin_twin_snapshots").delete().in("skin_twin_id", state.skinTwinIds);
    } catch {}
  }

  if (state.userId) {
    try {
      await admin.from("skin_scans").delete().eq("user_id", state.userId);
    } catch {}
    try {
      await admin.from("skin_twins").delete().eq("user_id", state.userId);
    } catch {}
    try {
      await admin.from("user_skin_profiles").delete().eq("user_id", state.userId);
    } catch {}
    try {
      await admin.from("user_roles").delete().eq("user_id", state.userId);
    } catch {}
    try {
      await admin.from("user_role_memberships").delete().eq("user_id", state.userId);
    } catch {}
    try {
      await admin.from("profiles").delete().eq("id", state.userId);
    } catch {}
    try {
      await admin.auth.admin.deleteUser(state.userId);
    } catch {}
  }
}

async function run() {
  const state = {
    userId: null,
    faceScanId: null,
    skinTwinIds: [],
    storagePaths: new Set()
  };

  try {
    const tempUser = await createTempUser("faceshield-prod");
    state.userId = tempUser.userId;

    await upsertProfile(tempUser.userId, tempUser.email);
    await grantCustomerRole(tempUser.userId);

    const { cookie } = await signInAndSyncSession(tempUser);

    const pageResponse = await fetchWithSession("/conta/skincare", { method: "GET", redirect: "manual" }, cookie);
    if (pageResponse.status !== 200) {
      throw new Error(`/conta/skincare respondeu ${pageResponse.status} no smoke autenticado.`);
    }

    const frameBuffer = await downloadFaceBuffer();
    const form = new FormData();
    form.set("capture_mode", "guided_camera");
    form.set("neutral_frame", new File([frameBuffer], "neutral.jpg", { type: "image/jpeg" }));
    form.set("blink_frame", new File([frameBuffer], "blink.jpg", { type: "image/jpeg" }));
    form.set("smile_frame", new File([frameBuffer], "smile.jpg", { type: "image/jpeg" }));
    form.set("frown_frame", new File([frameBuffer], "frown.jpg", { type: "image/jpeg" }));
    form.set("turn_frame", new File([frameBuffer], "turn.jpg", { type: "image/jpeg" }));

    const analyzeResponse = await fetchWithSession(
      "/api/v1/faceshield/analyze",
      { method: "POST", body: form },
      cookie
    );
    const analyzeJson = await ensureJson(analyzeResponse);

    if (!analyzeResponse.ok) {
      throw new Error(`Falha no analyze: ${analyzeResponse.status} ${JSON.stringify(analyzeJson)}`);
    }

    const faceScan = analyzeJson?.face_scan;
    if (!faceScan?.id) {
      throw new Error(`Resposta do FaceShield sem face_scan.id: ${JSON.stringify(analyzeJson)}`);
    }

    state.faceScanId = faceScan.id;

    const faceScanQuery = await admin
      .from("face_scans")
      .select("id,user_id,skin_scan_id,image_url,scan_status,capture_metadata,created_at")
      .eq("id", faceScan.id)
      .single();

    if (faceScanQuery.error || !faceScanQuery.data) {
      throw new Error(`Nao encontrou face_scan persistido: ${faceScanQuery.error?.message ?? "sem linha"}`);
    }

    const skinImagesQuery = await admin
      .from("skin_images")
      .select("image_kind,image_url,heatmap_url")
      .eq("face_scan_id", faceScan.id)
      .order("image_kind", { ascending: true });

    if (skinImagesQuery.error) {
      throw new Error(`Falha ao carregar skin_images: ${skinImagesQuery.error.message}`);
    }

    const skinImages = skinImagesQuery.data ?? [];
    const kinds = new Set(skinImages.map((item) => item.image_kind));
    const requiredKinds = ["neutral", "blink", "smile", "frown", "turn", "heatmap"];
    for (const kind of requiredKinds) {
      if (!kinds.has(kind)) {
        throw new Error(`Asset ${kind} nao foi persistido em skin_images.`);
      }
    }

    for (const image of skinImages) {
      const mainPath = parseStoragePath(image.image_url, "skin-scans");
      const heatmapPath = parseStoragePath(image.heatmap_url, "skin-scans");
      if (mainPath) state.storagePaths.add(mainPath);
      if (heatmapPath) state.storagePaths.add(heatmapPath);
    }

    const heatmapUrl = faceScan.heatmap_url || skinImages.find((item) => item.image_kind === "heatmap")?.image_url;
    const neutralUrl = faceScan.image_url || skinImages.find((item) => item.image_kind === "neutral")?.image_url;

    if (!neutralUrl || !heatmapUrl) {
      throw new Error("Nao foi possivel resolver image_url/heatmap_url do FaceShield.");
    }

    await assertUrlOk(neutralUrl);
    await assertUrlOk(heatmapUrl);

    const skinTwinQuery = await admin.from("skin_twins").select("id").eq("user_id", state.userId);
    if (!skinTwinQuery.error && Array.isArray(skinTwinQuery.data)) {
      state.skinTwinIds = skinTwinQuery.data.map((item) => item.id);
    }

    console.log("== Smoke FaceShield em producao concluido ==");
    console.log(
      JSON.stringify(
        {
          baseUrl: BASE_URL,
          faceImageUrl: FACE_IMAGE_URL,
          faceScanId: faceScan.id,
          scanStatus: faceScan.scan_status ?? faceScanQuery.data.scan_status,
          ok: Boolean(analyzeJson?.ok),
          imageUrl: neutralUrl,
          heatmapUrl,
          persistedImageKinds: requiredKinds.filter((kind) => kinds.has(kind)),
          findingsCount: Array.isArray(faceScan.findings) ? faceScan.findings.length : 0,
          frameAssetCount: faceScan.frame_assets ? Object.keys(faceScan.frame_assets).length : 0,
          imageUrlReachable: true,
          heatmapUrlReachable: true
        },
        null,
        2
      )
    );
  } finally {
    if (!KEEP_RECORDS) {
      await cleanupArtifacts(state);
    }
  }
}

run().catch((error) => {
  console.error("== Smoke FaceShield em producao falhou ==");
  console.error(error instanceof Error ? error.stack || error.message : error);
  process.exitCode = 1;
});
