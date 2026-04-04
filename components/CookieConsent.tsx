"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

import { cookieCategories, legalRoutes, type CookieCategoryKey } from "@/lib/legal/content";
import { getCookie, setCookie } from "@/lib/cookies";

const COOKIE_NAME = "bp_cookie_consent";
const STORAGE_NAME = "bp_cookie_consent";
const CONSENT_DAYS = 180;

type ConsentChoice = "accepted_all" | "rejected_non_essential" | "custom";

type ConsentState = {
  choice: ConsentChoice;
  necessary: true;
  performance: boolean;
  functionality: boolean;
  advertising: boolean;
  updatedAt: string;
};

const defaultConsentState = (choice: ConsentChoice): ConsentState => ({
  choice,
  necessary: true,
  performance: false,
  functionality: false,
  advertising: false,
  updatedAt: new Date().toISOString()
});

const parseConsent = (value: string | null): ConsentState | null => {
  if (!value) return null;

  try {
    const parsed = JSON.parse(value) as {
      choice?: ConsentChoice | "rejected";
      necessary?: boolean;
      performance?: boolean;
      functionality?: boolean;
      advertising?: boolean;
      updatedAt?: string;
      analytics?: boolean;
      marketing?: boolean;
    };

    if (!parsed || typeof parsed !== "object") return null;

    if (
      parsed.choice !== "accepted_all" &&
      parsed.choice !== "rejected_non_essential" &&
      parsed.choice !== "custom" &&
      parsed.choice !== "rejected"
    ) {
      return null;
    }

    return {
      choice:
        parsed.choice === "rejected" ? "rejected_non_essential" : parsed.choice,
      necessary: true,
      performance: Boolean(parsed.performance ?? parsed.analytics),
      functionality: Boolean(parsed.functionality),
      advertising: Boolean(parsed.advertising ?? parsed.marketing),
      updatedAt:
        typeof parsed.updatedAt === "string"
          ? parsed.updatedAt
          : new Date().toISOString()
    };
  } catch {
    return null;
  }
};

const readStoredConsent = () => {
  const localValue =
    typeof window !== "undefined" ? window.localStorage.getItem(STORAGE_NAME) : null;
  return parseConsent(localValue) ?? parseConsent(getCookie(COOKIE_NAME));
};

const dispatchConsentUpdate = (consent: ConsentState) => {
  if (typeof window === "undefined") return;

  const extendedWindow = window as Window & {
    __BelaPopCookieConsent__?: ConsentState;
    dataLayer?: Array<Record<string, unknown>>;
  };

  window.localStorage.setItem(STORAGE_NAME, JSON.stringify(consent));
  setCookie(COOKIE_NAME, JSON.stringify(consent), CONSENT_DAYS);
  extendedWindow.__BelaPopCookieConsent__ = consent;
  window.dispatchEvent(
    new CustomEvent("belapop:cookie-consent-changed", {
      detail: consent
    })
  );

  if (Array.isArray(extendedWindow.dataLayer)) {
    extendedWindow.dataLayer.push({
      event: "belapop_cookie_consent_updated",
      belapopCookieConsent: consent
    });
  }
};

export const CookieConsent = () => {
  const [bannerOpen, setBannerOpen] = useState(false);
  const [preferencesOpen, setPreferencesOpen] = useState(false);
  const [performance, setPerformance] = useState(false);
  const [functionality, setFunctionality] = useState(false);
  const [advertising, setAdvertising] = useState(false);

  useEffect(() => {
    const stored = readStoredConsent();
    if (!stored) {
      setBannerOpen(true);
      return;
    }

    setPerformance(stored.performance);
    setFunctionality(stored.functionality);
    setAdvertising(stored.advertising);
  }, []);

  useEffect(() => {
    const openPreferences = () => {
      const stored = readStoredConsent();

      if (stored) {
        setPerformance(stored.performance);
        setFunctionality(stored.functionality);
        setAdvertising(stored.advertising);
      }

      setPreferencesOpen(true);
      setBannerOpen(false);
    };

    window.addEventListener("belapop:open-cookie-preferences", openPreferences);
    return () => {
      window.removeEventListener("belapop:open-cookie-preferences", openPreferences);
    };
  }, []);

  useEffect(() => {
    if (!bannerOpen && !preferencesOpen) return;

    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = originalOverflow;
    };
  }, [bannerOpen, preferencesOpen]);

  const hasOpenLayer = bannerOpen || preferencesOpen;

  const categoryState = useMemo<Record<CookieCategoryKey, boolean>>(
    () => ({
      necessary: true,
      performance,
      functionality,
      advertising
    }),
    [advertising, functionality, performance]
  );

  const saveConsent = (consent: ConsentState) => {
    dispatchConsentUpdate(consent);
    setPerformance(consent.performance);
    setFunctionality(consent.functionality);
    setAdvertising(consent.advertising);
    setBannerOpen(false);
    setPreferencesOpen(false);
  };

  const acceptAll = () =>
    saveConsent({
      ...defaultConsentState("accepted_all"),
      performance: true,
      functionality: true,
      advertising: true
    });

  const rejectNonEssential = () => saveConsent(defaultConsentState("rejected_non_essential"));

  const saveCustom = () =>
    saveConsent({
      ...defaultConsentState("custom"),
      performance,
      functionality,
      advertising
    });

  if (!hasOpenLayer) return null;

  return (
    <div className="fixed inset-0 z-[70] bg-black/45 backdrop-blur-sm">
      <div className="flex min-h-full items-end justify-center p-4 md:items-center">
        {bannerOpen ? (
          <div className="w-full max-w-4xl rounded-[32px] border border-white/30 bg-white/95 p-6 shadow-[0_30px_90px_rgba(0,0,0,0.18)] md:p-8">
            <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_18rem] lg:items-start">
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-[0.34em] text-[#8c5d66]">
                  Cookies e privacidade
                </p>
                <h2 className="mt-3 font-display text-3xl leading-tight text-[#1c1b1b] md:text-4xl">
                  Escolha como a BelaPop usa cookies.
                </h2>
                <p className="mt-4 text-sm leading-7 text-[#51494a] md:text-base">
                  Usamos cookies e tecnologias semelhantes para manter a plataforma segura, lembrar
                  sessão, prevenir fraude, medir desempenho e, quando permitido, personalizar
                  conteúdo ou campanhas. Você pode aceitar tudo, recusar os não essenciais ou
                  personalizar as categorias.
                </p>
                <p className="mt-4 text-sm leading-7 text-[#51494a]">
                  Saiba mais na{" "}
                  <Link
                    href={legalRoutes.cookies}
                    className="font-semibold text-[#1c1b1b] underline decoration-[#c88fa3] underline-offset-4"
                  >
                    Política de Cookies
                  </Link>
                  .
                </p>
              </div>

              <div className="rounded-[28px] border border-[#ebe1e2] bg-[#fcf7f7] p-5">
                <p className="text-[10px] font-semibold uppercase tracking-[0.28em] text-[#8c5d66]">
                  Categorias tratadas
                </p>
                <ul className="mt-4 space-y-3 text-sm leading-6 text-[#51494a]">
                  {cookieCategories.map((category) => (
                    <li key={category.key}>
                      <span className="font-semibold text-[#1c1b1b]">{category.title}:</span>{" "}
                      {category.description}
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            <div className="mt-8 flex flex-col gap-3 md:flex-row">
              <button
                type="button"
                onClick={acceptAll}
                className="min-h-14 flex-1 rounded-full bg-black px-6 text-[11px] font-semibold uppercase tracking-[0.24em] text-white"
              >
                Aceitar todos
              </button>
              <button
                type="button"
                onClick={rejectNonEssential}
                className="min-h-14 flex-1 rounded-full border border-black/10 bg-white px-6 text-[11px] font-semibold uppercase tracking-[0.24em] text-[#1c1b1b]"
              >
                Recusar nao essenciais
              </button>
              <button
                type="button"
                onClick={() => {
                  setBannerOpen(false);
                  setPreferencesOpen(true);
                }}
                className="min-h-14 flex-1 rounded-full border border-[#d7c3c6] bg-[#fff6f7] px-6 text-[11px] font-semibold uppercase tracking-[0.24em] text-[#8c5d66]"
              >
                Personalizar cookies
              </button>
            </div>
          </div>
        ) : null}

        {preferencesOpen ? (
          <div className="w-full max-w-3xl rounded-[32px] border border-white/30 bg-white/95 p-6 shadow-[0_30px_90px_rgba(0,0,0,0.18)] md:p-8">
            <div className="flex items-start justify-between gap-6">
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-[0.34em] text-[#8c5d66]">
                  Preferencias de cookies
                </p>
                <h2 className="mt-3 font-display text-3xl leading-tight text-[#1c1b1b] md:text-4xl">
                  Ajuste as categorias opcionais.
                </h2>
              </div>
              <button
                type="button"
                onClick={() => {
                  const stored = readStoredConsent();
                  if (stored) {
                    setPreferencesOpen(false);
                  } else {
                    setPreferencesOpen(false);
                    setBannerOpen(true);
                  }
                }}
                className="text-[10px] font-semibold uppercase tracking-[0.22em] text-[#6d6667]"
              >
                Fechar
              </button>
            </div>

            <div className="mt-6 space-y-4">
              {cookieCategories.map((category) => {
                const isActive = categoryState[category.key];

                return (
                  <article
                    key={category.key}
                    className="flex items-start justify-between gap-6 rounded-[24px] border border-[#ebe1e2] bg-white p-5"
                  >
                    <div>
                      <h3 className="text-base font-semibold text-[#1c1b1b]">{category.title}</h3>
                      <p className="mt-2 text-sm leading-6 text-[#51494a]">
                        {category.description}
                      </p>
                    </div>

                    {category.alwaysOn ? (
                      <span className="inline-flex shrink-0 rounded-full bg-black/8 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-[#1c1b1b]">
                        Sempre ativo
                      </span>
                    ) : (
                      <button
                        type="button"
                        aria-pressed={isActive}
                        onClick={() => {
                          if (category.key === "performance") {
                            setPerformance((current) => !current);
                          }

                          if (category.key === "functionality") {
                            setFunctionality((current) => !current);
                          }

                          if (category.key === "advertising") {
                            setAdvertising((current) => !current);
                          }
                        }}
                        className={`inline-flex min-w-[7rem] shrink-0 justify-center rounded-full px-4 py-2 text-[10px] font-semibold uppercase tracking-[0.16em] transition ${
                          isActive
                            ? "border border-[#d7c3c6] bg-[#fff6f7] text-[#8c5d66]"
                            : "border border-black/10 bg-[#f6f3f2] text-[#51494a]"
                        }`}
                      >
                        {isActive ? "Ativo" : "Desativado"}
                      </button>
                    )}
                  </article>
                );
              })}
            </div>

            <div className="mt-8 flex flex-col gap-3 md:flex-row">
              <button
                type="button"
                onClick={saveCustom}
                className="min-h-14 flex-1 rounded-full bg-black px-6 text-[11px] font-semibold uppercase tracking-[0.24em] text-white"
              >
                Salvar preferencias
              </button>
              <button
                type="button"
                onClick={acceptAll}
                className="min-h-14 flex-1 rounded-full border border-black/10 bg-white px-6 text-[11px] font-semibold uppercase tracking-[0.24em] text-[#1c1b1b]"
              >
                Aceitar todos
              </button>
              <button
                type="button"
                onClick={rejectNonEssential}
                className="min-h-14 flex-1 rounded-full border border-[#d7c3c6] bg-[#fff6f7] px-6 text-[11px] font-semibold uppercase tracking-[0.24em] text-[#8c5d66]"
              >
                Recusar nao essenciais
              </button>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
};
