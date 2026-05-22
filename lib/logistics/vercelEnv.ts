import "server-only";

import { readFile, writeFile } from "fs/promises";
import path from "path";

type ManagedEnvTarget = "production" | "preview" | "development";

type ManagedEnvWriteResult = {
  ok: boolean;
  appliedTo: "vercel" | "local";
  message?: string;
};

type VercelProjectInfo = {
  projectId: string;
  orgId?: string;
};

async function readLinkedVercelProject(): Promise<VercelProjectInfo | null> {
  try {
    const file = path.join(process.cwd(), ".vercel", "project.json");
    const raw = await readFile(file, "utf8");
    const parsed = JSON.parse(raw) as { projectId?: string; orgId?: string };
    if (!parsed.projectId) return null;
    return {
      projectId: parsed.projectId,
      orgId: parsed.orgId
    };
  } catch {
    return null;
  }
}

function escapeEnvValue(value: string) {
  return JSON.stringify(value);
}

async function upsertLocalEnvVariable(
  key: string,
  value: string
): Promise<ManagedEnvWriteResult> {
  const envPath = path.join(process.cwd(), ".env.local");
  const nextLine = `${key}=${escapeEnvValue(value)}`;

  let current = "";
  try {
    current = await readFile(envPath, "utf8");
  } catch {
    current = "";
  }

  const lines = current ? current.split(/\r?\n/) : [];
  let updated = false;
  const nextLines = lines.map((line) => {
    if (!line.startsWith(`${key}=`)) return line;
    updated = true;
    return nextLine;
  });

  if (!updated) {
    nextLines.push(nextLine);
  }

  await writeFile(envPath, `${nextLines.filter(Boolean).join("\n")}\n`, "utf8");

  return {
    ok: true,
    appliedTo: "local" as const
  };
}

async function upsertVercelEnvVariable(
  key: string,
  value: string,
  targets: ManagedEnvTarget[]
): Promise<ManagedEnvWriteResult> {
  const vercelToken = String(process.env.VERCEL_TOKEN ?? "").trim();
  if (!vercelToken) {
    return {
      ok: false,
      appliedTo: "vercel",
      message:
        "VERCEL_TOKEN ausente. Não foi possivel salvar a credencial do Manda Bem no ambiente da Vercel."
    };
  }

  const project = await readLinkedVercelProject();
  if (!project?.projectId) {
    return {
      ok: false,
      appliedTo: "vercel",
      message: "Projeto Vercel não vinculado em .vercel/project.json."
    };
  }

  const teamQuery = project.orgId ? `&teamId=${encodeURIComponent(project.orgId)}` : "";
  const response = await fetch(
    `https://api.vercel.com/v10/projects/${project.projectId}/env?upsert=true${teamQuery}`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${vercelToken}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        key,
        value,
        type: "sensitive",
        target: targets
      }),
      cache: "no-store"
    }
  );

  if (!response.ok) {
    const text = await response.text();
    return {
      ok: false,
      appliedTo: "vercel",
      message: `Falha ao atualizar ambiente da Vercel (${response.status}): ${text}`
    };
  }

  return {
    ok: true,
    appliedTo: "vercel"
  };
}

export async function upsertManagedEnvVariable(
  key: string,
  value: string,
  targets: ManagedEnvTarget[] = ["production", "preview", "development"]
) {
  if (process.env.VERCEL === "1") {
    return upsertVercelEnvVariable(key, value, targets);
  }

  const vercelResult = await upsertVercelEnvVariable(key, value, targets);
  if (vercelResult.ok) return vercelResult;

  if (process.env.NODE_ENV !== "production") {
    return upsertLocalEnvVariable(key, value);
  }

  return vercelResult;
}
