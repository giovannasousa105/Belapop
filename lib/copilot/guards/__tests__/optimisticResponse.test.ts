/**
 * Testes da Invariante 3: Optimistic UI com fire-and-forget.
 *
 * Executar: npx jest lib/copilot/guards/__tests__/optimisticResponse.test.ts
 * Dependências:
 *   npm install --save-dev jest @types/jest ts-jest \
 *     @testing-library/react @testing-library/jest-dom \
 *     jest-environment-jsdom
 *
 * @jest-environment jsdom
 */

import { renderHook, act } from "@testing-library/react";
import { useOptimisticResposta, type RespostaPayload } from "../optimisticResponse";

// Drena todas as microtasks pendentes (promises resolvidas)
const flushPromises = () => act(async () => { await Promise.resolve(); });

// ─── Mock de fetch ────────────────────────────────────────────────────────────

const PAYLOAD: RespostaPayload = {
  interacao_id: "interacao-123",
  tipo_resposta: "CHECKIN_ROTINA",
  valor: { fez_rotina: true, periodo: "manha" },
};

function mockFetch(status: number, body?: Record<string, unknown>) {
  global.fetch = jest.fn().mockResolvedValueOnce({
    ok: status >= 200 && status < 300,
    status,
    json: () => Promise.resolve(body ?? {}),
  } as Response);
}

function mockFetchNetwork() {
  global.fetch = jest.fn().mockRejectedValueOnce(new Error("Network error"));
}

function mockFetchSlow(status: number, delayMs: number) {
  global.fetch = jest.fn().mockImplementation(
    () =>
      new Promise((resolve) =>
        setTimeout(
          () =>
            resolve({
              ok: status >= 200 && status < 300,
              status,
              json: () => Promise.resolve({}),
            } as Response),
          delayMs
        )
      )
  );
}

// ─── Testes ───────────────────────────────────────────────────────────────────

describe("useOptimisticResposta — Invariante optimistic UI", () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
    jest.restoreAllMocks();
  });

  // ── Comportamento síncrono ─────────────────────────────────────────────────

  it("responder() atualiza respondida: true ANTES do fetch completar", async () => {
    mockFetchSlow(200, 500); // fetch demora 500ms
    const { result } = renderHook(() => useOptimisticResposta());

    // Medir tempo entre responder() e setState
    const antes = performance.now();
    act(() => {
      result.current.responder(PAYLOAD);
    });
    const depois = performance.now();

    // Estado deve ser true imediatamente (< 16ms = 1 frame)
    expect(result.current.respondida).toBe(true);
    expect(depois - antes).toBeLessThan(16);
  });

  it("responder() é função síncrona — retorno é void (não Promise)", () => {
    mockFetch(200);
    const { result } = renderHook(() => useOptimisticResposta());

    let retorno: unknown;
    act(() => {
      retorno = result.current.responder(PAYLOAD);
    });

    // void = undefined, não Promise
    expect(retorno).toBeUndefined();
    expect(retorno).not.toBeInstanceOf(Promise);
  });

  it("setRespondida chamado em < 16ms após responder() (próximo frame)", async () => {
    mockFetch(200);
    const { result } = renderHook(() => useOptimisticResposta());

    const t0 = performance.now();
    act(() => {
      result.current.responder(PAYLOAD);
    });
    const elapsed = performance.now() - t0;

    expect(result.current.respondida).toBe(true);
    expect(elapsed).toBeLessThan(16);
  });

  it("enviando: true imediatamente após responder()", () => {
    mockFetchSlow(200, 1000);
    const { result } = renderHook(() => useOptimisticResposta());

    act(() => {
      result.current.responder(PAYLOAD);
    });

    expect(result.current.enviando).toBe(true);
  });

  // ── Sucesso (200) ──────────────────────────────────────────────────────────

  it("fetch chamado com payload correto", async () => {
    mockFetch(200);
    const { result } = renderHook(() => useOptimisticResposta());

    await act(async () => {
      result.current.responder(PAYLOAD);
    });

    expect(global.fetch).toHaveBeenCalledWith(
      "/api/copilot/resposta",
      expect.objectContaining({
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(PAYLOAD),
      })
    );
  });

  it("onSucesso chamado quando fetch retorna 200", async () => {
    mockFetch(200);
    const onSucesso = jest.fn();
    const { result } = renderHook(() => useOptimisticResposta(onSucesso));

    await act(async () => {
      result.current.responder(PAYLOAD);
    });

    expect(onSucesso).toHaveBeenCalledTimes(1);
    expect(result.current.enviando).toBe(false);
  });

  // ── Retry em 5xx ──────────────────────────────────────────────────────────

  it("retry automático quando fetch retorna 500 (até 3 tentativas)", async () => {
    global.fetch = jest
      .fn()
      .mockResolvedValueOnce({ ok: false, status: 500, json: () => Promise.resolve({}) } as Response)
      .mockResolvedValueOnce({ ok: false, status: 500, json: () => Promise.resolve({}) } as Response)
      .mockResolvedValueOnce({ ok: true,  status: 200, json: () => Promise.resolve({}) } as Response);

    const onSucesso = jest.fn();
    const { result } = renderHook(() => useOptimisticResposta(onSucesso));

    // 1ª tentativa (imediata)
    await act(async () => { result.current.responder(PAYLOAD); });
    await flushPromises();

    // 2ª: backoff = INTERVALO_BASE_MS * tentativa1 = 5000ms
    await act(async () => { jest.advanceTimersByTime(5000); });
    await flushPromises();

    // 3ª: backoff = INTERVALO_BASE_MS * tentativa2 = 10000ms
    await act(async () => { jest.advanceTimersByTime(10000); });
    await flushPromises();

    expect(global.fetch).toHaveBeenCalledTimes(3);
    expect(onSucesso).toHaveBeenCalledTimes(1);
  });

  it("backoff linear: 2ª tentativa após 5s, 3ª após mais 10s", async () => {
    let callCount = 0;
    global.fetch = jest.fn().mockImplementation(() => {
      callCount++;
      return Promise.resolve({ ok: false, status: 500, json: () => Promise.resolve({}) } as Response);
    });

    const { result } = renderHook(() => useOptimisticResposta());

    await act(async () => { result.current.responder(PAYLOAD); });
    await flushPromises();
    expect(callCount).toBe(1); // 1ª imediata

    await act(async () => { jest.advanceTimersByTime(5000); });
    await flushPromises();
    expect(callCount).toBe(2); // 2ª após 5s

    await act(async () => { jest.advanceTimersByTime(10000); });
    await flushPromises();
    expect(callCount).toBe(3); // 3ª após mais 10s
  });

  // ── Rollback apenas em 4xx ─────────────────────────────────────────────────

  it("rollback (respondida: false) APENAS em erro 4xx", async () => {
    mockFetch(422, { error: "Interação já respondida." });
    const onErroNegocio = jest.fn();
    const { result } = renderHook(() =>
      useOptimisticResposta(undefined, onErroNegocio)
    );

    await act(async () => {
      result.current.responder(PAYLOAD);
    });
    await act(async () => {});

    expect(result.current.respondida).toBe(false); // rollback
    expect(result.current.erro).toBe("NEGOCIO");
    expect(onErroNegocio).toHaveBeenCalled();
  });

  it("sem rollback em erro de rede — estado visual mantido", async () => {
    mockFetchNetwork();
    const { result } = renderHook(() => useOptimisticResposta());

    await act(async () => {
      result.current.responder(PAYLOAD);
    });
    // Esgotar retries sem avançar tempo (primeira tentativa falha)
    await act(async () => { jest.advanceTimersByTime(5000); });
    await act(async () => { jest.advanceTimersByTime(10000); });
    await act(async () => {});

    // Estado visual mantido — usuária não vê erro de rede
    expect(result.current.respondida).toBe(true);
    expect(result.current.erro).toBeNull();
  });

  it("sem rollback em 5xx — estado visual mantido após esgotamento de retries", async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: false,
      status: 503,
      json: () => Promise.resolve({}),
    } as Response);

    const { result } = renderHook(() => useOptimisticResposta());

    await act(async () => { result.current.responder(PAYLOAD); });
    await act(async () => { jest.advanceTimersByTime(5000); });
    await act(async () => { jest.advanceTimersByTime(10000); });
    await act(async () => { jest.advanceTimersByTime(15000); });
    await act(async () => {});

    expect(result.current.respondida).toBe(true); // sem rollback
    expect(result.current.erro).toBeNull();
  });

  // ── resetar ────────────────────────────────────────────────────────────────

  it("resetar() cancela timeout de retry pendente e volta ao estado inicial", async () => {
    mockFetchNetwork();
    const { result } = renderHook(() => useOptimisticResposta());

    await act(async () => { result.current.responder(PAYLOAD); });
    // Retry pendente agendado para 5s

    act(() => { result.current.resetar(); });

    // Avançar além do tempo de retry — fetch não deve ser chamado de novo
    await act(async () => { jest.advanceTimersByTime(10000); });

    expect(result.current.respondida).toBe(false);
    expect(result.current.enviando).toBe(false);
    expect(result.current.erro).toBeNull();
    // Apenas 1 chamada (a inicial) — retry foi cancelado
    expect(global.fetch).toHaveBeenCalledTimes(1);
  });

  // ── Verificação estática: padrão "await responder" é proibido ──────────────
  // Este teste garante que nenhum arquivo nos componentes do Copilot
  // viola a invariante com "await responder(..."

  it("codebase não contém 'await responder(' nos componentes do Copilot", () => {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const fs = require("fs") as typeof import("fs");
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const path = require("path") as typeof import("path");
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const glob = require("glob") as { sync: (p: string) => string[] };

    const files = glob.sync(
      path.join(__dirname, "../../../../components/copilot/**/*.tsx")
    );

    const violacoes: string[] = [];
    for (const file of files) {
      const conteudo = fs.readFileSync(file, "utf-8");
      if (conteudo.includes("await responder(")) {
        violacoes.push(path.relative(process.cwd(), file));
      }
    }

    if (violacoes.length > 0) {
      throw new Error(
        `Invariante violada: responder() foi awaited em:\n${violacoes.join("\n")}\n` +
          `responder() deve ser chamado SEM await (fire-and-forget).`
      );
    }
    expect(violacoes).toHaveLength(0);
  });
});
