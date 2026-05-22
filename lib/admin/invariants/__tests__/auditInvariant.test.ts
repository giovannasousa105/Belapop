/**
 * auditInvariant.test.ts
 *
 * Testa comAudit e ACOES_COM_AUDIT_OBRIGATORIO.
 * registrarAudit é injetado como parâmetro — sem banco.
 */

import {
  comAudit,
  ACOES_COM_AUDIT_OBRIGATORIO,
} from "../auditInvariant";
import type { AcaoComAudit }   from "../auditInvariant";
import type { AdminAutenticado } from "../adminAuthInvariant";

// ─── Fixture ──────────────────────────────────────────────────────────────────

function makeAdmin(): AdminAutenticado {
  return {
    id:     "admin-1",
    userId: "user-1",
    role:   "SUPER_ADMIN",
    nome:   "Alice",
  } as AdminAutenticado;
}

// ─── ACOES_COM_AUDIT_OBRIGATORIO ──────────────────────────────────────────────

describe("ACOES_COM_AUDIT_OBRIGATORIO", () => {
  test("contém as ações críticas de negócio", () => {
    expect(ACOES_COM_AUDIT_OBRIGATORIO).toContain("APROVAR_SELLER");
    expect(ACOES_COM_AUDIT_OBRIGATORIO).toContain("CRIAR_LOTE");
    expect(ACOES_COM_AUDIT_OBRIGATORIO).toContain("REPROVAR_SELLER");
    expect(ACOES_COM_AUDIT_OBRIGATORIO).toContain("MUDAR_STATUS_LOTE");
  });

  test("nunca é array vazio", () => {
    expect(ACOES_COM_AUDIT_OBRIGATORIO.length).toBeGreaterThan(0);
  });
});

// ─── comAudit ─────────────────────────────────────────────────────────────────

describe("comAudit", () => {
  const BASE: AcaoComAudit = "CRIAR_LOTE";

  test("retorna o resultado de executar()", async () => {
    const mockAudit = jest.fn().mockResolvedValue(undefined);
    const resultado = await comAudit({
      admin:    makeAdmin(),
      acao:     BASE,
      executar: async () => ({ lote_id: "lote-1" }),
      _auditFn: mockAudit,
    });
    expect(resultado).toEqual({ lote_id: "lote-1" });
  });

  test("registra audit APÓS sucesso — não antes", async () => {
    const order: string[] = [];
    const mockAudit = jest.fn().mockImplementation(async () => {
      order.push("audit");
    });

    await comAudit({
      admin:    makeAdmin(),
      acao:     BASE,
      executar: async () => { order.push("executar"); return "ok"; },
      _auditFn: mockAudit,
    });

    expect(order[0]).toBe("executar");
    expect(order[1]).toBe("audit");
  });

  test("NÃO registra audit se executar() lança exceção", async () => {
    const mockAudit = jest.fn().mockResolvedValue(undefined);

    await expect(
      comAudit({
        admin:    makeAdmin(),
        acao:     BASE,
        executar: async () => { throw new Error("falha"); },
        _auditFn: mockAudit,
      })
    ).rejects.toThrow("falha");

    // Aguardar microtasks pendentes
    await Promise.resolve();
    expect(mockAudit).not.toHaveBeenCalled();
  });

  test("audit recebe o admin_id correto", async () => {
    const mockAudit = jest.fn().mockResolvedValue(undefined);
    await comAudit({
      admin:    makeAdmin(),
      acao:     BASE,
      executar: async () => "resultado",
      _auditFn: mockAudit,
    });
    // Esperar microtask do void
    await Promise.resolve();
    expect(mockAudit).toHaveBeenCalledWith(
      expect.objectContaining({ admin_id: "admin-1", acao: BASE })
    );
  });

  test("audit recebe dados_antes e referencia_id", async () => {
    const mockAudit = jest.fn().mockResolvedValue(undefined);
    const antes = { status: "EM_VERIFICACAO" };

    await comAudit({
      admin:          makeAdmin(),
      acao:           "APROVAR_SELLER",
      referencia_id:  "seller-1",
      tabela:         "sellers",
      antes,
      executar:       async () => ({ status: "ATIVO" }),
      _auditFn:       mockAudit,
    });
    await Promise.resolve();
    expect(mockAudit).toHaveBeenCalledWith(
      expect.objectContaining({
        referencia_id:  "seller-1",
        tabela:         "sellers",
        dados_antes:    antes,
      })
    );
  });

  test("falha no audit não quebra a operação (fire-and-forget)", async () => {
    // _auditFn que lança — não deve propagar o erro
    const mockAudit = jest.fn().mockRejectedValue(new Error("audit falhou"));

    await expect(
      comAudit({
        admin:    makeAdmin(),
        acao:     BASE,
        executar: async () => "ok",
        _auditFn: mockAudit,
      })
    ).resolves.toBe("ok");
  });
});
