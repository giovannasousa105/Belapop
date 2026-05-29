"use client";

import { useState, useId } from "react";
import Link from "next/link";

// ── Tipos e constantes ────────────────────────────────────────────────────────

type SkinConcern = "acne" | "spots" | "barrier" | "aging" | "shine" | "unsure";
type SpendRange = "lt150" | "150_300" | "300_600" | "gt600";

const SKIN_CONCERNS: { value: SkinConcern; label: string }[] = [
  { value: "acne",    label: "Acne" },
  { value: "spots",   label: "Manchas e tom desigual" },
  { value: "barrier", label: "Barreira sensibilizada" },
  { value: "aging",   label: "Linhas finas e firmeza" },
  { value: "shine",   label: "Brilho e poros" },
  { value: "unsure",  label: "Não sei ainda" },
];

const SPEND_RANGES: { value: SpendRange; label: string }[] = [
  { value: "lt150",   label: "Até R$ 150" },
  { value: "150_300", label: "R$ 150–300" },
  { value: "300_600", label: "R$ 300–600" },
  { value: "gt600",   label: "Acima de R$ 600" },
];

// ── Máscara de WhatsApp ───────────────────────────────────────────────────────

function maskWhatsapp(value: string): string {
  const digits = value.replace(/\D/g, "").slice(0, 11);
  if (digits.length <= 2) return digits.length ? `(${digits}` : "";
  if (digits.length <= 7) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
  return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
}

// ── Validações ────────────────────────────────────────────────────────────────

function validateForm(fields: {
  name: string;
  email: string;
  whatsapp: string;
  skin_concern: SkinConcern | "";
  spend_range: SpendRange | "";
}): Record<string, string> {
  const errors: Record<string, string> = {};
  if (fields.name.trim().length < 2) errors.name = "Nome deve ter pelo menos 2 caracteres.";
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(fields.email.trim())) errors.email = "Informe um e-mail válido.";
  const digits = fields.whatsapp.replace(/\D/g, "");
  if (digits.length < 10 || digits.length > 11) errors.whatsapp = "Número de WhatsApp inválido.";
  if (!fields.skin_concern) errors.skin_concern = "Selecione sua principal preocupação.";
  if (!fields.spend_range) errors.spend_range = "Selecione uma faixa de investimento.";
  return errors;
}

// ── Componente principal ──────────────────────────────────────────────────────

export type CirculoFormProps = {
  tone?: "light" | "dark";
  source?: string;
};

export function CirculoForm({ tone = "light", source = "website_footer_form" }: CirculoFormProps) {
  const uid = useId();
  const isLight = tone === "light";

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [skinConcern, setSkinConcern] = useState<SkinConcern | "">("");
  const [spendRange, setSpendRange] = useState<SpendRange | "">("");
  const [consentMarketing, setConsentMarketing] = useState(true);

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

  const clearError = (field: string) => {
    if (errors[field]) setErrors((prev) => { const n = { ...prev }; delete n[field]; return n; });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setServerError(null);

    const validation = validateForm({ name, email, whatsapp, skin_concern: skinConcern, spend_range: spendRange });
    if (Object.keys(validation).length > 0) {
      setErrors(validation);
      const first = Object.keys(validation)[0];
      if (first) document.getElementById(`${uid}-${first}`)?.focus();
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch("/api/circulo/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          email: email.trim().toLowerCase(),
          whatsapp,
          skin_concern: skinConcern,
          spend_range: spendRange,
          consent_marketing: consentMarketing,
          source,
        }),
      });

      const data = (await res.json()) as { error?: string; message?: string };

      if (!res.ok) {
        setServerError(data.error ?? "Não foi possível concluir a inscrição. Tente novamente.");
        return;
      }

      setSuccess(true);
    } catch {
      setServerError("Erro de conexão. Verifique sua internet e tente novamente.");
    } finally {
      setSubmitting(false);
    }
  };

  // ── Estado de sucesso ────────────────────────────────────────────────────────
  if (success) {
    return (
      <div
        className={`rounded-xl border p-8 text-center ${
          isLight ? "border-neutral-200 bg-white" : "border-white/10 bg-white/5"
        }`}
      >
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-black text-white text-xl">
          ✓
        </div>
        <p className={`text-sm font-semibold ${isLight ? "text-bpBlack" : "text-bpOffWhite"}`}>
          Você está no Círculo.
        </p>
        <p className={`mt-2 text-xs leading-relaxed ${isLight ? "text-bpGraphite/70" : "text-bpPinkSoft/60"}`}>
          O próximo drop chega no seu WhatsApp em até 14 dias.
        </p>
      </div>
    );
  }

  // ── Input helpers ────────────────────────────────────────────────────────────
  const inputClass = (field: string) =>
    `block w-full rounded-lg border px-4 py-3 text-sm outline-none transition-colors focus-visible:ring-2 ${
      errors[field]
        ? "border-red-400 bg-red-50 focus-visible:border-red-400 focus-visible:ring-red-200"
        : isLight
        ? "border-neutral-200 bg-white text-bpBlack placeholder:text-bpGraphite/50 focus-visible:border-bpPink/60 focus-visible:ring-bpPink/20"
        : "border-white/10 bg-white/5 text-bpOffWhite placeholder:text-bpPinkSoft/40 focus-visible:border-bpPink/50 focus-visible:ring-bpPink/20"
    }`;

  const labelClass = `mb-1.5 block text-[11px] font-semibold uppercase tracking-[0.08em] ${
    isLight ? "text-bpGraphite/60" : "text-bpPinkSoft/60"
  }`;

  const errorMsg = (field: string) =>
    errors[field] ? (
      <p id={`${uid}-${field}-error`} role="alert" className="mt-1 text-[11px] text-red-600">
        {errors[field]}
      </p>
    ) : null;

  // ── Pill de opção (radio como pill) ────────────────────────────────────────
  function Pill<T extends string>({
    name: fieldName,
    value,
    current,
    onChange,
    label,
  }: {
    name: string;
    value: T;
    current: T | "";
    onChange: (v: T) => void;
    label: string;
  }) {
    const checked = current === value;
    return (
      <label
        className={`cursor-pointer rounded-full border px-3 py-1.5 text-[11px] font-medium transition-all ${
          checked
            ? "border-black bg-black text-white"
            : isLight
            ? "border-neutral-200 bg-white text-bpGraphite hover:border-neutral-400"
            : "border-white/10 bg-white/5 text-bpPinkSoft/70 hover:border-white/25"
        }`}
      >
        <input
          type="radio"
          name={fieldName}
          value={value}
          checked={checked}
          onChange={() => { onChange(value); clearError(fieldName); }}
          className="sr-only"
        />
        {label}
      </label>
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      noValidate
      aria-label="Inscrição no Círculo BelaPop"
      className={`space-y-5 rounded-xl border p-6 sm:p-8 ${
        isLight ? "border-neutral-200 bg-white shadow-sm" : "border-white/10 bg-white/5"
      }`}
    >
      {/* Cabeçalho */}
      <div className="space-y-1">
        <h3 className={`font-display text-xl leading-tight ${isLight ? "text-bpBlack" : "text-bpOffWhite"}`}>
          Entre para o Círculo BelaPop
        </h3>
        <p className={`text-xs leading-relaxed ${isLight ? "text-bpGraphite/70" : "text-bpPinkSoft/60"}`}>
          Receba drops exclusivos de skincare coreano diretamente no seu WhatsApp.
        </p>
      </div>

      {/* Linha 1: Nome + E-mail */}
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor={`${uid}-name`} className={labelClass}>Nome</label>
          <input
            id={`${uid}-name`}
            type="text"
            autoComplete="name"
            placeholder="Seu nome"
            value={name}
            onChange={(e) => { setName(e.target.value); clearError("name"); }}
            aria-required="true"
            aria-invalid={!!errors.name}
            aria-describedby={errors.name ? `${uid}-name-error` : undefined}
            className={inputClass("name")}
          />
          {errorMsg("name")}
        </div>
        <div>
          <label htmlFor={`${uid}-email`} className={labelClass}>E-mail</label>
          <input
            id={`${uid}-email`}
            type="email"
            inputMode="email"
            autoComplete="email"
            placeholder="seu@email.com"
            value={email}
            onChange={(e) => { setEmail(e.target.value); clearError("email"); }}
            aria-required="true"
            aria-invalid={!!errors.email}
            aria-describedby={errors.email ? `${uid}-email-error` : undefined}
            className={inputClass("email")}
          />
          {errorMsg("email")}
        </div>
      </div>

      {/* Linha 2: WhatsApp */}
      <div>
        <label htmlFor={`${uid}-whatsapp`} className={labelClass}>WhatsApp</label>
        <input
          id={`${uid}-whatsapp`}
          type="tel"
          inputMode="tel"
          autoComplete="tel"
          placeholder="(11) 99999-9999"
          value={whatsapp}
          onChange={(e) => {
            setWhatsapp(maskWhatsapp(e.target.value));
            clearError("whatsapp");
          }}
          maxLength={16}
          aria-required="true"
          aria-invalid={!!errors.whatsapp}
          aria-describedby={errors.whatsapp ? `${uid}-whatsapp-error` : undefined}
          className={inputClass("whatsapp")}
        />
        {errorMsg("whatsapp")}
      </div>

      {/* Linha 3: Principal preocupação */}
      <fieldset>
        <legend className={labelClass}>Principal preocupação com a pele</legend>
        <div
          className="mt-2 flex flex-wrap gap-2"
          role="group"
          aria-required="true"
          aria-invalid={!!errors.skin_concern}
          aria-describedby={errors.skin_concern ? `${uid}-skin_concern-error` : undefined}
        >
          {SKIN_CONCERNS.map((opt) => (
            <Pill
              key={opt.value}
              name="skin_concern"
              value={opt.value}
              current={skinConcern}
              onChange={(v) => setSkinConcern(v)}
              label={opt.label}
            />
          ))}
        </div>
        {errorMsg("skin_concern")}
      </fieldset>

      {/* Linha 4: Faixa de investimento */}
      <fieldset>
        <legend className={labelClass}>Investimento mensal com skincare</legend>
        <div
          className="mt-2 flex flex-wrap gap-2"
          role="group"
          aria-required="true"
          aria-invalid={!!errors.spend_range}
          aria-describedby={errors.spend_range ? `${uid}-spend_range-error` : undefined}
        >
          {SPEND_RANGES.map((opt) => (
            <Pill
              key={opt.value}
              name="spend_range"
              value={opt.value}
              current={spendRange}
              onChange={(v) => setSpendRange(v)}
              label={opt.label}
            />
          ))}
        </div>
        {errorMsg("spend_range")}
      </fieldset>

      {/* Consentimento LGPD */}
      <div className="flex items-start gap-3">
        <input
          id={`${uid}-consent`}
          type="checkbox"
          checked={consentMarketing}
          onChange={(e) => setConsentMarketing(e.target.checked)}
          className="mt-0.5 h-4 w-4 shrink-0 cursor-pointer accent-bpPink"
        />
        <label
          htmlFor={`${uid}-consent`}
          className={`cursor-pointer text-xs leading-relaxed ${isLight ? "text-bpGraphite/70" : "text-bpPinkSoft/60"}`}
        >
          Aceito receber drops e comunicações do Círculo BelaPop por e-mail e WhatsApp. Li e concordo com a{" "}
          <Link
            href="/aviso-de-privacidade"
            className="underline hover:text-bpPink"
            target="_blank"
            onClick={(e) => e.stopPropagation()}
          >
            Política de Privacidade
          </Link>
          .
        </label>
      </div>

      {/* Erro do servidor */}
      {serverError && (
        <p role="alert" aria-live="assertive" className="rounded-lg bg-red-50 px-4 py-3 text-xs text-red-700">
          {serverError}
        </p>
      )}

      {/* Submit */}
      <button
        type="submit"
        disabled={submitting}
        className="w-full rounded-full bg-bpBlack py-3.5 text-sm font-semibold tracking-wider text-white transition-all hover:bg-neutral-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-bpPink/50 disabled:opacity-60"
      >
        {submitting ? (
          <span className="flex items-center justify-center gap-2">
            <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
            Confirmando...
          </span>
        ) : (
          "Entrar no Círculo"
        )}
      </button>

      <p className={`text-center text-[10px] ${isLight ? "text-bpGraphite/40" : "text-bpPinkSoft/30"}`}>
        Você pode cancelar a inscrição a qualquer momento pelo link no e-mail.
      </p>
    </form>
  );
}
