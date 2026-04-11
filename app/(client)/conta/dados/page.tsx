"use client";

import { useEffect, useMemo, useState } from "react";

import { useAuth } from "@/lib/AuthContext";
import { hasMinTwoWords } from "@/lib/api/v1/validators";
import {
  getCustomerMe,
  patchCustomerMe,
  putCustomerNotificationPreferences
} from "@/lib/customer/api";

const onlyDigits = (value: string) => value.replace(/\D/g, "");

const cpfMask = (value: string) => {
  const digits = onlyDigits(value).slice(0, 11);
  return digits
    .replace(/^(\d{3})(\d)/, "$1.$2")
    .replace(/^(\d{3})\.(\d{3})(\d)/, "$1.$2.$3")
    .replace(/\.(\d{3})(\d)/, ".$1-$2");
};

const phoneMask = (value: string) => {
  const digits = onlyDigits(value).slice(0, 11);
  if (digits.length <= 10) {
    return digits.replace(/^(\d{2})(\d)/, "($1) $2").replace(/(\d{4})(\d)/, "$1-$2");
  }
  return digits.replace(/^(\d{2})(\d)/, "($1) $2").replace(/(\d{5})(\d)/, "$1-$2");
};

const isValidCpf = (value: string) => {
  const digits = onlyDigits(value);
  if (digits.length !== 11) return false;
  if (/^(\d)\1{10}$/.test(digits)) return false;

  const calc = (factor: number) => {
    let total = 0;
    for (const char of digits.slice(0, factor - 1)) {
      total += Number(char) * factor--;
    }
    const rest = (total * 10) % 11;
    return rest === 10 ? 0 : rest;
  };

  return calc(10) === Number(digits[9]) && calc(11) === Number(digits[10]);
};

export default function ContaDadosPage() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [emailVerified, setEmailVerified] = useState(false);

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [cpf, setCpf] = useState("");
  const [phone, setPhone] = useState("");
  const [birthDate, setBirthDate] = useState("");
  const [emailOptIn, setEmailOptIn] = useState(true);
  const [whatsappOptIn, setWhatsappOptIn] = useState(false);
  const [marketingOptIn, setMarketingOptIn] = useState(false);

  useEffect(() => {
    if (!user) return;
    let active = true;
    setLoading(true);

    const load = async () => {
      try {
        const profile = await getCustomerMe();

        if (!active) return;

        setFullName(profile.full_name ?? user.name ?? "");
        setEmail(profile.email ?? user.email ?? "");
        setCpf(profile.cpf ? cpfMask(profile.cpf) : "");
        setPhone(profile.phone ? phoneMask(profile.phone) : "");
        setBirthDate(profile.birth_date ?? "");
        setEmailOptIn(Boolean(profile.preferences.order_updates.email));
        setWhatsappOptIn(Boolean(profile.preferences.order_updates.whatsapp));
        setMarketingOptIn(Boolean(profile.preferences.marketing.email));
        setEmailVerified(Boolean(profile.email_verified));
      } catch (error) {
        if (active) {
          setMessage(error instanceof Error ? error.message : "Nao foi possivel carregar seus dados.");
        }
      } finally {
        if (active) setLoading(false);
      }
    };

    void load();

    return () => {
      active = false;
    };
  }, [user]);

  const profileComplete = useMemo(() => {
    return Boolean(fullName.trim() && onlyDigits(cpf).length === 11 && onlyDigits(phone).length >= 10);
  }, [cpf, fullName, phone]);

  const handleSave = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!user) return;

    const cpfDigits = onlyDigits(cpf);
    const phoneDigits = onlyDigits(phone);

    if (!fullName.trim()) {
      setMessage("Informe seu nome completo.");
      return;
    }
    if (!hasMinTwoWords(fullName)) {
      setMessage("Informe nome e sobrenome.");
      return;
    }
    if (cpfDigits.length !== 11 || !isValidCpf(cpfDigits)) {
      setMessage("Informe um CPF valido.");
      return;
    }
    if (phoneDigits.length < 10) {
      setMessage("Informe um telefone valido.");
      return;
    }

    setSaving(true);
    setMessage(null);
    try {
      await Promise.all([
        patchCustomerMe({
          full_name: fullName.trim(),
          cpf: cpfDigits,
          phone: phoneDigits,
          birth_date: birthDate || null,
          marketing_opt_in: marketingOptIn
        }),
        putCustomerNotificationPreferences({
          order_updates: {
            email: emailOptIn,
            whatsapp: whatsappOptIn
          },
          support_updates: {
            email: emailOptIn,
            whatsapp: whatsappOptIn
          },
          marketing: {
            email: marketingOptIn,
            whatsapp: marketingOptIn
          },
          push: false
        })
      ]);
      setMessage("Dados atualizados com sucesso.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Nao foi possivel salvar.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6 pb-8">
      <section className="rounded-3xl border border-black/10 bg-white p-6 shadow-sm">
        <p className="text-xs uppercase tracking-[0.3em] text-bpGraphite/60">Meus dados</p>
        <h1 className="mt-3 font-display text-4xl text-bpBlack">Perfil e verificacoes</h1>
        <p className="mt-3 text-sm text-bpGraphite/75">
          Nome, CPF e telefone sao usados para checkout, fiscal e comunicacao transacional.
        </p>

        {!profileComplete ? (
          <div className="mt-5 rounded-2xl border border-bpPink/35 bg-bpPink/10 p-4 text-sm text-bpBlackSoft">
            Complete seu perfil para liberar rastreio completo e nota fiscal sem bloqueios.
          </div>
        ) : null}
      </section>

      <section className="rounded-3xl border border-black/10 bg-white p-6 shadow-sm">
        {loading ? (
          <p className="text-sm text-bpGraphite/70">Carregando dados...</p>
        ) : (
          <form onSubmit={handleSave} className="space-y-4">
            <div className="grid gap-3 md:grid-cols-2">
              <label className="space-y-2 text-sm text-bpGraphite/75">
                <span>Nome completo</span>
                <input
                  value={fullName}
                  onChange={(event) => setFullName(event.target.value)}
                  className="h-11 w-full rounded-2xl border border-black/10 bg-white px-4 text-sm"
                />
              </label>

              <label className="space-y-2 text-sm text-bpGraphite/75">
                <span>E-mail</span>
                <input
                  value={email}
                  readOnly
                  className="h-11 w-full rounded-2xl border border-black/10 bg-bpOffWhite px-4 text-sm text-bpGraphite/70"
                />
              </label>

              <label className="space-y-2 text-sm text-bpGraphite/75">
                <span>CPF</span>
                <input
                  value={cpf}
                  onChange={(event) => setCpf(cpfMask(event.target.value))}
                  placeholder="000.000.000-00"
                  className="h-11 w-full rounded-2xl border border-black/10 bg-white px-4 text-sm"
                />
              </label>

              <label className="space-y-2 text-sm text-bpGraphite/75">
                <span>Telefone (WhatsApp)</span>
                <input
                  value={phone}
                  onChange={(event) => setPhone(phoneMask(event.target.value))}
                  placeholder="(00) 00000-0000"
                  className="h-11 w-full rounded-2xl border border-black/10 bg-white px-4 text-sm"
                />
              </label>

              <label className="space-y-2 text-sm text-bpGraphite/75 md:col-span-2">
                <span>Data de nascimento (opcional)</span>
                <input
                  type="date"
                  value={birthDate}
                  onChange={(event) => setBirthDate(event.target.value)}
                  className="h-11 w-full rounded-2xl border border-black/10 bg-white px-4 text-sm md:max-w-[280px]"
                />
              </label>
            </div>

            <div className="grid gap-3 md:grid-cols-2">
              <label className="flex items-center justify-between rounded-2xl border border-black/10 px-4 py-3 text-sm">
                <span>Receber updates por e-mail</span>
                <input
                  type="checkbox"
                  checked={emailOptIn}
                  onChange={(event) => setEmailOptIn(event.target.checked)}
                  className="h-4 w-4 accent-[#C2185B]"
                />
              </label>
              <label className="flex items-center justify-between rounded-2xl border border-black/10 px-4 py-3 text-sm">
                <span>Receber updates por WhatsApp</span>
                <input
                  type="checkbox"
                  checked={whatsappOptIn}
                  onChange={(event) => setWhatsappOptIn(event.target.checked)}
                  className="h-4 w-4 accent-[#C2185B]"
                />
              </label>
              <label className="flex items-center justify-between rounded-2xl border border-black/10 px-4 py-3 text-sm md:col-span-2">
                <span>Receber promocoes e ofertas</span>
                <input
                  type="checkbox"
                  checked={marketingOptIn}
                  onChange={(event) => setMarketingOptIn(event.target.checked)}
                  className="h-4 w-4 accent-[#C2185B]"
                />
              </label>
            </div>

            <div className="flex flex-wrap items-center gap-2 text-xs">
              <span
                className={`rounded-full border px-3 py-1 uppercase tracking-[0.18em] ${
                  emailVerified ? "border-emerald-200 bg-emerald-50 text-emerald-700" : "border-amber-200 bg-amber-50 text-amber-800"
                }`}
              >
                E-mail {emailVerified ? "verificado" : "pendente"}
              </span>
              <span
                className={`rounded-full border px-3 py-1 uppercase tracking-[0.18em] ${
                  onlyDigits(phone).length >= 10
                    ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                    : "border-amber-200 bg-amber-50 text-amber-800"
                }`}
              >
                WhatsApp {onlyDigits(phone).length >= 10 ? "informado" : "pendente"}
              </span>
            </div>

            <button
              type="submit"
              disabled={saving}
              className="rounded-full border border-bpPink/50 bg-bpPink px-6 py-3 text-xs uppercase tracking-[0.2em] text-white disabled:opacity-60"
            >
              {saving ? "Salvando..." : "Salvar dados"}
            </button>

            {message ? <p className="text-sm text-bpPink">{message}</p> : null}
          </form>
        )}
      </section>
    </div>
  );
}
