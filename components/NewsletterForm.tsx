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
  const isLight = tone === "light";

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    if (!email) {
      setMessage("Informe seu e-mail para receber novidades.");
      return;
    }
    const current = readStorage<string[]>(storageKeys.newsletter, []);
    const next = Array.from(new Set([...current, email]));
    writeStorage(storageKeys.newsletter, next);
    setMessage("Perfeito. Novidades editoriais a caminho.");
    setEmail("");
  };

  return (
    <form
      onSubmit={handleSubmit}
      className={`flex flex-col gap-4 rounded-2xl p-6 md:flex-row md:items-center md:justify-between ${
        isLight ? "border border-black/10 bg-white shadow-sm" : "glass-panel"
      }`}
    >
      <div>
        <h4
          className={`font-display text-lg ${
            isLight ? "text-bpBlack" : "text-bpOffWhite"
          }`}
        >
          Receber novidades
        </h4>
        <p className={`text-sm ${isLight ? "text-bpGraphite/80" : "text-bpPinkSoft/70"}`}>
          Uma curadoria semanal com beleza, pele e bem-estar.
        </p>
      </div>
      <div className="flex w-full flex-col gap-3 md:w-auto md:flex-row md:items-center">
        <input
          type="email"
          placeholder="seu@email.com"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          className={`w-full rounded-2xl border px-4 py-3 text-sm outline-none focus-visible:border-bpPink/60 md:w-64 ${
            isLight
              ? "border-slate-200 bg-white text-bpBlackSoft placeholder:text-bpGraphite/60"
              : "border-white/10 bg-bpBlackSoft text-bpOffWhite placeholder:text-bpPinkSoft/50"
          }`}
        />
        <LuxuryButton type="submit" size="md" tone={isLight ? "retail" : "default"}>
          Receber novidades
        </LuxuryButton>
      </div>
      {message ? (
        <p className={`text-xs md:ml-auto ${isLight ? "text-bpGraphite/70" : "text-bpPinkSoft/70"}`}>
          {message}
        </p>
      ) : null}
    </form>
  );
};
