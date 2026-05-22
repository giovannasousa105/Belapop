/**
 * Testes da Invariante 1: Cooldown via Redis exclusivamente.
 *
 * Executar: npx jest lib/copilot/guards/__tests__/cooldownGuard.test.ts
 * Dependências: npm install --save-dev jest @types/jest ts-jest
 *
 * NUNCA usar banco de dados aqui — toda verificação é via RedisMock.
 * Se um teste precisar de Supabase/Prisma, é um teste errado.
 */

import {
  verificarCooldown,
  registrarEnvio,
  registrarRecompraRecusada,
  produtoRecusadoRecentemente,
  cdKey,
  wkKey,
  semanaAtual,
} from "../cooldownGuard";
import type { InteracaoTipo } from "../../copilotTypes";

// ─── Redis mock em memória ────────────────────────────────────────────────────
// Substitui ioredis sem servidor real. Implementa apenas as operações usadas.

class RedisMock {
  private store = new Map<string, { value: string; expireAt?: number }>();

  async set(key: string, value: string, ex?: string, ttl?: number): Promise<"OK"> {
    const expireAt = ex === "EX" && ttl ? Date.now() + ttl * 1000 : undefined;
    this.store.set(key, { value, expireAt });
    return "OK";
  }

  async get(key: string): Promise<string | null> {
    const entry = this.store.get(key);
    if (!entry) return null;
    if (entry.expireAt && entry.expireAt <= Date.now()) {
      this.store.delete(key);
      return null;
    }
    return entry.value;
  }

  async ttl(key: string): Promise<number> {
    const entry = this.store.get(key);
    if (!entry) return -2;
    if (!entry.expireAt) return -1;
    if (entry.expireAt <= Date.now()) {
      this.store.delete(key);
      return -2;
    }
    return Math.ceil((entry.expireAt - Date.now()) / 1000);
  }

  async exists(key: string): Promise<number> {
    const entry = this.store.get(key);
    if (!entry) return 0;
    if (entry.expireAt && entry.expireAt <= Date.now()) {
      this.store.delete(key);
      return 0;
    }
    return 1;
  }

  async incr(key: string): Promise<number> {
    const current = parseInt((await this.get(key)) ?? "0", 10);
    const next = current + 1;
    const existing = this.store.get(key);
    this.store.set(key, { value: String(next), expireAt: existing?.expireAt });
    return next;
  }

  pipeline() {
    const ops: Array<() => Promise<unknown>> = [];
    const pipe = {
      incr: (key: string) => { ops.push(() => this.incr(key)); return pipe; },
      expireat: (key: string, ts: number) => {
        ops.push(async () => {
          const entry = this.store.get(key);
          if (entry) this.store.set(key, { ...entry, expireAt: ts * 1000 });
        });
        return pipe;
      },
      exec: async () => {
        const results: Array<[null, unknown]> = [];
        for (const op of ops) results.push([null, await op()]);
        return results;
      },
    };
    return pipe;
  }

  // Helper de teste: forçar TTL de uma chave
  setRaw(key: string, value: string, ttlMs?: number): void {
    this.store.set(key, {
      value,
      expireAt: ttlMs ? Date.now() + ttlMs : undefined,
    });
  }

  clear(): void {
    this.store.clear();
  }
}

// ─── Testes ───────────────────────────────────────────────────────────────────

describe("cooldownGuard — Invariante Redis-only", () => {
  let redis: RedisMock;

  beforeEach(() => {
    redis = new RedisMock();
  });

  // ── verificarCooldown ──────────────────────────────────────────────────────

  it("retorna permitido: true se nenhuma chave existe", async () => {
    const result = await verificarCooldown(redis as never, "u1", "LEMBRETE_MANHA");
    expect(result.permitido).toBe(true);
    expect(result.motivo).toBeUndefined();
  });

  it("retorna permitido: false se chave de cooldown existe com TTL positivo", async () => {
    const agora = new Date();
    redis.setRaw(cdKey("u1", "LEMBRETE_MANHA"), "1", 72_000_000); // 20h
    const result = await verificarCooldown(redis as never, "u1", "LEMBRETE_MANHA", agora);
    expect(result.permitido).toBe(false);
    expect(result.motivo).toBe("COOLDOWN_TIPO");
  });

  it("retorna proxima_em baseada no TTL restante", async () => {
    const agora = new Date();
    const ttlMs = 3600 * 1000; // 1h
    redis.setRaw(cdKey("u1", "LEMBRETE_NOITE"), "1", ttlMs);
    const result = await verificarCooldown(redis as never, "u1", "LEMBRETE_NOITE", agora);

    expect(result.permitido).toBe(false);
    expect(result.proxima_em).toBeDefined();
    // proxima_em deve ser aproximadamente agora + ttlMs (tolerância 1s)
    const diff = result.proxima_em!.getTime() - agora.getTime();
    expect(diff).toBeGreaterThan(ttlMs - 2000);
    expect(diff).toBeLessThanOrEqual(ttlMs + 1000);
  });

  it("retorna permitido: false se max_por_semana atingido", async () => {
    const agora = new Date();
    const semana = semanaAtual(agora);
    // CHECKIN_SEMANAL tem max_por_semana: 1
    redis.setRaw(wkKey("u1", "CHECKIN_SEMANAL", semana), "1");
    const result = await verificarCooldown(redis as never, "u1", "CHECKIN_SEMANAL", agora);

    expect(result.permitido).toBe(false);
    expect(result.motivo).toBe("MAX_SEMANA");
    expect(result.proxima_em).toBeDefined();
  });

  it("ALERTA_REGRESSAO (prioridade 1) ignora max_por_semana", async () => {
    const agora = new Date();
    const semana = semanaAtual(agora);
    // Simular que já enviou ALERTA_REGRESSAO esta semana (max_por_semana=1)
    // MAS cooldown_horas=336 — não houve SET de cooldown
    redis.setRaw(wkKey("u1", "ALERTA_REGRESSAO", semana), "2"); // acima do max
    // Sem chave de cooldown ativa
    const result = await verificarCooldown(redis as never, "u1", "ALERTA_REGRESSAO", agora);
    // Prioridade 1 bypassa max_por_semana
    expect(result.permitido).toBe(true);
  });

  it("MARCO_ALCANCADO (prioridade 1) ignora max_por_semana", async () => {
    const agora = new Date();
    const semana = semanaAtual(agora);
    redis.setRaw(wkKey("u1", "MARCO_ALCANCADO", semana), "5");
    const result = await verificarCooldown(redis as never, "u1", "MARCO_ALCANCADO", agora);
    expect(result.permitido).toBe(true);
  });

  // ── registrarEnvio ─────────────────────────────────────────────────────────

  it("registrarEnvio cria chave de cooldown com TTL = cooldown_horas * 3600", async () => {
    const agora = new Date();
    await registrarEnvio(redis as never, "u1", "LEMBRETE_MANHA", agora);
    // LEMBRETE_MANHA tem cooldown_horas: 20 → TTL = 72000s
    const ttl = await redis.ttl(cdKey("u1", "LEMBRETE_MANHA"));
    expect(ttl).toBeGreaterThan(72000 - 5);
    expect(ttl).toBeLessThanOrEqual(72000);
  });

  it("registrarEnvio incrementa contador semanal", async () => {
    const agora = new Date();
    await registrarEnvio(redis as never, "u1", "CHECKIN_SEMANAL", agora);
    const valor = await redis.get(wkKey("u1", "CHECKIN_SEMANAL", semanaAtual(agora)));
    expect(Number(valor)).toBe(1);

    await registrarEnvio(redis as never, "u1", "CHECKIN_SEMANAL", agora);
    const valor2 = await redis.get(wkKey("u1", "CHECKIN_SEMANAL", semanaAtual(agora)));
    expect(Number(valor2)).toBe(2);
  });

  it("registrarEnvio define EXPIREAT no contador semanal", async () => {
    const agora = new Date();
    await registrarEnvio(redis as never, "u1", "LEMBRETE_NOITE", agora);
    const key = wkKey("u1", "LEMBRETE_NOITE", semanaAtual(agora));
    const ttl = await redis.ttl(key);
    // Deve expirar em no máximo 7 dias (próxima segunda)
    expect(ttl).toBeGreaterThan(0);
    expect(ttl).toBeLessThanOrEqual(7 * 24 * 3600 + 60);
  });

  it("MARCO_ALCANCADO (cooldown_horas: 0) não cria chave de cooldown", async () => {
    const agora = new Date();
    await registrarEnvio(redis as never, "u1", "MARCO_ALCANCADO", agora);
    const ttl = await redis.ttl(cdKey("u1", "MARCO_ALCANCADO"));
    // Sem cooldown_horas → chave não deve existir
    expect(ttl).toBeLessThanOrEqual(-1);
  });

  // ── recompra ───────────────────────────────────────────────────────────────

  it("registrarRecompraRecusada cria chave com TTL = 30 * 86400 s", async () => {
    await registrarRecompraRecusada(redis as never, "u1", "prod-xyz");
    const ttl = await redis.ttl(`copilot:cd:recompra:u1:prod-xyz`);
    const esperado = 30 * 86400;
    expect(ttl).toBeGreaterThan(esperado - 10);
    expect(ttl).toBeLessThanOrEqual(esperado);
  });

  it("produtoRecusadoRecentemente retorna true se chave existe", async () => {
    await registrarRecompraRecusada(redis as never, "u1", "prod-abc");
    const result = await produtoRecusadoRecentemente(redis as never, "u1", "prod-abc");
    expect(result).toBe(true);
  });

  it("produtoRecusadoRecentemente retorna false se chave não existe", async () => {
    const result = await produtoRecusadoRecentemente(redis as never, "u1", "prod-inexistente");
    expect(result).toBe(false);
  });

  // ── Invariante: nenhum SQL ─────────────────────────────────────────────────
  // Este teste documenta que o módulo não importa Supabase, Prisma ou pg.
  // Verificação complementar via CI (grep no arquivo fonte).

  it("módulo não importa Supabase, Prisma ou drivers SQL", () => {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const src = require("fs").readFileSync(
      require("path").join(__dirname, "../cooldownGuard.ts"),
      "utf-8"
    ) as string;
    expect(src).not.toMatch(/supabase|prisma|pg\b|@supabase/i);
  });
});
