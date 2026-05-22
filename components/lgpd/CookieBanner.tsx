"use client";

import { useEffect, useState } from "react";

interface ConsentimentoState {
  analytics: boolean;
  marketing: boolean;
}

export function CookieBanner() {
  const [visivel,   setVisivel]   = useState(false);
  const [expandido, setExpandido] = useState(false);
  const [salvando,  setSalvando]  = useState(false);
  const [prefs,     setPrefs]     = useState<ConsentimentoState>({
    analytics: false,
    marketing: false,
  });

  useEffect(() => {
    const respondeu = localStorage.getItem("bp_cookie_consent");
    if (!respondeu) setVisivel(true);
  }, []);

  async function salvar(aceitar_todos: boolean) {
    if (salvando) return;
    setSalvando(true);

    const escolha: ConsentimentoState = aceitar_todos
      ? { analytics: true, marketing: true }
      : prefs;

    // Persiste escolha localmente
    localStorage.setItem("bp_cookie_consent", JSON.stringify({
      ...escolha,
      data: new Date().toISOString(),
    }));

    // Registra no banco para auditoria LGPD (fire-and-forget — não bloquear UI)
    void fetch("/api/lgpd/consentimento", {
      method:  "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        tipos: [
          escolha.analytics && "COOKIES_ANALYTICS",
          escolha.marketing && "COOKIES_MARKETING",
        ].filter(Boolean),
        acao: "CONCEDIDO",
      }),
    }).catch(() => {
      // Falha de rede não impede a escolha do usuário
    });

    setVisivel(false);
    setSalvando(false);

    // Notifica módulos de analytics que o consentimento foi dado
    if (escolha.analytics) {
      window.dispatchEvent(new Event("analytics_consent_given"));
    }
  }

  if (!visivel) return null;

  return (
    // position: fixed — exceção explícita ao padrão do design system.
    // Overlay de consentimento LGPD exige posição fixa para cobrir o conteúdo.
    <div
      role="dialog"
      aria-label="Aviso de cookies"
      aria-modal="false"
      style={{
        position:      "fixed",
        bottom:        0,
        left:          0,
        right:         0,
        padding:       "16px 16px",
        paddingBottom: "calc(16px + env(safe-area-inset-bottom, 0px))",
        background:    "var(--color-background-primary, #FAF8F5)",
        borderTop:     "0.5px solid var(--color-border-tertiary, rgba(17,17,16,0.08))",
        zIndex:        9999,
        boxShadow:     "0 -2px 12px rgba(17,17,16,0.06)",
      }}
    >
      <p style={{ fontSize: 13, color: "var(--color-text-secondary)", margin: "0 0 12px", lineHeight: 1.5 }}>
        Usamos cookies essenciais para o funcionamento do site e, com seu consentimento,
        cookies de analytics.{" "}
        <button
          type="button"
          onClick={() => setExpandido((v) => !v)}
          style={{
            textDecoration: "underline",
            background:     "none",
            border:         "none",
            cursor:         "pointer",
            fontSize:       13,
            color:          "var(--color-text-secondary)",
            padding:        0,
          }}
        >
          {expandido ? "Ver menos" : "Gerenciar preferências"}
        </button>
      </p>

      {expandido && (
        <div style={{ marginBottom: 12, display: "flex", flexDirection: "column", gap: 8 }}>
          <label style={{ display: "flex", alignItems: "flex-start", gap: 8, fontSize: 13, cursor: "default" }}>
            <input type="checkbox" checked disabled readOnly style={{ marginTop: 2, flexShrink: 0 }} />
            <span>
              <strong>Essenciais</strong> — obrigatórios para o site funcionar (autenticação, carrinho, checkout)
            </span>
          </label>
          <label style={{ display: "flex", alignItems: "flex-start", gap: 8, fontSize: 13, cursor: "pointer" }}>
            <input
              type="checkbox"
              checked={prefs.analytics}
              onChange={(e) => setPrefs((p) => ({ ...p, analytics: e.target.checked }))}
              style={{ marginTop: 2, flexShrink: 0 }}
            />
            <span>
              <strong>Analytics</strong> — nos ajudam a entender como o site é usado e melhorá-lo
            </span>
          </label>
          <label style={{ display: "flex", alignItems: "flex-start", gap: 8, fontSize: 13, cursor: "pointer" }}>
            <input
              type="checkbox"
              checked={prefs.marketing}
              onChange={(e) => setPrefs((p) => ({ ...p, marketing: e.target.checked }))}
              style={{ marginTop: 2, flexShrink: 0 }}
            />
            <span>
              <strong>Marketing</strong> — comunicações e anúncios personalizados
            </span>
          </label>
        </div>
      )}

      <div style={{ display: "flex", gap: 8 }}>
        <button
          type="button"
          onClick={() => void salvar(true)}
          disabled={salvando}
          style={{
            flex:          1,
            height:        44,
            background:    "var(--color-action-primary, #111110)",
            color:         "var(--color-action-primary-text, #FDFCFB)",
            border:        "none",
            borderRadius:  "var(--radius-sm, 4px)",
            fontSize:      12,
            fontWeight:    500,
            cursor:        "pointer",
            letterSpacing: "0.06em",
            textTransform: "uppercase",
          }}
        >
          Aceitar todos
        </button>
        <button
          type="button"
          onClick={() => void salvar(false)}
          disabled={salvando}
          style={{
            flex:          1,
            height:        44,
            background:    "transparent",
            color:         "var(--color-text-primary, #111110)",
            border:        "0.5px solid var(--color-border-primary, #D4D3CE)",
            borderRadius:  "var(--radius-sm, 4px)",
            fontSize:      12,
            fontWeight:    500,
            cursor:        "pointer",
            letterSpacing: "0.06em",
            textTransform: "uppercase",
          }}
        >
          {expandido ? "Salvar escolha" : "Apenas essenciais"}
        </button>
      </div>

      <p style={{ fontSize: 11, color: "var(--color-text-hint)", margin: "10px 0 0", textAlign: "center" }}>
        Saiba mais em nossa{" "}
        <a
          href="/aviso-de-privacidade"
          style={{ color: "var(--color-text-secondary)", textDecoration: "underline" }}
        >
          Política de Privacidade
        </a>
      </p>
    </div>
  );
}
