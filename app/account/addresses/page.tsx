"use client";

import { useEffect, useState } from "react";

import { PageHeading } from "@/components/PageHeading";
import { useAuth } from "@/lib/AuthContext";
import { getSupabaseBrowserClient } from "@/lib/supabaseBrowser";

type AddressRow = {
  id: string;
  label: string | null;
  full_name: string | null;
  street: string | null;
  number: string | null;
  city: string | null;
  state: string | null;
  zip: string | null;
  complement: string | null;
  is_default: boolean | null;
};

export default function AccountAddressesPage() {
  const { ready, user } = useAuth();
  const [rows, setRows] = useState<AddressRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({
    label: "",
    full_name: "",
    street: "",
    number: "",
    city: "",
    state: "",
    zip: "",
    complement: ""
  });

  useEffect(() => {
    if (!ready || !user) return;
    let active = true;
    const supabase = getSupabaseBrowserClient();
    setLoading(true);
    const load = async () => {
      const { data } = await supabase
        .from("addresses")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });
      if (!active) return;
      setRows(data ?? []);
      setLoading(false);
    };
    void load();
    return () => {
      active = false;
    };
  }, [ready, user]);

  const handleChange = (field: string, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleCreate = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!user) return;
    const supabase = getSupabaseBrowserClient();
    const payload = {
      user_id: user.id,
      label: form.label || "Principal",
      full_name: form.full_name,
      street: form.street,
      number: form.number,
      city: form.city,
      state: form.state,
      zip: form.zip,
      complement: form.complement,
      is_default: rows.length === 0
    };
    const { data, error } = await supabase
      .from("addresses")
      .insert(payload)
      .select()
      .single();
    if (error) return;
    setRows((prev) => [data as AddressRow, ...prev]);
    setForm({
      label: "",
      full_name: "",
      street: "",
      number: "",
      city: "",
      state: "",
      zip: "",
      complement: ""
    });
  };

  return (
    <div className="space-y-6">
      <PageHeading
        title="Endereços"
        subtitle="Onde entregamos cada ritual BelaPop."
      />

      <div className="rounded-3xl border border-black/10 bg-white p-6 shadow-sm">
        <p className="text-xs uppercase tracking-[0.3em] text-noir-500">Novo endereço</p>
        <form onSubmit={handleCreate} className="mt-4 grid gap-3 md:grid-cols-2">
          <input
            value={form.label}
            onChange={(event) => handleChange("label", event.target.value)}
            placeholder="Etiqueta (Casa, Trabalho)"
            className="rounded-2xl border border-black/10 px-4 py-3 text-sm"
          />
          <input
            value={form.full_name}
            onChange={(event) => handleChange("full_name", event.target.value)}
            placeholder="Nome completo"
            className="rounded-2xl border border-black/10 px-4 py-3 text-sm"
          />
          <input
            value={form.street}
            onChange={(event) => handleChange("street", event.target.value)}
            placeholder="Rua"
            className="rounded-2xl border border-black/10 px-4 py-3 text-sm"
          />
          <input
            value={form.number}
            onChange={(event) => handleChange("number", event.target.value)}
            placeholder="Número"
            className="rounded-2xl border border-black/10 px-4 py-3 text-sm"
          />
          <input
            value={form.city}
            onChange={(event) => handleChange("city", event.target.value)}
            placeholder="Cidade"
            className="rounded-2xl border border-black/10 px-4 py-3 text-sm"
          />
          <input
            value={form.state}
            onChange={(event) => handleChange("state", event.target.value)}
            placeholder="Estado"
            className="rounded-2xl border border-black/10 px-4 py-3 text-sm"
          />
          <input
            value={form.zip}
            onChange={(event) => handleChange("zip", event.target.value)}
            placeholder="CEP"
            className="rounded-2xl border border-black/10 px-4 py-3 text-sm"
          />
          <input
            value={form.complement}
            onChange={(event) => handleChange("complement", event.target.value)}
            placeholder="Complemento"
            className="rounded-2xl border border-black/10 px-4 py-3 text-sm"
          />
          <button
            type="submit"
            className="rounded-full bg-luxe-600 px-5 py-2 text-xs uppercase tracking-[0.3em] text-white shadow-soft-luxe"
          >
            Salvar endereço
          </button>
        </form>
      </div>

      <div className="rounded-3xl border border-black/10 bg-white p-6 shadow-sm">
        <p className="text-xs uppercase tracking-[0.3em] text-noir-500">Endereços salvos</p>
        {loading ? (
          <p className="mt-4 text-sm text-noir-500">Carregando...</p>
        ) : rows.length === 0 ? (
          <p className="mt-4 text-sm text-noir-600">Nenhum endereço cadastrado.</p>
        ) : (
          <div className="mt-4 space-y-3">
            {rows.map((row) => (
              <div key={row.id} className="rounded-2xl border border-black/10 p-4 text-sm">
                <div className="flex items-center justify-between">
                  <p className="font-semibold text-noir-900">{row.label ?? "Endereço"}</p>
                  {row.is_default ? (
                    <span className="text-[10px] uppercase tracking-[0.3em] text-luxe-600">
                      Principal
                    </span>
                  ) : null}
                </div>
                <p className="text-sm text-noir-600">
                  {row.street}, {row.number} • {row.city}/{row.state}
                </p>
                <p className="text-xs text-noir-500">
                  CEP {row.zip} {row.complement ? `• ${row.complement}` : ""}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
