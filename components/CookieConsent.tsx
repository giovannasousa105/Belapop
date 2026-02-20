"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import { getCookie, setCookie } from "@/lib/cookies";

const COOKIE_NAME = "bp_cookie_consent";
const CONSENT_DAYS = 180;

type ConsentChoice = "accepted_all" | "rejected" | "custom";

type ConsentState = {
  choice: ConsentChoice;
  essential: true;
  analytics: boolean;
  marketing: boolean;
  updatedAt: string;
};

const parseConsent = (value: string | null): ConsentState | null => {
  if (!value) return null;
  try {
    const parsed = JSON.parse(value) as Partial<ConsentState>;
    if (!parsed || typeof parsed !== "object") return null;
    if (
      parsed.choice !== "accepted_all" &&
      parsed.choice !== "rejected" &&
      parsed.choice !== "custom"
    ) {
      return null;
    }
    return {
      choice: parsed.choice,
      essential: true,
      analytics: Boolean(parsed.analytics),
      marketing: Boolean(parsed.marketing),
      updatedAt:
        typeof parsed.updatedAt === "string"
          ? parsed.updatedAt
          : new Date().toISOString()
    };
  } catch {
    return null;
  }
};

const buildConsent = (
  choice: ConsentChoice,
  analytics: boolean,
  marketing: boolean
): ConsentState => ({
  choice,
  essential: true,
  analytics,
  marketing,
  updatedAt: new Date().toISOString()
});

export const CookieConsent = () => {
  const [open, setOpen] = useState(false);
  const [showPrefs, setShowPrefs] = useState(false);
  const [analytics, setAnalytics] = useState(false);
  const [marketing, setMarketing] = useState(false);

  useEffect(() => {
    const stored = parseConsent(getCookie(COOKIE_NAME));
    if (!stored) {
      setOpen(true);
      return;
    }
    setAnalytics(stored.analytics);
    setMarketing(stored.marketing);
  }, []);

  useEffect(() => {
    if (!open) return;
    const original = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = original;
    };
  }, [open]);

  const saveConsent = (consent: ConsentState) => {
    setCookie(COOKIE_NAME, JSON.stringify(consent), CONSENT_DAYS);
    setOpen(false);
    setShowPrefs(false);
  };

  const acceptAll = () => saveConsent(buildConsent("accepted_all", true, true));
  const rejectAll = () => saveConsent(buildConsent("rejected", false, false));
  const saveCustom = () => saveConsent(buildConsent("custom", analytics, marketing));

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[70] flex items-end justify-center bg-black/40 p-4 backdrop-blur-sm md:items-center">
      <div className="relative w-full max-w-3xl rounded-[32px] border border-white/40 bg-white/95 p-6 shadow-2xl md:p-8">
        <button
          type="button"
          onClick={rejectAll}
          className="absolute right-6 top-5 text-xs font-semibold uppercase tracking-[0.2em] text-bpGraphite/70 hover:text-bpBlackSoft"
        >
          Continuar sem aceitar
        </button>

        <p className="text-[10px] uppercase tracking-[0.35em] text-bpPink">
          Preferencias de Cookies
        </p>
        <h2 className="mt-2 font-display text-2xl text-bpBlack md:text-3xl">
          Com ou sem cookies?
        </h2>
        <p className="mt-4 text-sm leading-relaxed text-bpGraphite">
          Usamos cookies tecnicos (sempre ativos) para garantir o funcionamento
          do site. Cookies analiticos e de marketing ajudam a medir desempenho e
          personalizar experiencias. Voce pode aceitar tudo, recusar ou
          personalizar.
        </p>
        <p className="mt-3 text-xs text-bpGraphite/70">
          Saiba mais na nossa{" "}
          <Link href="/cookies" className="underline">
            Politica de Cookies
          </Link>
          .
        </p>

        {showPrefs ? (
          <div className="mt-6 space-y-4">
            <div className="flex items-center justify-between rounded-2xl border border-black/10 bg-white p-4">
              <div>
                <p className="text-sm font-semibold text-bpBlackSoft">Essenciais</p>
                <p className="text-xs text-bpGraphite/70">Sempre ativos.</p>
              </div>
              <span className="rounded-full bg-bpBlack/10 px-3 py-1 text-[11px] font-semibold text-bpGraphite">
                Ativo
              </span>
            </div>

            <div className="flex items-center justify-between rounded-2xl border border-black/10 bg-white p-4">
              <div>
                <p className="text-sm font-semibold text-bpBlackSoft">Analiticos</p>
                <p className="text-xs text-bpGraphite/70">
                  Ajudam a entender a navegacao.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setAnalytics((prev) => !prev)}
                aria-pressed={analytics}
                className={`rounded-full px-3 py-1 text-[11px] font-semibold transition ${
                  analytics ? "bg-bpPink text-white" : "bg-bpBlack/10 text-bpGraphite"
                }`}
              >
                {analytics ? "Ativo" : "Desativado"}
              </button>
            </div>

            <div className="flex items-center justify-between rounded-2xl border border-black/10 bg-white p-4">
              <div>
                <p className="text-sm font-semibold text-bpBlackSoft">Marketing</p>
                <p className="text-xs text-bpGraphite/70">
                  Personaliza conteudos e ofertas.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setMarketing((prev) => !prev)}
                aria-pressed={marketing}
                className={`rounded-full px-3 py-1 text-[11px] font-semibold transition ${
                  marketing ? "bg-bpPink text-white" : "bg-bpBlack/10 text-bpGraphite"
                }`}
              >
                {marketing ? "Ativo" : "Desativado"}
              </button>
            </div>
          </div>
        ) : null}

        <div className="mt-6 flex flex-col gap-3 md:flex-row">
          <button
            type="button"
            onClick={() => setShowPrefs((prev) => !prev)}
            className="flex-1 rounded-full border border-bpBlackSoft/10 bg-bpBlack px-6 py-3 text-xs font-semibold uppercase tracking-[0.25em] text-white"
          >
            Personalizar minhas escolhas
          </button>
          <button
            type="button"
            onClick={acceptAll}
            className="flex-1 rounded-full border border-bpBlackSoft/10 bg-white px-6 py-3 text-xs font-semibold uppercase tracking-[0.25em] text-bpBlackSoft"
          >
            Aceitar tudo
          </button>
          {showPrefs ? (
            <button
              type="button"
              onClick={saveCustom}
              className="flex-1 rounded-full border border-bpPink bg-bpPink/90 px-6 py-3 text-xs font-semibold uppercase tracking-[0.25em] text-white"
            >
              Salvar preferencias
            </button>
          ) : null}
        </div>
      </div>
    </div>
  );
};
