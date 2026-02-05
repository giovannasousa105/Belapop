"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

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
    commissionRate: "10"
  });
  const [message, setMessage] = useState<string | null>(null);

  const handleSubmit = async (event: React.FormEvent) => {
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
    router.push("/seller/dashboard");
  };

  return (
    <div className="mx-auto flex min-h-[70vh] w-full max-w-xl items-center px-6 py-16">
      <form
        onSubmit={handleSubmit}
        className="glass-panel w-full rounded-3xl p-8"
      >
        <h1 className="font-display text-3xl text-blush-50">
          Cadastro de lojista
        </h1>
        <p className="mt-2 text-sm text-blush-100/70">
          Conte-nos sobre sua marca para iniciar a curadoria.
        </p>
        <div className="mt-6 grid gap-4 md:grid-cols-2">
          <input
            placeholder="Nome da loja"
            value={form.storeName}
            onChange={(event) =>
              setForm({ ...form, storeName: event.target.value })
            }
            className="rounded-2xl border border-white/10 px-4 py-3 text-sm md:col-span-2"
          />
          <input
            placeholder="Responsável"
            value={form.responsibleName}
            onChange={(event) =>
              setForm({ ...form, responsibleName: event.target.value })
            }
            className="rounded-2xl border border-white/10 px-4 py-3 text-sm"
          />
          <input
            placeholder="Categoria principal"
            value={form.mainCategory}
            onChange={(event) =>
              setForm({ ...form, mainCategory: event.target.value })
            }
            className="rounded-2xl border border-white/10 px-4 py-3 text-sm"
          />
          <input
            placeholder="CEP de origem"
            value={form.postalCode}
            onChange={(event) =>
              setForm({ ...form, postalCode: event.target.value })
            }
            className="rounded-2xl border border-white/10 px-4 py-3 text-sm"
          />
          <input
            type="email"
            placeholder="E-mail"
            value={form.email}
            onChange={(event) =>
              setForm({ ...form, email: event.target.value })
            }
            className="rounded-2xl border border-white/10 px-4 py-3 text-sm"
          />
          <input
            type="password"
            placeholder="Senha"
            value={form.password}
            onChange={(event) =>
              setForm({ ...form, password: event.target.value })
            }
            className="rounded-2xl border border-white/10 px-4 py-3 text-sm"
          />
          <input
            placeholder="WhatsApp ou Instagram"
            value={form.contact}
            onChange={(event) =>
              setForm({ ...form, contact: event.target.value })
            }
            className="rounded-2xl border border-white/10 px-4 py-3 text-sm md:col-span-2"
          />
          <input
            type="number"
            placeholder="Comissão BelaPop (%)"
            value={form.commissionRate}
            onChange={(event) =>
              setForm({ ...form, commissionRate: event.target.value })
            }
            className="rounded-2xl border border-white/10 px-4 py-3 text-sm md:col-span-2"
          />
        </div>
        {message ? (
          <p className="mt-4 text-xs text-luxe-600">{message}</p>
        ) : null}
        <div className="mt-6">
          <LuxuryButton size="lg" className="w-full" type="submit">
            Criar conta de lojista
          </LuxuryButton>
        </div>
        <p className="mt-6 text-center text-xs text-blush-100/70">
          Já tem acesso?{" "}
          <Link href="/seller/login" className="text-blush-50">
            Entrar no painel
          </Link>
        </p>
      </form>
    </div>
  );
}
