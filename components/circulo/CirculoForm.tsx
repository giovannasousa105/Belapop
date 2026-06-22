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
  consent_skin_data: boolean;
  consent_marketing: boolean;
  declared_over_18: boolean;
}): Record<string, string> {
  const errors: Record<string, string> = {};
  if (fields.name.trim().length < 2) errors.name = "Nome deve ter pelo menos 2 caracteres.";
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(fields.email.trim())) errors.email = "Informe um e-mail válido.";
  const digits = fields.whatsapp.replace(/\D/g, "");
  if (digits.length < 10 || digits.length > 11) errors.whatsapp = "Número de WhatsApp inválido.";
  if (!fields.skin_concern) errors.skin_concern = "Selecione sua principal preocupação.";
  if (!fields.spend_range) errors.spend_range = "Selecione uma faixa de investimento.";
  if (!fields.consent_skin_data) errors.consent_skin_data = "Autorize o uso dos dados de pele para a curadoria.";
  if (!fields.consent_marketing) errors.consent_marketing = "Aceite receber comunicações do Círculo por WhatsApp e e-mail.";
  if (!fields.declared_over_18) errors.declared_over_18 = "Confirme que você tem 18 anos ou mais.";
  return errors;
}

// ── Checkbox customizado com visual explícito (não depende do browser renderer) ──

interface CustomCheckboxProps {
  id: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  label: React.ReactNode;
  isLight: boolean;
  required?: boolean;
  "aria-describedby"?: string;
  "aria-invalid"?: boolean;
}

function CustomCheckbox({
  id,
  checked,
  onChange,
  label,
  isLight,
  required,
  "aria-describedby": ariaDescribedBy,
  "aria-invalid": ariaInvalid,
}: CustomCheckboxProps) {
  return (
    <div className="flex items-start gap-3">
      <input
        type="checkbox"
        id={id}
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        required={required}
        aria-describedby={ariaDescribedBy}
        aria-invalid={ariaInvalid}
        className="sr-only"
      />
      <label htmlFor={id} className="flex shrink-0 cursor-pointer items-start pt-0.5" aria-hidden="true">
        <span
          className={`flex h-5 w-5 items-center justify-center rounded border-2 transition-all duration-150 ${
            checked
              ? "border-bpPink bg-bpPink"
              : isLight
              ? "border-neutral-300 bg-white hover:border-bpPink/50"
              : "border-white/20 bg-white/5 hover:border-white/40"
          }`}
        >
          <svg
            className={`h-3 w-3 text-white transition-opacity duration-100 ${checked ? "opacity-100" : "opacity-0"}`}
            viewBox="0 0 12 12"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <polyline points="1.5,6 4.5,9 10.5,3" />
          </svg>
        </span>
      </label>
      <label
        htmlFor={id}
        className={`cursor-pointer text-xs leading-relaxed transition-colors duration-150 ${
          isLight
            ? checked ? "text-bpGraphite/90" : "text-bpGraphite/70"
            : checked ? "text-bpPinkSoft/90" : "text-bpPinkSoft/60"
        }`}
      >
        {label}
      </label>
    </div>
  );
}

// ── Pill de opção (radio como pill) — fora do componente para evitar remount ──

interface PillProps<T extends string> {
  fieldName: string;
  value: T;
  current: T | "";
  onChange: (v: T) => void;
  label: string;
  isLight: boolean;
}

function Pill<T extends string>({ fieldName, value, current, onChange, label, isLight }: PillProps<T>) {
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
        onChange={() => onChange(value)}
        className="sr-only"
      />
      {label}
    </label>
  );
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
  const [consentSkinData, setConsentSkinData] = useState(false);
  const [consentMarketing, setConsentMarketing] = useState(false);
  const [declaredOver18, setDeclaredOver18] = useState(false);

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [protocolo, setProtocolo] = useState<string | null>(null);
  const [subgroup, setSubgroup] = useState<{ url: string | null; label: string } | null>(null);
  const [serverError, setServerError] = useState<string | null>(null);

  const clearError = (field: string) => {
    if (errors[field]) setErrors((prev) => { const n = { ...prev }; delete n[field]; return n; });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setServerError(null);

    const validation = validateForm({
      name,
      email,
      whatsapp,
      skin_concern: skinConcern,
      spend_range: spendRange,
      consent_skin_data: consentSkinData,
      consent_marketing: consentMarketing,
      declared_over_18: declaredOver18,
    });
    if (Object.keys(validation).length > 0) {
      setErrors(validation);
      const first = Object.keys(validation)[0];
      const focusIds: Record<string, string> = {
        consent_skin_data: `${uid}-consent-skin-data`,
        consent_marketing: `${uid}-consent`,
        declared_over_18: `${uid}-age`,
      };
      if (first) document.getElementById(focusIds[first] ?? `${uid}-${first}`)?.focus();
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
          consent_skin_data: consentSkinData,
          consent_marketing: consentMarketing,
          consent_terms: consentMarketing,
          declared_over_18: declaredOver18,
          source,
        }),
      });

      const data = (await res.json()) as {
        error?: string;
        message?: string;
        protocolo?: string;
        subgroup?: { url: string | null; label: string };
      };

      if (!res.ok) {
        setServerError(data.error ?? "Não foi possível concluir a inscrição. Tente novamente.");
        return;
      }

      if (data.protocolo) setProtocolo(data.protocolo);
      if (data.subgroup) setSubgroup(data.subgroup);
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
        <p className="mb-4 text-4xl">✦</p>
        <p className={`text-lg font-semibold ${isLight ? "text-bpBlack" : "text-bpOffWhite"}`}
          style={{ fontFamily: "var(--font-playfair, serif)" }}>
          Você está no Círculo.
        </p>
        <p className={`mt-2 text-sm leading-relaxed ${isLight ? "text-bpGraphite/70" : "text-bpPinkSoft/60"}`}>
          Confirmação enviada para <strong>{email}</strong>.<br />
          O próximo drop chega no seu WhatsApp em até 14 dias.
        </p>

        {subgroup?.url ? (
          <a
            href={subgroup.url}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-5 inline-flex items-center justify-center gap-2 rounded-full bg-[#25D366] px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-[#1ebe5b]"
          >
            Entrar no grupo de {subgroup.label} no WhatsApp
          </a>
        ) : (
          <p className={`mt-4 text-xs leading-relaxed ${isLight ? "text-bpGraphite/60" : "text-bpPinkSoft/50"}`}>
            Em até 48h, alguém do time BelaPop vai te chamar no WhatsApp para te indicar o grupo certo dentro da Comunidade.
          </p>
        )}

        <p className={`mt-3 text-[11px] ${isLight ? "text-bpGraphite/50" : "text-bpPinkSoft/40"}`}>
          O link também foi enviado para o seu e-mail.
        </p>

        {protocolo && (
          <p className={`mt-4 text-[10px] uppercase tracking-[0.14em] ${isLight ? "text-bpGraphite/40" : "text-bpPinkSoft/30"}`}>
            Protocolo: #{protocolo}
          </p>
        )}
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
          aria-describedby={errors.skin_concern ? `${uid}-skin_concern-error` : undefined}
        >
          {SKIN_CONCERNS.map((opt) => (
            <Pill
              key={opt.value}
              fieldName="skin_concern"
              value={opt.value}
              current={skinConcern}
              onChange={(v) => { setSkinConcern(v); clearError("skin_concern"); }}
              label={opt.label}
              isLight={isLight}
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
          aria-describedby={errors.spend_range ? `${uid}-spend_range-error` : undefined}
        >
          {SPEND_RANGES.map((opt) => (
            <Pill
              key={opt.value}
              fieldName="spend_range"
              value={opt.value}
              current={spendRange}
              onChange={(v) => { setSpendRange(v); clearError("spend_range"); }}
              label={opt.label}
              isLight={isLight}
            />
          ))}
        </div>
        {errorMsg("spend_range")}
      </fieldset>

      {/* Consentimentos LGPD */}
      <div className="space-y-4">
        <CustomCheckbox
          id={`${uid}-consent-skin-data`}
          checked={consentSkinData}
          onChange={(v) => { setConsentSkinData(v); clearError("consent_skin_data"); }}
          isLight={isLight}
          aria-invalid={!!errors.consent_skin_data}
          aria-describedby={errors.consent_skin_data ? `${uid}-consent_skin_data-error` : undefined}
          label="Autorizo o uso da minha preocupação de pele e preferências de skincare apenas para personalizar a curadoria do Círculo BelaPop."
        />
        {errorMsg("consent_skin_data")}

        <CustomCheckbox
          id={`${uid}-age`}
          checked={declaredOver18}
          onChange={(v) => { setDeclaredOver18(v); clearError("declared_over_18"); }}
          isLight={isLight}
          required
          aria-invalid={!!errors.declared_over_18}
          aria-describedby={errors.declared_over_18 ? `${uid}-declared_over_18-error` : undefined}
          label="Declaro que tenho 18 anos ou mais."
        />
        {errorMsg("declared_over_18")}

        <CustomCheckbox
          id={`${uid}-consent`}
          checked={consentMarketing}
          onChange={(v) => { setConsentMarketing(v); clearError("consent_marketing"); }}
          isLight={isLight}
          aria-invalid={!!errors.consent_marketing}
          aria-describedby={errors.consent_marketing ? `${uid}-consent_marketing-error` : undefined}
          label={
            <>
              Aceito receber drops e comunicações do Círculo BelaPop por e-mail e WhatsApp. Li e concordo com o{" "}
              <Link href="/aviso-de-privacidade" className="underline hover:text-bpPink" target="_blank" onClick={(e) => e.stopPropagation()}>
                Aviso de Privacidade
              </Link>{" "}
              e com os{" "}
              <Link href="/termos-de-uso" className="underline hover:text-bpPink" target="_blank" onClick={(e) => e.stopPropagation()}>
                Termos de Uso
              </Link>
              .
            </>
          }
        />
        {errorMsg("consent_marketing")}
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
