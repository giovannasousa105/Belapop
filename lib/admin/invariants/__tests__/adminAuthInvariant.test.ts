/**
 * adminAuthInvariant.test.ts
 *
 * Testa autenticarAdmin, assertAdminAutenticado.
 * requireAdmin é mockado — sem banco, sem sessão Supabase.
 */

jest.mock("server-only", () => ({}));
jest.mock("@/lib/supabase/admin", () => ({
  getSupabaseAdminClient: jest.fn(),
}));
jest.mock("@/lib/supabaseServer", () => ({
  getSupabaseServerClient: jest.fn(),
}));
jest.mock("../../requireAdmin", () => ({
  requireAdmin: jest.fn(),
  registrarAudit: jest.fn().mockResolvedValue(undefined),
}));

import { autenticarAdmin, assertAdminAutenticado } from "../adminAuthInvariant";
import type { AdminAutenticado }                   from "../adminAuthInvariant";
import { requireAdmin }                            from "../../requireAdmin";

const mockRequireAdmin = requireAdmin as jest.MockedFunction<typeof requireAdmin>;

function makeAdminUser() {
  return {
    id:     "admin-1",
    userId: "user-1",
    role:   "SUPER_ADMIN" as const,
    nome:   "Alice Admin",
  };
}

beforeEach(() => {
  jest.clearAllMocks();
  mockRequireAdmin.mockResolvedValue(makeAdminUser());
});

// ─── autenticarAdmin ──────────────────────────────────────────────────────────

describe("autenticarAdmin", () => {
  test("retorna AdminAutenticado quando requireAdmin bem-sucedido", async () => {
    const admin = await autenticarAdmin();
    expect(admin).toMatchObject({ id: "admin-1", role: "SUPER_ADMIN" });
  });

  test("passa acao para requireAdmin", async () => {
    await autenticarAdmin("GERENCIAR_LOTES");
    expect(mockRequireAdmin).toHaveBeenCalledWith("GERENCIAR_LOTES");
  });

  test("lança UNAUTHORIZED quando requireAdmin lança 'UNAUTHORIZED'", async () => {
    mockRequireAdmin.mockRejectedValue(new Error("UNAUTHORIZED"));
    await expect(autenticarAdmin()).rejects.toThrow("UNAUTHORIZED");
  });

  test("lança FORBIDDEN quando requireAdmin lança 'FORBIDDEN'", async () => {
    mockRequireAdmin.mockRejectedValue(new Error("FORBIDDEN"));
    await expect(autenticarAdmin("APROVAR_SELLER")).rejects.toThrow("FORBIDDEN");
  });
});

// ─── assertAdminAutenticado ───────────────────────────────────────────────────

describe("assertAdminAutenticado", () => {
  test("não lança para AdminAutenticado válido", async () => {
    const admin = await autenticarAdmin();
    expect(() => assertAdminAutenticado(admin)).not.toThrow();
  });

  test("lança para objeto sem campos obrigatórios", () => {
    expect(() => assertAdminAutenticado(null)).toThrow();
    expect(() => assertAdminAutenticado(undefined)).toThrow();
    expect(() => assertAdminAutenticado("string")).toThrow();
    expect(() => assertAdminAutenticado({})).toThrow();
  });

  test("lança para objeto com apenas user_id (sem id e role)", () => {
    expect(() =>
      assertAdminAutenticado({ userId: "u1" })
    ).toThrow(/AdminAutenticado/);
  });

  test("não lança para objeto com id, userId e role", () => {
    expect(() =>
      assertAdminAutenticado({ id: "a1", userId: "u1", role: "CURADOR" })
    ).not.toThrow();
  });

  test("mensagem de erro menciona autenticarAdmin()", () => {
    try {
      assertAdminAutenticado({});
    } catch (e) {
      expect((e as Error).message).toContain("autenticarAdmin");
    }
  });
});
