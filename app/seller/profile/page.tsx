"use client";

import { useEffect, useState } from "react";

import { LuxuryButton } from "@/components/LuxuryButton";
import { useAuth } from "@/lib/AuthContext";

export default function SellerProfilePage() {
  const { user, updateSellerProfile } = useAuth();
  const [message, setMessage] = useState<string | null>(null);
  const [form, setForm] = useState({
    storeName: "",
    postalCode: "",
    category: "",
    contact: ""
  });

  useEffect(() => {
    if (!user) return;
    setForm({
      storeName: user.sellerProfile?.storeName ?? "",
      postalCode: user.sellerProfile?.postalCode ?? "",
      category: user.sellerProfile?.mainCategory ?? "",
      contact: user.sellerProfile?.contact ?? ""
    });
  }, [user]);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!form.storeName || !form.postalCode || !form.category || !form.contact) {
      setMessage("Preencha todos os campos para atualizar o cadastro.");
      return;
    }
    const result = await updateSellerProfile({
      storeName: form.storeName,
      postalCode: form.postalCode,
      mainCategory: form.category,
      contact: form.contact,
      responsibleName:
        user?.sellerProfile?.responsibleName ?? user?.name ?? "Responsável"
    });
    if (!result.ok) {
      setMessage(result.message ?? "Não foi possível atualizar.");
      return;
    }
    setMessage("Dados atualizados com sucesso.");
  };

  return (
    <div className="flex w-full flex-col gap-8">
      <div>
        <p className="text-xs uppercase tracking-[0.3em] text-noir-500">
          Perfil do lojista
        </p>
        <h1 className="mt-2 font-display text-3xl text-noir-950">
          Dados institucionais
        </h1>
        <p className="mt-2 text-sm text-noir-600">
          Atualize informações essenciais para operação e logística.
        </p>
      </div>

      <form
        onSubmit={handleSubmit}
        className="grid gap-4 rounded-3xl border border-black/10 bg-white p-8 shadow-sm md:grid-cols-2"
      >
        <input
          placeholder="Nome da loja"
          value={form.storeName}
          onChange={(event) =>
            setForm({ ...form, storeName: event.target.value })
          }
          className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-noir-900 md:col-span-2"
        />
        <input
          placeholder="CEP de origem"
          value={form.postalCode}
          onChange={(event) =>
            setForm({ ...form, postalCode: event.target.value })
          }
          className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-noir-900"
        />
        <input
          placeholder="Categoria principal"
          value={form.category}
          onChange={(event) =>
            setForm({ ...form, category: event.target.value })
          }
          className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-noir-900"
        />
        <input
          placeholder="WhatsApp ou Instagram"
          value={form.contact}
          onChange={(event) =>
            setForm({ ...form, contact: event.target.value })
          }
          className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-noir-900 md:col-span-2"
        />
        {message ? (
          <p className="text-xs text-luxe-600 md:col-span-2">{message}</p>
        ) : null}
        <div className="flex flex-wrap gap-3 md:col-span-2">
          <LuxuryButton tone="retail" size="lg" type="submit">
            Salvar alterações
          </LuxuryButton>
          <LuxuryButton tone="retail" variant="outline" size="lg" href="/seller/dashboard">
            Voltar ao dashboard
          </LuxuryButton>
        </div>
      </form>
    </div>
  );
}
