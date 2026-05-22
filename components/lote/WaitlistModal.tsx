"use client";

import { useRef, useState } from "react";

interface WaitlistModalProps {
  lote_id: string;
  produto_id: string;
  onSuccess?: () => void;
}

type SubmitState = "idle" | "loading" | "success" | "error";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

export function WaitlistModal({ lote_id, produto_id, onSuccess }: WaitlistModalProps) {
  const [email, setEmail] = useState("");
  const [emailError, setEmailError] = useState<string | null>(null);
  const [submitState, setSubmitState] = useState<SubmitState>("idle");
  const inputRef = useRef<HTMLInputElement>(null);

  produto_id; // consumed by POST body

  function validateEmail(value: string): string | null {
    if (!value.trim()) return "Informe seu e-mail.";
    if (!EMAIL_RE.test(value.trim())) return "E-mail inválido.";
    return null;
  }

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    setEmail(e.target.value);
    if (emailError) setEmailError(validateEmail(e.target.value));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    const err = validateEmail(email);
    if (err) {
      setEmailError(err);
      inputRef.current?.focus();
      return;
    }

    setEmailError(null);
    setSubmitState("loading");

    try {
      const res = await fetch(`/api/lotes/${lote_id}/lista-espera`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim().toLowerCase(), origem: "pdp" }),
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({})) as { error?: string };
        throw new Error(body.error ?? `HTTP ${res.status}`);
      }

      setSubmitState("success");
      onSuccess?.();
    } catch {
      setSubmitState("error");
    }
  }

  if (submitState === "success") {
    return (
      <div
        role="status"
        aria-live="polite"
        className="mt-4 rounded-[var(--border-radius-md,8px)] border border-[#262626] bg-[#111111] px-5 py-4"
      >
        <p className="text-[13px] font-light leading-relaxed text-[#F8F7F4]">
          Anotado. Você será a primeira a saber.
        </p>
      </div>
    );
  }

  return (
    <div className="mt-4 rounded-[var(--border-radius-md,8px)] border border-[#262626] bg-[#111111] px-5 py-5">
      <p className="mb-4 text-[12px] uppercase tracking-[0.15em] text-[#B8B8B8]">
        Avise-me quando chegar
      </p>

      <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-3 sm:flex-row sm:items-start">
        <div className="flex flex-1 flex-col gap-1">
          <input
            ref={inputRef}
            type="email"
            autoComplete="email"
            inputMode="email"
            placeholder="seu@email.com"
            value={email}
            onChange={handleChange}
            disabled={submitState === "loading"}
            aria-invalid={Boolean(emailError)}
            aria-describedby={emailError ? "waitlist-email-error" : undefined}
            className="w-full rounded-[var(--border-radius-md,8px)] border border-[#262626] bg-transparent px-4 py-3 text-[13px] text-[#F8F7F4] placeholder-[#4A4A4A] outline-none transition-colors focus:border-[#555555] disabled:opacity-50"
          />
          {emailError && (
            <p
              id="waitlist-email-error"
              role="alert"
              className="text-[11px] text-[#B06060]"
            >
              {emailError}
            </p>
          )}
        </div>

        <button
          type="submit"
          disabled={submitState === "loading"}
          className="shrink-0 rounded-[var(--border-radius-md,8px)] bg-[#F8F7F4] px-5 py-3 text-[11px] font-semibold uppercase tracking-[0.2em] text-[#111111] transition-opacity hover:opacity-80 disabled:opacity-40 sm:mt-0"
        >
          {submitState === "loading" ? "Aguarde…" : "Quero ser avisada"}
        </button>
      </form>

      {submitState === "error" && (
        <p role="alert" className="mt-2 text-[11px] text-[#B06060]">
          Não foi possível salvar. Tente novamente.
        </p>
      )}
    </div>
  );
}
