export type ReservaResult =
  | { ok: true; reserva_id: string; expira_em: string; qtd_disponivel: number }
  | { ok: false; motivo: "ESGOTADO" | "LOTE_ENCERRADO" | "ERRO" };

type ReservaApiResponse = {
  reserva_id: string;
  expira_em: string;
  qtd_disponivel: number;
};

type ReservaApiError = {
  error?: string;
};

export async function reservarLote(
  loteId: string,
  quantidade: number,
  sessionId: string,
  userId: string | null
): Promise<ReservaResult> {
  try {
    const res = await fetch(`/api/lotes/${loteId}/reservar`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        session_id: sessionId,
        quantidade,
        user_id: userId ?? undefined,
      }),
    });

    if (res.status === 409 || res.status === 404) {
      const data = (await res.json()) as ReservaApiError;
      const errCode = data.error ?? "";
      if (errCode === "lote_not_found" || errCode === "lote_not_available") {
        return { ok: false, motivo: "LOTE_ENCERRADO" };
      }
      return { ok: false, motivo: "ESGOTADO" };
    }

    if (!res.ok) {
      return { ok: false, motivo: "ERRO" };
    }

    const data = (await res.json()) as ReservaApiResponse;
    return {
      ok: true,
      reserva_id: data.reserva_id,
      expira_em: data.expira_em,
      qtd_disponivel: data.qtd_disponivel,
    };
  } catch {
    return { ok: false, motivo: "ERRO" };
  }
}

export async function liberarReserva(loteId: string, reservaId: string): Promise<void> {
  try {
    await fetch(`/api/lotes/${loteId}/reservas/${reservaId}`, { method: "DELETE" });
  } catch {
    // fire and forget — the 5-min cron is the safety net
  }
}
