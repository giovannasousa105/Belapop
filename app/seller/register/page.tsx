"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";

import { LuxuryButton } from "@/components/LuxuryButton";
import { useAuth } from "@/lib/AuthContext";

export default function SellerRegisterPage() {
  const router = useRouter();
  const { registerSeller } = useAuth();
  const [form, setForm] = useState({
    storeName: "",
    responsibleName: "",
    email: "",
    password: "",
    contact: "",
    mainCategory: "",
    postalCode: "",
    commissionRate: ""
  });
  const [message, setMessage] = useState<string | null>(null);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (
      !form.storeName ||
      !form.responsibleName ||
      !form.email ||
      !form.password ||
      !form.contact ||
      !form.mainCategory ||
      !form.postalCode
    ) {
      setMessage("Preencha todos os campos para seguir.");
      return;
    }
    const commissionRateValue = Number(form.commissionRate);
    const result = await registerSeller(
      {
        storeName: form.storeName,
        responsibleName: form.responsibleName,
        contact: form.contact,
        mainCategory: form.mainCategory,
        postalCode: form.postalCode,
        commissionRate: Number.isFinite(commissionRateValue) && commissionRateValue > 0
          ? commissionRateValue
          : undefined
      },
      form.email,
      form.password
    );
    if (!result.ok) {
      setMessage(result.message ?? "Erro ao cadastrar.");
      return;
    }
    router.push("/seller/activation");
  };

  return (
    <div className="bg-bpOffWhite">
      <div className="mx-auto flex min-h-[70vh] w-full max-w-xl items-center px-6 py-16">
      <form
        onSubmit={handleSubmit}
        className="w-full rounded-bpLg border border-bpPink/15 bg-white p-8 shadow-bpMicro"
      >
        <h1 className="font-display text-3xl text-bpBlack">
          Cadastro de lojista
        </h1>
        <p className="mt-2 text-sm text-bpGraphite/80">
          Conte-nos sobre sua marca para iniciar a curadoria.
        </p>
        <div className="mt-6 grid gap-4 md:grid-cols-2">
          <input
            placeholder="Nome da loja"
            value={form.storeName}
            onChange={(event) =>
              setForm({ ...form, storeName: event.target.value })
            }
            className="rounded-2xl border border-black/10 bg-white px-4 py-3 text-sm text-bpBlack outline-none focus:border-bpPink md:col-span-2"
          />
          <input
            placeholder="Responsável"
            value={form.responsibleName}
            onChange={(event) =>
              setForm({ ...form, responsibleName: event.target.value })
            }
            className="rounded-2xl border border-black/10 bg-white px-4 py-3 text-sm text-bpBlack outline-none focus:border-bpPink"
          />
          <input
            placeholder="Categoria principal"
            value={form.mainCategory}
            onChange={(event) =>
              setForm({ ...form, mainCategory: event.target.value })
            }
            className="rounded-2xl border border-black/10 bg-white px-4 py-3 text-sm text-bpBlack outline-none focus:border-bpPink"
          />
          <input
            placeholder="CEP de origem"
            value={form.postalCode}
            onChange={(event) =>
              setForm({ ...form, postalCode: event.target.value })
            }
            className="rounded-2xl border border-black/10 bg-white px-4 py-3 text-sm text-bpBlack outline-none focus:border-bpPink"
          />
          <input
            type="email"
            placeholder="E-mail"
            value={form.email}
            onChange={(event) =>
              setForm({ ...form, email: event.target.value })
            }
            className="rounded-2xl border border-black/10 bg-white px-4 py-3 text-sm text-bpBlack outline-none focus:border-bpPink"
          />
          <input
            type="password"
            placeholder="Senha"
            value={form.password}
            onChange={(event) =>
              setForm({ ...form, password: event.target.value })
            }
            className="rounded-2xl border border-black/10 bg-white px-4 py-3 text-sm text-bpBlack outline-none focus:border-bpPink"
          />
          <input
            placeholder="WhatsApp ou Instagram"
            value={form.contact}
            onChange={(event) =>
              setForm({ ...form, contact: event.target.value })
            }
            className="rounded-2xl border border-black/10 bg-white px-4 py-3 text-sm text-bpBlack outline-none focus:border-bpPink md:col-span-2"
          />
          <div className="md:col-span-2">
            <label className="mb-2 block text-xs uppercase tracking-[0.24em] text-bpGraphite/75">
              Comissao BelaPop (%)
            </label>
            <input
              type="number"
              min={0}
              max={100}
              step="0.1"
              placeholder="Ex: 10"
              value={form.commissionRate}
              onChange={(event) =>
                setForm({ ...form, commissionRate: event.target.value })
              }
              className="w-full rounded-2xl border border-black/10 bg-white px-4 py-3 text-sm text-bpBlack outline-none focus:border-bpPink"
            />
            <p className="mt-2 text-xs text-bpGraphite/70">
              10 significa 10% sobre cada venda no marketplace.
            </p>
          </div>
        </div>
        {message ? (
          <p className="mt-4 text-xs text-bpPink">{message}</p>
        ) : null}
        <div className="mt-6">
          <LuxuryButton size="lg" className="w-full" type="submit">
            Criar conta de lojista
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
