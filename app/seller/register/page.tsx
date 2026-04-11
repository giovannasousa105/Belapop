"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, type ChangeEvent, type FormEvent } from "react";

import { LuxuryButton } from "@/components/LuxuryButton";
import { useAuth } from "@/lib/AuthContext";

const BRAZIL_STATES = [
  "AC",
  "AL",
  "AP",
  "AM",
  "BA",
  "CE",
  "DF",
  "ES",
  "GO",
  "MA",
  "MT",
  "MS",
  "MG",
  "PA",
  "PB",
  "PR",
  "PE",
  "PI",
  "RJ",
  "RN",
  "RS",
  "RO",
  "RR",
  "SC",
  "SP",
  "SE",
  "TO"
];

type SellerRegisterForm = {
  fullName: string;
  email: string;
  companyName: string;
  cnpj: string;
  zip: string;
  street: string;
  number: string;
  complement: string;
  district: string;
  city: string;
  state: string;
  password: string;
  confirmPassword: string;
};

const INITIAL_FORM: SellerRegisterForm = {
  fullName: "",
  email: "",
  companyName: "",
  cnpj: "",
  zip: "",
  street: "",
  number: "",
  complement: "",
  district: "",
  city: "",
  state: "",
  password: "",
  confirmPassword: ""
};

const onlyDigits = (value: string) => value.replace(/\D/g, "");

const formatCnpj = (value: string) => {
  const digits = onlyDigits(value).slice(0, 14);
  if (digits.length <= 2) return digits;
  if (digits.length <= 5) return `${digits.slice(0, 2)}.${digits.slice(2)}`;
  if (digits.length <= 8) return `${digits.slice(0, 2)}.${digits.slice(2, 5)}.${digits.slice(5)}`;
  if (digits.length <= 12) {
    return `${digits.slice(0, 2)}.${digits.slice(2, 5)}.${digits.slice(5, 8)}/${digits.slice(8)}`;
  }
  return `${digits.slice(0, 2)}.${digits.slice(2, 5)}.${digits.slice(5, 8)}/${digits.slice(8, 12)}-${digits.slice(12)}`;
};

const formatZip = (value: string) => {
  const digits = onlyDigits(value).slice(0, 8);
  if (digits.length <= 5) return digits;
  return `${digits.slice(0, 5)}-${digits.slice(5)}`;
};

function FieldLabel({ children, required }: { children: string; required?: boolean }) {
  return (
    <label className="mb-1 block text-xs font-medium uppercase tracking-[0.2em] text-bpGraphite/75">
      {children}
      {required ? <span className="ml-1 text-bpPink">*</span> : null}
    </label>
  );
}

export default function SellerRegisterPage() {
  const router = useRouter();
  const { registerSeller } = useAuth();
  const [form, setForm] = useState<SellerRegisterForm>(INITIAL_FORM);
  const [message, setMessage] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const setField = (field: keyof SellerRegisterForm, value: string) => {
    setForm((current) => ({ ...current, [field]: value }));
  };

  const handleCnpjChange = (event: ChangeEvent<HTMLInputElement>) => {
    setField("cnpj", formatCnpj(event.target.value));
  };

  const handleZipChange = (event: ChangeEvent<HTMLInputElement>) => {
    setField("zip", formatZip(event.target.value));
  };

  const handleStateChange = (event: ChangeEvent<HTMLSelectElement>) => {
    setField("state", event.target.value.toUpperCase().slice(0, 2));
  };

  const validateForm = () => {
    const requiredFields = [
      form.fullName,
      form.email,
      form.companyName,
      form.cnpj,
      form.zip,
      form.street,
      form.number,
      form.district,
      form.city,
      form.state,
      form.password,
      form.confirmPassword
    ];

    if (requiredFields.some((value) => !value.trim())) {
      return "Preencha todos os campos obrigatorios.";
    }

    if (onlyDigits(form.cnpj).length !== 14) {
      return "CNPJ invalido. Use 14 digitos.";
    }

    if (onlyDigits(form.zip).length !== 8) {
      return "CEP invalido. Use 8 digitos.";
    }

    if (form.state.trim().length !== 2) {
      return "Selecione uma UF valida.";
    }

    if (form.password.length < 6) {
      return "Senha invalida. Use no minimo 6 caracteres.";
    }

    if (form.password !== form.confirmPassword) {
      return "As senhas nao conferem.";
    }

    return null;
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (submitting) return;
    setMessage(null);

    const validationError = validateForm();
    if (validationError) {
      setMessage(validationError);
      return;
    }

    setSubmitting(true);
    const result = await registerSeller(
      {
        storeName: form.companyName.trim(),
        responsibleName: form.fullName.trim(),
        contact: form.email.trim(),
        mainCategory: "",
        postalCode: onlyDigits(form.zip),
        cnpj: onlyDigits(form.cnpj),
        companyAddress: {
          postalCode: onlyDigits(form.zip),
          street: form.street.trim(),
          number: form.number.trim(),
          complement: form.complement.trim(),
          district: form.district.trim(),
          city: form.city.trim(),
          state: form.state.trim().toUpperCase()
        }
      },
      form.email.trim(),
      form.password
    );
    setSubmitting(false);

    if (!result.ok) {
      setMessage(result.message ?? "Erro ao cadastrar.");
      return;
    }

    router.push("/seller/activation");
  };

  return (
    <div className="bg-bpOffWhite">
      <div className="mx-auto flex min-h-[70vh] w-full max-w-3xl items-center px-6 py-16">
        <form
          onSubmit={handleSubmit}
          className="w-full rounded-bpLg border border-bpPink/15 bg-white p-8 shadow-bpMicro"
        >
          <h1 className="font-display text-3xl text-bpBlack">Criar sua conta</h1>
          <p className="mt-2 text-sm text-bpGraphite/80">
            Comece a gerenciar suas obras de forma inteligente.
          </p>

          <div className="mt-8 grid gap-5">
            <section className="grid gap-4 md:grid-cols-2">
              <div className="md:col-span-2">
                <FieldLabel required>Nome completo</FieldLabel>
                <input
                  placeholder="Seu nome"
                  value={form.fullName}
                  onChange={(event) => setField("fullName", event.target.value)}
                  className="w-full rounded-2xl border border-black/10 bg-white px-4 py-3 text-sm text-bpBlack outline-none focus:border-bpPink"
                />
              </div>
              <div>
                <FieldLabel required>Email</FieldLabel>
                <input
                  type="email"
                  placeholder="seu@email.com"
                  value={form.email}
                  onChange={(event) => setField("email", event.target.value)}
                  className="w-full rounded-2xl border border-black/10 bg-white px-4 py-3 text-sm text-bpBlack outline-none focus:border-bpPink"
                />
              </div>
              <div>
                <FieldLabel required>Nome da Empresa</FieldLabel>
                <input
                  placeholder="Nome da sua empresa"
                  value={form.companyName}
                  onChange={(event) => setField("companyName", event.target.value)}
                  className="w-full rounded-2xl border border-black/10 bg-white px-4 py-3 text-sm text-bpBlack outline-none focus:border-bpPink"
                />
              </div>
              <div>
                <FieldLabel required>CNPJ</FieldLabel>
                <input
                  inputMode="numeric"
                  placeholder="00.000.000/0000-00"
                  value={form.cnpj}
                  onChange={handleCnpjChange}
                  className="w-full rounded-2xl border border-black/10 bg-white px-4 py-3 text-sm text-bpBlack outline-none focus:border-bpPink"
                />
              </div>
            </section>

            <section className="grid gap-4 md:grid-cols-2">
              <div className="md:col-span-2">
                <p className="text-xs uppercase tracking-[0.2em] text-bpGraphite/75">
                  Endereco da Empresa
                </p>
              </div>
              <div>
                <FieldLabel required>CEP</FieldLabel>
                <input
                  inputMode="numeric"
                  placeholder="00000-000"
                  value={form.zip}
                  onChange={handleZipChange}
                  className="w-full rounded-2xl border border-black/10 bg-white px-4 py-3 text-sm text-bpBlack outline-none focus:border-bpPink"
                />
              </div>
              <div>
                <FieldLabel required>Logradouro</FieldLabel>
                <input
                  placeholder="Rua, Avenida, etc"
                  value={form.street}
                  onChange={(event) => setField("street", event.target.value)}
                  className="w-full rounded-2xl border border-black/10 bg-white px-4 py-3 text-sm text-bpBlack outline-none focus:border-bpPink"
                />
              </div>
              <div>
                <FieldLabel required>Numero</FieldLabel>
                <input
                  placeholder="123"
                  value={form.number}
                  onChange={(event) => setField("number", event.target.value)}
                  className="w-full rounded-2xl border border-black/10 bg-white px-4 py-3 text-sm text-bpBlack outline-none focus:border-bpPink"
                />
              </div>
              <div>
                <FieldLabel>Complemento</FieldLabel>
                <input
                  placeholder="Sala, Andar (opcional)"
                  value={form.complement}
                  onChange={(event) => setField("complement", event.target.value)}
                  className="w-full rounded-2xl border border-black/10 bg-white px-4 py-3 text-sm text-bpBlack outline-none focus:border-bpPink"
                />
              </div>
              <div>
                <FieldLabel required>Bairro</FieldLabel>
                <input
                  placeholder="Bairro"
                  value={form.district}
                  onChange={(event) => setField("district", event.target.value)}
                  className="w-full rounded-2xl border border-black/10 bg-white px-4 py-3 text-sm text-bpBlack outline-none focus:border-bpPink"
                />
              </div>
              <div>
                <FieldLabel required>Cidade</FieldLabel>
                <input
                  placeholder="Cidade"
                  value={form.city}
                  onChange={(event) => setField("city", event.target.value)}
                  className="w-full rounded-2xl border border-black/10 bg-white px-4 py-3 text-sm text-bpBlack outline-none focus:border-bpPink"
                />
              </div>
              <div>
                <FieldLabel required>Estado</FieldLabel>
                <select
                  value={form.state}
                  onChange={handleStateChange}
                  className="w-full rounded-2xl border border-black/10 bg-white px-4 py-3 text-sm text-bpBlack outline-none focus:border-bpPink"
                >
                  <option value="">UF</option>
                  {BRAZIL_STATES.map((uf) => (
                    <option key={uf} value={uf}>
                      {uf}
                    </option>
                  ))}
                </select>
              </div>
            </section>

            <section className="grid gap-4 md:grid-cols-2">
              <div className="md:col-span-2">
                <p className="text-xs uppercase tracking-[0.2em] text-bpGraphite/75">Senha de Acesso</p>
              </div>
              <div>
                <FieldLabel required>Senha</FieldLabel>
                <input
                  type="password"
                  placeholder="••••••••"
                  value={form.password}
                  onChange={(event) => setField("password", event.target.value)}
                  className="w-full rounded-2xl border border-black/10 bg-white px-4 py-3 text-sm text-bpBlack outline-none focus:border-bpPink"
                />
                <p className="mt-1 text-[11px] text-bpGraphite/70">Minimo de 6 caracteres</p>
              </div>
              <div>
                <FieldLabel required>Confirmar senha</FieldLabel>
                <input
                  type="password"
                  placeholder="••••••••"
                  value={form.confirmPassword}
                  onChange={(event) => setField("confirmPassword", event.target.value)}
                  className="w-full rounded-2xl border border-black/10 bg-white px-4 py-3 text-sm text-bpBlack outline-none focus:border-bpPink"
                />
              </div>
            </section>
          </div>

          {message ? <p className="mt-4 text-xs text-bpPink">{message}</p> : null}
          <div className="mt-6">
            <LuxuryButton size="lg" className="w-full" type="submit" disabled={submitting}>
              {submitting ? "Criando conta..." : "Criar conta de lojista"}
            </LuxuryButton>
          </div>
          <p className="mt-6 text-center text-xs text-bpGraphite/75">
            Ja tem acesso?{" "}
            <Link href="/seller/login" className="text-bpPink">
              Entrar no painel
            </Link>
          </p>
        </form>
      </div>
    </div>
  );
}
