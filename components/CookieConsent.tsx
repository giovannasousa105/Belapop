"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

import { cookieCategories, legalRoutes, type CookieCategoryKey } from "@/lib/legal/content";
import { getCookie, setCookie } from "@/lib/cookies";

const COOKIE_NAME = "bp_cookie_consent";
const STORAGE_NAME = "bp_cookie_consent";
const CONSENT_DAYS = 180;

const cookieCopyByKey = {
  necessary: {
    title: "Estritamente necess\u00e1rios",
    description:
      "Mant\u00eam sess\u00e3o, seguran\u00e7a, autentica\u00e7\u00e3o, preven\u00e7\u00e3o a fraude e funcionamento b\u00e1sico da plataforma."
  },
  performance: {
    title: "Desempenho e an\u00e1lise",
    description:
      "Ajudam a entender navega\u00e7\u00e3o, performance de p\u00e1ginas e erros para melhorar a experi\u00eancia."
  },
  functionality: {
    title: "Funcionalidade",
    description:
      "Guardam prefer\u00eancias de interface, conte\u00fado \u00fatil e recursos que tornam a navega\u00e7\u00e3o mais consistente."
  },
  advertising: {
    title: "Publicidade e personaliza\u00e7\u00e3o",
    description:
      "Suportam personaliza\u00e7\u00e3o de campanhas, audi\u00eancias e experi\u00eancias de m\u00eddia quando houver base adequada."
  }
} satisfies Record<
  CookieCategoryKey,
  {
    title: string;
    description: string;
  }
>;

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

  const closePreferences = () => {
    const stored = readStoredConsent();

    if (stored) {
      setPreferencesOpen(false);
      return;
    }

    setPreferencesOpen(false);
    setBannerOpen(true);
  };

  if (!hasOpenLayer) return null;

  return (
    <div className="fixed inset-0 z-[70] bg-black/45 backdrop-blur-sm">
      <div className="flex min-h-full items-end justify-center p-4 md:items-center">
        {bannerOpen ? (
          <div className="relative flex max-h-[calc(100svh-1rem)] w-full max-w-4xl flex-col overflow-hidden rounded-[34px] border border-[#eadedf] bg-[linear-gradient(180deg,rgba(255,255,255,0.98),rgba(248,243,244,0.94))] shadow-[0_40px_120px_rgba(17,12,13,0.18)]">
            <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[#d8b8bf] to-transparent" />

            <div className="shrink-0 border-b border-[#ece3e5] px-5 pb-4 pt-5 md:px-8 md:pb-6 md:pt-7">
              <p className="text-[10px] font-semibold uppercase tracking-[0.34em] text-[#8c5d66]">
                Cookies e privacidade
              </p>
              <h2 className="mt-2.5 font-display text-[1.9rem] leading-tight text-[#1c1b1b] md:mt-3 md:text-4xl">
                Escolha como a BelaPop usa cookies.
              </h2>
            </div>

            <div className="min-h-0 flex-1 overflow-y-auto px-5 py-4 md:px-8 md:py-6 [scrollbar-gutter:stable] [scrollbar-width:thin] [scrollbar-color:#c5aab0_#f1e7e9] [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-[#ccb2b8] [&::-webkit-scrollbar-thumb]:transition-colors [&::-webkit-scrollbar-track]:bg-[#f1e7e9] [&::-webkit-scrollbar]:w-2 hover:[&::-webkit-scrollbar-thumb]:bg-[#b8939a]">
              <div className="grid gap-4 md:gap-5 lg:grid-cols-[minmax(0,1fr)_19rem] lg:items-start">
                <div>
                  <p className="text-[13px] leading-6 text-[#51494a] md:text-sm md:leading-7">
                    {
                      "Usamos cookies e tecnologias semelhantes para manter a plataforma segura, lembrar sess\u00e3o, prevenir fraude, medir desempenho e, quando permitido, personalizar conte\u00fado ou campanhas. Voc\u00ea pode aceitar tudo, recusar os n\u00e3o essenciais ou personalizar as categorias."
                    }
                  </p>
                  <p className="mt-3 text-[13px] leading-6 text-[#51494a] md:mt-4 md:text-sm md:leading-7">
                    Saiba mais na{" "}
                    <Link
                      href={legalRoutes.cookies}
                      className="font-semibold text-[#1c1b1b] underline decoration-[#c88fa3] underline-offset-4"
                    >
                      {"Pol\u00edtica de Cookies"}
                    </Link>
                    .
                  </p>
                </div>

                <div className="rounded-[22px] border border-[#ebe1e2] bg-[#fcf7f7] p-4 md:rounded-[28px] md:p-5">
                  <p className="text-[10px] font-semibold uppercase tracking-[0.28em] text-[#8c5d66]">
                    Categorias tratadas
                  </p>
                  <ul className="mt-3 max-h-[28svh] space-y-2.5 overflow-y-auto pr-1 text-[13px] leading-6 text-[#51494a] md:mt-4 md:max-h-[34svh] md:space-y-3 md:text-sm [scrollbar-gutter:stable] [scrollbar-width:thin] [scrollbar-color:#d0b8be_#f3eaec] [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-[#d0b8be] [&::-webkit-scrollbar-track]:bg-[#f3eaec] [&::-webkit-scrollbar]:w-1.5">
                    {cookieCategories.map((category) => (
                      <li key={category.key}>
                        <span className="font-semibold text-[#1c1b1b]">
                          {cookieCopyByKey[category.key].title}:
                        </span>{" "}
                        {cookieCopyByKey[category.key].description}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>

            <div className="shrink-0 border-t border-[#ece3e5] bg-[linear-gradient(180deg,rgba(255,255,255,0.92),rgba(248,243,244,0.98))] px-5 py-4 md:px-8 md:py-5">
              <div className="flex flex-col gap-3 md:flex-row">
                <button
                  type="button"
                  onClick={acceptAll}
                  className="min-h-12 flex-1 rounded-full bg-black px-5 text-[10px] font-semibold uppercase tracking-[0.22em] text-white md:min-h-14 md:px-6 md:text-[11px] md:tracking-[0.24em]"
                >
                  Aceitar todos
                </button>
                <button
                  type="button"
                  onClick={rejectNonEssential}
                  className="min-h-12 flex-1 rounded-full border border-black/10 bg-white px-5 text-[10px] font-semibold uppercase tracking-[0.22em] text-[#1c1b1b] md:min-h-14 md:px-6 md:text-[11px] md:tracking-[0.24em]"
                >
                  {"Recusar n\u00e3o essenciais"}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setBannerOpen(false);
                    setPreferencesOpen(true);
                  }}
                  className="min-h-12 flex-1 rounded-full border border-[#d7c3c6] bg-[#fff6f7] px-5 text-[10px] font-semibold uppercase tracking-[0.22em] text-[#8c5d66] md:min-h-14 md:px-6 md:text-[11px] md:tracking-[0.24em]"
                >
                  Personalizar cookies
                </button>
              </div>
            </div>
          </div>
        ) : null}

        {preferencesOpen ? (
          <div className="relative flex max-h-[calc(100svh-1rem)] w-full max-w-4xl flex-col overflow-hidden rounded-[34px] border border-[#eadedf] bg-[linear-gradient(180deg,rgba(255,255,255,0.98),rgba(248,243,244,0.94))] shadow-[0_40px_120px_rgba(17,12,13,0.18)]">
            <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[#d8b8bf] to-transparent" />

            <div className="shrink-0 border-b border-[#ece3e5] px-5 pb-4 pt-5 md:px-8 md:pb-6 md:pt-7">
              <div className="flex items-start justify-between gap-4">
                <div className="max-w-2xl">
                  <p className="text-[10px] font-semibold uppercase tracking-[0.34em] text-[#8c5d66]">
                    {"Prefer\u00eancias de cookies"}
                  </p>
                  <h2 className="mt-2.5 font-display text-[1.75rem] leading-tight text-[#1c1b1b] md:mt-3 md:text-4xl">
                    Ajuste as categorias opcionais.
                  </h2>
                  <p className="mt-3 max-w-xl text-[13px] leading-6 text-[#51494a] md:mt-4 md:text-[15px] md:leading-7">
                    {
                      "Controle como a plataforma usa dados para medir experi\u00eancia, lembrar prefer\u00eancias e manter a navega\u00e7\u00e3o consistente."
                    }
                  </p>
                </div>
                <button
                  type="button"
                  onClick={closePreferences}
                  className="inline-flex min-h-11 shrink-0 items-center rounded-full border border-black/10 bg-white/85 px-5 text-[10px] font-semibold uppercase tracking-[0.22em] text-[#6d6667] transition hover:border-[#d8c7ca] hover:text-[#1c1b1b]"
                >
                  Fechar
                </button>
              </div>

              <div className="mt-4 grid grid-cols-2 gap-2 md:mt-5 md:grid-cols-3 md:gap-3">
                <div className="rounded-[18px] border border-[#ebe2e4] bg-white/80 px-3 py-2.5 md:rounded-[22px] md:px-4 md:py-3">
                  <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-[#8c5d66]">
                    Controle granular
                  </p>
                  <p className="mt-1.5 text-[12px] leading-5 text-[#51494a] md:mt-2 md:text-sm md:leading-6">
                    Ajuste cada categoria com clareza.
                  </p>
                </div>
                <div className="rounded-[18px] border border-[#ebe2e4] bg-white/80 px-3 py-2.5 md:rounded-[22px] md:px-4 md:py-3">
                  <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-[#8c5d66]">
                    Essenciais ativos
                  </p>
                  <p className="mt-1.5 text-[12px] leading-5 text-[#51494a] md:mt-2 md:text-sm md:leading-6">
                    {
                      "Seguran\u00e7a, sess\u00e3o e funcionamento b\u00e1sico permanecem ligados."
                    }
                  </p>
                </div>
                <div className="col-span-2 rounded-[18px] border border-[#ebe2e4] bg-white/80 px-3 py-2.5 md:col-span-1 md:rounded-[22px] md:px-4 md:py-3">
                  <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-[#8c5d66]">
                    {"Transpar\u00eancia"}
                  </p>
                  <p className="mt-1.5 text-[12px] leading-5 text-[#51494a] md:mt-2 md:text-sm md:leading-6">
                    {"Voc\u00ea pode revisar essas escolhas a qualquer momento."}
                  </p>
                </div>
              </div>
            </div>

            <div className="min-h-0 max-h-[24svh] flex-1 overflow-y-scroll px-3 py-4 md:max-h-[34svh] md:px-4 md:py-6 [scrollbar-gutter:stable] [scrollbar-width:thin] [scrollbar-color:#c5aab0_#f1e7e9] [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-[#ccb2b8] [&::-webkit-scrollbar-thumb]:transition-colors [&::-webkit-scrollbar-track]:bg-[#f1e7e9] [&::-webkit-scrollbar]:w-2 hover:[&::-webkit-scrollbar-thumb]:bg-[#b8939a]">
              <div className="space-y-4 pr-1 md:pr-2">
                {cookieCategories.map((category) => {
                  const isActive = categoryState[category.key];

                  return (
                    <article
                      key={category.key}
                      className="rounded-[22px] border border-[#ebe2e4] bg-white/88 p-4 shadow-[0_12px_30px_rgba(38,24,27,0.04)] md:rounded-[26px] md:p-6"
                    >
                      <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between md:gap-4">
                        <div className="max-w-2xl">
                          <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-[#8c5d66]">
                            Categoria
                          </p>
                          <h3 className="mt-1.5 text-base font-semibold text-[#1c1b1b] md:mt-2 md:text-lg">
                            {cookieCopyByKey[category.key].title}
                          </h3>
                          <p className="mt-2 text-[13px] leading-6 text-[#51494a] md:mt-3 md:text-sm md:leading-7">
                            {cookieCopyByKey[category.key].description}
                          </p>
                        </div>

                        {category.alwaysOn ? (
                          <span className="inline-flex min-h-11 shrink-0 items-center justify-center rounded-full border border-black/10 bg-[#111111] px-4 text-[10px] font-semibold uppercase tracking-[0.16em] text-white">
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
                            className={`inline-flex min-h-11 min-w-[8.75rem] shrink-0 items-center justify-center gap-2 rounded-full px-4 text-[10px] font-semibold uppercase tracking-[0.16em] transition ${
                              isActive
                                ? "border border-[#d6bcc2] bg-[#fff4f6] text-[#8c5d66]"
                                : "border border-black/10 bg-[#f6f3f2] text-[#51494a]"
                            }`}
                          >
                            <span
                              className={`h-2.5 w-2.5 rounded-full ${
                                isActive ? "bg-[#8c5d66]" : "bg-[#b4acae]"
                              }`}
                            />
                            {isActive ? "Ativo" : "Desativado"}
                          </button>
                        )}
                      </div>
                    </article>
                  );
                })}
              </div>
            </div>

            <div className="shrink-0 border-t border-[#ece3e5] bg-[linear-gradient(180deg,rgba(255,255,255,0.92),rgba(248,243,244,0.98))] px-5 py-4 md:px-8 md:py-5">
              <div className="flex flex-col gap-3 md:flex-row">
                <button
                  type="button"
                  onClick={saveCustom}
                  className="min-h-12 flex-1 rounded-full bg-black px-5 text-[10px] font-semibold uppercase tracking-[0.22em] text-white shadow-[0_18px_40px_rgba(0,0,0,0.14)] md:min-h-14 md:px-6 md:text-[11px] md:tracking-[0.24em]"
                >
                  {"Salvar prefer\u00eancias"}
                </button>
                <button
                  type="button"
                  onClick={acceptAll}
                  className="min-h-12 flex-1 rounded-full border border-black/10 bg-white px-5 text-[10px] font-semibold uppercase tracking-[0.22em] text-[#1c1b1b] md:min-h-14 md:px-6 md:text-[11px] md:tracking-[0.24em]"
                >
                  Aceitar todos
                </button>
                <button
                  type="button"
                  onClick={rejectNonEssential}
                  className="min-h-12 flex-1 rounded-full border border-[#d7c3c6] bg-[#fff6f7] px-5 text-[10px] font-semibold uppercase tracking-[0.22em] text-[#8c5d66] md:min-h-14 md:px-6 md:text-[11px] md:tracking-[0.24em]"
                >
                  {"Recusar n\u00e3o essenciais"}
                </button>
              </div>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
};
