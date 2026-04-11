import { execFileSync } from "node:child_process";
import { writeFile } from "node:fs/promises";
import path from "node:path";

const DEFAULTS = {
  historyPrefix: "42-INTERNAL-JOBS-NIGHTLY-CRON-SMOKE",
  owner: "giovannasousa105",
  // eslint-disable-next-line bela-pop/prefer-bela-pop -- GitHub repo slug is case-sensitive.
  repo: "Belapop",
  workflow: "internal-jobs-cron.yml",
  event: "schedule",
  job: "refresh_risk_recon_t1",
  timezone: "America/Sao_Paulo",
  maxPages: 5,
  perPage: 100,
  docPath: path.join(
    process.cwd(),
    "docs",
    "codex-belapop-portal",
    "43-INTERNAL-JOBS-NIGHTLY-CRON-SMOKE-PENDING.md"
  )
};

const parseArgs = () => {
  const options = { ...DEFAULTS, write: true };
  const args = process.argv.slice(2);

  for (let index = 0; index < args.length; index += 1) {
    const arg = args[index];
    if (arg === "--dry-run") {
      options.write = false;
      continue;
    }
    if (!arg.startsWith("--")) continue;
    const key = arg.slice(2);
    const value = args[index + 1];
    if (!value || value.startsWith("--")) {
      throw new Error(`Parametro ausente para ${arg}.`);
    }
    options[key] = value;
    index += 1;
  }

  options.maxPages = Number(options.maxPages);
  options.perPage = Number(options.perPage);
  return options;
};

const resolveToken = (username) => {
  const envToken =
    process.env.GITHUB_TOKEN ??
    process.env.GH_TOKEN ??
    process.env.GITHUB_PAT ??
    process.env.GH_PAT ??
    "";

  if (String(envToken).trim()) {
    return String(envToken).trim();
  }

  const input = `protocol=https\nhost=github.com\nusername=${username}\n\n`;
  const output = execFileSync("git", ["credential", "fill"], {
    input,
    encoding: "utf8"
  });

  for (const line of output.split(/\r?\n/)) {
    if (line.startsWith("password=")) {
      return line.slice("password=".length).trim();
    }
  }

  throw new Error("Token GitHub nao encontrado em env nem no Git Credential Manager.");
};

const githubRequest = async (token, pathname) => {
  const response = await fetch(`https://api.github.com${pathname}`, {
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: "application/vnd.github+json",
      "X-GitHub-Api-Version": "2022-11-28"
    }
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`GitHub API ${response.status} em ${pathname}: ${body}`);
  }

  return response.json();
};

const formatUtc = (value) => {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "n/a" : date.toISOString().replace(".000Z", "Z");
};

const formatDateInZone = (value, timeZone) => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "unknown-date";

  const formatter = new Intl.DateTimeFormat("sv-SE", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit"
  });

  return formatter.format(date);
};

const formatLocal = (value, timeZone) => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "n/a";

  const formatter = new Intl.DateTimeFormat("sv-SE", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false
  });

  return `${formatter.format(date).replace(" ", "T")} (${timeZone})`;
};

const toMarkdown = ({ run, jobs, options, generatedAt }) => {
  const targetJob = jobs.find((job) => job.name === options.job) ?? null;
  const success = run.conclusion === "success" && targetJob?.conclusion === "success";
  const successfulJobs = jobs.filter((job) => job.conclusion === "success").length;
  const skippedJobs = jobs.filter((job) => job.conclusion === "skipped").length;
  const failedJobs = jobs.filter(
    (job) => job.conclusion && job.conclusion !== "success" && job.conclusion !== "skipped"
  ).length;

  const lines = [
    "# Internal Jobs Cron - Nightly Scheduled Smoke Evidence",
    "",
    "## Status",
    `- Estado atual: \`${success ? "completed" : "attention"}\``,
    `- Documento gerado automaticamente em UTC: \`${generatedAt}\``,
    `- Fonte: ultima run \`event=${options.event}\` do workflow \`${options.workflow}\` contendo o job \`${options.job}\`.`,
    "",
    "## Scheduled run selected",
    `- Repo: \`${options.owner}/${options.repo}\``,
    `- Workflow: \`${options.workflow}\``,
    `- Trigger: \`${run.event}\``,
    `- Branch/Ref: \`${run.head_branch ?? "n/a"}\``,
    `- Run ID: \`${run.id}\``,
    `- Run number: \`${run.run_number}\``,
    `- URL: \`${run.html_url}\``,
    `- Created at UTC: \`${formatUtc(run.created_at)}\``,
    `- Updated at UTC: \`${formatUtc(run.updated_at)}\``,
    `- Equivalent in ${options.timezone}: \`${formatLocal(run.created_at, options.timezone)}\` to \`${formatLocal(run.updated_at, options.timezone)}\``,
    `- Status final: \`${run.status}\``,
    `- Conclusion final: \`${run.conclusion}\``,
    "",
    "## Job summary",
    `- Total jobs observados: \`${jobs.length}\``,
    `- Jobs com \`success\`: \`${successfulJobs}\``,
    `- Jobs com \`skipped\`: \`${skippedJobs}\``,
    `- Jobs com falha/conclusao nao-success: \`${failedJobs}\``,
    targetJob
      ? `- Job alvo \`${options.job}\`: \`${targetJob.conclusion}\``
      : `- Job alvo \`${options.job}\`: \`not-found\``,
    ""
  ];

  lines.push("## Jobs executed in the selected run");
  for (const job of jobs) {
    lines.push(
      `- \`${job.name}\`: \`${job.conclusion ?? job.status ?? "unknown"}\` (${formatUtc(job.started_at)} -> ${formatUtc(job.completed_at)})`
    );
  }

  lines.push("", "## Notes");
  lines.push(
    "- Este fechamento automatico usa apenas a API do GitHub Actions para escolher a ultima run agendada relevante."
  );
  lines.push(
    "- Payloads internos dos endpoints nao sao expostos pela API de runs; para highlights de resposta, use logs/artifacts ou uma chamada autenticada ao endpoint."
  );
  lines.push(
    success
      ? "- Resultado operacional: a ultima execucao noturna relevante do cron consolidado concluiu com sucesso."
      : "- Resultado operacional: a ultima execucao noturna relevante do cron consolidado requer atencao."
  );

  return `${lines.join("\n")}\n`;
};

const toPendingLookupMarkdown = ({ options, generatedAt }) => {
  const lines = [
    "# Internal Jobs Cron - Nightly Scheduled Smoke Evidence (Pending)",
    "",
    "## Status",
    "- Estado atual: `pending`",
    `- Documento atualizado automaticamente em UTC: \`${generatedAt}\``,
    "- Este arquivo e o working record da proxima madrugada.",
    `- Fonte consultada: runs \`event=${options.event}\` do workflow \`${options.workflow}\` procurando o job \`${options.job}\`.`,
    "",
    "## Outcome of the latest lookup",
    `- Repo: \`${options.owner}/${options.repo}\``,
    `- Resultado: nenhuma run compativel foi encontrada nas ultimas \`${options.maxPages}\` paginas consultadas.`,
    "- Interpretacao operacional:",
    "  - o cron noturno relevante ainda nao executou com esta versao do workflow;",
    "  - ou a janela consultada ainda nao alcancou a run correta.",
    "",
    "## Next action",
    "- Aguarde a proxima execucao real do cron noturno e rode novamente:",
    "```bash",
    "npm run docs:close:nightly-smoke",
    "```",
    "",
    "## Template source",
    "- Template preservado separadamente em:",
    "  - `44-INTERNAL-JOBS-NIGHTLY-CRON-SMOKE-TEMPLATE.md`",
    "",
    "## Note",
    "- Este documento permanece pendente ate existir uma run `event=schedule` contendo `refresh_risk_recon_t1`."
  ];

  return `${lines.join("\n")}\n`;
};

const toFreshWorkingMarkdown = () => {
  const lines = [
    "# Internal Jobs Cron - Nightly Scheduled Smoke Evidence (Pending)",
    "",
    "## Status",
    "- Estado atual: `pending`",
    "- Este arquivo e o working record da proxima madrugada.",
    "- O script `npm run docs:close:nightly-smoke` escreve neste caminho por padrao.",
    "",
    "## Purpose",
    "- Registrar automaticamente a proxima run real `event=schedule` do workflow `Internal Jobs Cron`",
    "- Fechar a evidencia operacional do job `refresh_risk_recon_t1`",
    "- Evitar sobrescrever a evidencia historica ja fechada",
    "",
    "## Command",
    "```bash",
    "npm run docs:close:nightly-smoke",
    "```",
    "",
    "## Historical evidence",
    "- Evidencia fechada atual:",
    "  - `42-INTERNAL-JOBS-NIGHTLY-CRON-SMOKE-2026-03-09.md`",
    "",
    "## Template source",
    "- Template preservado separadamente em:",
    "  - `44-INTERNAL-JOBS-NIGHTLY-CRON-SMOKE-TEMPLATE.md`"
  ];

  return `${lines.join("\n")}\n`;
};

const buildHistoryDocPath = (run, options) => {
  const runDate = formatDateInZone(run.created_at, options.timezone);
  return path.join(
    process.cwd(),
    "docs",
    "codex-belapop-portal",
    `${options.historyPrefix}-${runDate}.md`
  );
};

const findLatestNightlyRun = async (token, options) => {
  for (let page = 1; page <= options.maxPages; page += 1) {
    const runsPayload = await githubRequest(
      token,
      `/repos/${options.owner}/${options.repo}/actions/workflows/${options.workflow}/runs?event=${options.event}&per_page=${options.perPage}&page=${page}`
    );

    const runs = runsPayload.workflow_runs ?? [];
    if (runs.length === 0) break;

    for (const run of runs) {
      const jobsPayload = await githubRequest(
        token,
        `/repos/${options.owner}/${options.repo}/actions/runs/${run.id}/jobs?per_page=100`
      );

      const jobs = jobsPayload.jobs ?? [];
      const targetJob = jobs.find((job) => job.name === options.job);
      if (
        targetJob &&
        targetJob.conclusion !== "skipped" &&
        !(targetJob.status === "completed" && !targetJob.conclusion)
      ) {
        return { run, jobs };
      }
    }
  }

  return null;
};

const main = async () => {
  const options = parseArgs();
  const token = resolveToken(options.owner);
  const match = await findLatestNightlyRun(token, options);
  const generatedAt = new Date().toISOString().replace(".000Z", "Z");

  if (!match) {
    const pendingMarkdown = toPendingLookupMarkdown({ options, generatedAt });
    if (options.write) {
      await writeFile(options.docPath, pendingMarkdown, "utf8");
      console.log(
        `Nenhuma run compativel encontrada. Documento pendente mantido em ${options.docPath}`
      );
    } else {
      console.log(pendingMarkdown);
    }
    return;
  }

  const markdown = toMarkdown({ ...match, options, generatedAt });

  if (options.write) {
    const isScheduledSuccess =
      options.event === "schedule" &&
      match.run.event === "schedule" &&
      match.jobs.some((job) => job.name === options.job && job.conclusion === "success");

    if (isScheduledSuccess) {
      const historyDocPath = buildHistoryDocPath(match.run, options);
      const pendingMarkdown = toFreshWorkingMarkdown();
      await writeFile(historyDocPath, markdown, "utf8");
      await writeFile(options.docPath, pendingMarkdown, "utf8");
      console.log(`Evidencia historica atualizada em ${historyDocPath}`);
      console.log(`Working file resetado em ${options.docPath}`);
      return;
    }

    await writeFile(options.docPath, markdown, "utf8");
    console.log(`Documento atualizado em ${options.docPath}`);
  } else {
    console.log(markdown);
  }
};

main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
});
