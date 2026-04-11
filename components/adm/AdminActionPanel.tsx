"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useState, useTransition } from "react";

import type { AdmActionRequest, AdmActionResult } from "@/lib/adm/actions";

type ActionButton = {
  label: string;
  request: AdmActionRequest;
  tone?: "default" | "danger";
  requiresConfirmation?: boolean;
  confirmTitle?: string;
  confirmDescription?: string;
  confirmLabel?: string;
};

type AdminActionPanelProps = {
  title?: string;
  actions: ActionButton[];
};

export function AdminActionPanel({ title = "Acoes do backoffice", actions }: AdminActionPanelProps) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const router = useRouter();
  const [result, setResult] = useState<AdmActionResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [confirmingAction, setConfirmingAction] = useState<ActionButton | null>(null);
  const [pendingKey, setPendingKey] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const buildActionKey = (action: ActionButton) =>
    `${action.request.type}-${action.request.entityId}-${action.label}`;

  const contextPathname = (() => {
    const query = searchParams?.toString();
    return query ? `${pathname}?${query}` : pathname;
  })();

  const executeAction = (action: ActionButton) => {
    const actionKey = buildActionKey(action);

    startTransition(async () => {
      setResult(null);
      setError(null);
      setPendingKey(actionKey);
      setConfirmingAction(null);

      try {
        const response = await fetch("/api/adm/actions", {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            request: action.request,
            contextPathname
          })
        });

        const payload = (await response.json().catch(() => null)) as
          | AdmActionResult
          | { message?: string }
          | null;

        if (!response.ok || !payload || !("success" in payload) || payload.success !== true) {
          setError(payload?.message ?? "Falha ao executar a acao. Tente novamente.");
          setPendingKey(null);
          return;
        }

        setResult(payload);
        setPendingKey(null);
        router.refresh();
      } catch {
        setError("Falha ao executar a acao. Tente novamente.");
        setPendingKey(null);
      }
    });
  };

  const runAction = (action: ActionButton) => {
    const needsConfirmation = action.requiresConfirmation ?? action.tone === "danger";
    if (needsConfirmation) {
      setConfirmingAction(action);
      setResult(null);
      setError(null);
      return;
    }

    executeAction(action);
  };

  return (
    <section className="rounded-[var(--adm-radius)] border border-[var(--adm-border)] bg-[var(--adm-surface)] p-4 shadow-[var(--adm-shadow-micro)]">
      <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[var(--adm-text-soft)]">
        {title}
      </p>
      {isPending && pendingKey ? (
        <div className="mt-3 rounded-[14px] border border-[var(--adm-border)] bg-[var(--adm-surface-muted)] px-4 py-3 text-xs text-[var(--adm-text-muted)]">
          Aplicando alteracao operacional no fluxo atual...
        </div>
      ) : null}
      {result ? (
        <div className="mt-3 rounded-[14px] border border-emerald-200 bg-emerald-50 px-4 py-3 text-xs text-emerald-900">
          {result.message}
        </div>
      ) : null}
      {error ? (
        <div className="mt-3 rounded-[14px] border border-rose-200 bg-rose-50 px-4 py-3 text-xs text-rose-900">
          {error}
        </div>
      ) : null}
      {confirmingAction ? (
        <div className="mt-3 rounded-[18px] border border-[var(--adm-border)] bg-[var(--adm-surface-muted)] p-4">
          <p className="text-sm font-semibold text-[var(--adm-text)]">
            {confirmingAction.confirmTitle ?? `Confirmar ${confirmingAction.label.toLowerCase()}`}
          </p>
          <p className="mt-2 text-sm leading-relaxed text-[var(--adm-text-muted)]">
            {confirmingAction.confirmDescription ??
              "Esta acao altera o estado operacional atual, registra auditoria e atualiza o log interno."}
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => setConfirmingAction(null)}
              className="rounded-full border border-[var(--adm-border)] bg-white px-4 py-2 text-[10px] font-semibold uppercase tracking-[0.18em] text-[var(--adm-text)]"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={() => executeAction(confirmingAction)}
              disabled={isPending}
              className={`rounded-full border px-4 py-2 text-[10px] font-semibold uppercase tracking-[0.18em] disabled:opacity-50 ${
                confirmingAction.tone === "danger"
                  ? "border-[#d1b0ad] bg-[#6f2f2a] text-white"
                  : "border-[var(--adm-border-strong)] bg-[var(--adm-text)] text-white"
              }`}
            >
              {confirmingAction.confirmLabel ?? confirmingAction.label}
            </button>
          </div>
        </div>
      ) : null}
      <div className="mt-4 flex flex-wrap gap-2">
        {actions.map((action) => (
          <button
            key={buildActionKey(action)}
            type="button"
            onClick={() => runAction(action)}
            disabled={isPending}
            className={`rounded-full border px-4 py-2 text-[10px] font-semibold uppercase tracking-[0.18em] disabled:opacity-50 ${
              action.tone === "danger"
                ? "border-[#d1b0ad] bg-white text-[#6f2f2a]"
                : "border-[var(--adm-border)] bg-white text-[var(--adm-text)]"
            }`}
          >
            {pendingKey === buildActionKey(action) ? "Executando..." : action.label}
          </button>
        ))}
      </div>
    </section>
  );
}
