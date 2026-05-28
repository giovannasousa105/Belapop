"use client";

import { useState } from "react";

export function GuideEmailCapture() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "ok" | "error">("idle");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || status === "loading") return;
    setStatus("loading");

    const res = await fetch("/api/newsletter/subscribe", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: email.trim() })
    }).catch(() => null);

    setStatus(res?.ok ? "ok" : "error");
  };

  if (status === "ok") {
    return (
      <div className="rounded-2xl bg-[#f0fdf4] px-6 py-8 text-center">
        <p className="font-semibold text-[#1D9E75]">Você está dentro do Círculo.</p>
        <p className="mt-1 text-sm text-black/60">Fique de olho no seu email — a curadoria chega antes de todo mundo.</p>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-black/10 bg-[#f6f3f2] px-6 py-8">
      <p className="text-[10px] font-semibold uppercase tracking-[0.28em] text-[#444748]">Newsletter</p>
      <h3 className="mt-3 font-[var(--font-playfair)] text-xl font-medium text-black">
        Receba a curadoria BelaPop antes de todo mundo.
      </h3>
      <form onSubmit={handleSubmit} className="mt-5 flex gap-2">
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="seu@email.com"
          required
          className="h-11 flex-1 border border-black/15 bg-white px-4 text-sm focus:border-black focus:outline-none"
        />
        <button
          type="submit"
          disabled={status === "loading"}
          className="h-11 bg-black px-5 text-[11px] font-semibold uppercase tracking-[0.18em] text-white transition hover:bg-black/85 disabled:opacity-60"
        >
          {status === "loading" ? "..." : "Entrar no Círculo"}
        </button>
      </form>
      {status === "error" && (
        <p className="mt-2 text-xs text-red-600">Não foi possível cadastrar. Tente novamente.</p>
      )}
    </div>
  );
}
