"use client";

import React, { useState } from "react";

import { LuxuryButton } from "@/components/LuxuryButton";
import { readStorage, storageKeys, writeStorage } from "@/lib/storage";

type NewsletterFormProps = {
  tone?: "light" | "dark";
};

export const NewsletterForm = ({ tone = "light" }: NewsletterFormProps) => {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const isLight = tone === "light";

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    const normalizedEmail = email.trim().toLowerCase();
    const validEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail);

    setMessage(null);
    setError(null);

    if (!validEmail) {
      setError("Informe um e-mail valido para entrar no círculo.");
      return;
    }

    const current = readStorage<string[]>(storageKeys.newsletter, []);
    const next = Array.from(new Set([...current, normalizedEmail]));
    writeStorage(storageKeys.newsletter, next);
    setMessage("Pronto. Seu acesso ao círculo BelaPop foi registrado.");
    setEmail("");
  };

  return (
    <form
      onSubmit={handleSubmit}
      noValidate
      className={`grid gap-5 rounded-[8px] p-6 md:grid-cols-[minmax(0,1fr)_auto] md:items-end ${
        isLight ? "border border-black/10 bg-white shadow-sm" : "border border-white/10 bg-white/[0.04]"
      }`}
    >
      <div>
        <h4
          className={`font-display text-2xl leading-tight ${
            isLight ? "text-bpBlack" : "text-bpOffWhite"
          }`}
        >
          Entre para o circulo BelaPop
        </h4>
        <p className={`mt-2 max-w-xl text-sm leading-6 ${isLight ? "text-bpGraphite/80" : "text-bpPinkSoft/70"}`}>
          Receba drops exclusivos, acessos antecipados e rotinas privadas antes de viralizarem.
        </p>
      </div>
      <div className="flex w-full flex-col gap-3 md:w-auto md:min-w-[360px] md:flex-row md:items-start">
        <label className="sr-only" htmlFor="belapop-newsletter-email">
          E-mail
        </label>
        <input
          id="belapop-newsletter-email"
          type="email"
          inputMode="email"
          autoComplete="email"
          placeholder="seu@email.com"
          value={email}
          onChange={(event) => {
            setEmail(event.target.value);
            if (error) setError(null);
          }}
          aria-invalid={Boolean(error)}
          aria-describedby={error ? "belapop-newsletter-error" : message ? "belapop-newsletter-message" : undefined}
          className={`min-h-12 w-full rounded-[8px] border px-4 py-3 text-base outline-none focus-visible:border-bpPink/60 focus-visible:ring-2 focus-visible:ring-bpPink/30 md:w-64 md:text-sm ${
            isLight
              ? "border-slate-200 bg-white text-bpBlackSoft placeholder:text-bpGraphite/60"
              : "border-white/10 bg-bpBlackSoft text-bpOffWhite placeholder:text-bpPinkSoft/50"
          }`}
        />
        <LuxuryButton type="submit" size="md" tone={isLight ? "retail" : "default"}>
          Entrar no circulo
        </LuxuryButton>
      </div>
      <div className="md:col-span-2">
        {error ? (
          <p id="belapop-newsletter-error" className="text-xs text-red-700">
            {error}
          </p>
        ) : null}
        {message ? (
          <p id="belapop-newsletter-message" className={`text-xs ${isLight ? "text-bpGraphite/70" : "text-bpPinkSoft/70"}`}>
            {message}
          </p>
        ) : null}
      </div>
    </form>
  );
};
