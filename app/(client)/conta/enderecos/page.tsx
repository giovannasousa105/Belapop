"use client";

import { useEffect, useState } from "react";

import { useAuth } from "@/lib/AuthContext";
import {
  getCustomerAddresses,
  postCustomerAddress,
  type CustomerAddress
} from "@/lib/customer/api";

type AddressRow = CustomerAddress;

const initialForm = {
  label: "",
  full_name: "",
  street: "",
  number: "",
  city: "",
  state: "",
  zip: "",
  complement: ""
};

export default function ContaEnderecosPage() {
  const { user } = useAuth();
  const [rows, setRows] = useState<AddressRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState(initialForm);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;
    let active = true;
    setLoading(true);

    const load = async () => {
      try {
        const data = await getCustomerAddresses();
        if (active) setRows(data.items);
      } catch (error) {
        if (active) {
          setMessage(error instanceof Error ? error.message : "Nao foi possivel carregar enderecos.");
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

  const handleCreate = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!form.street || !form.number || !form.city || !form.state || !form.zip) {
      setMessage("Preencha rua, numero, cidade, estado e CEP.");
      return;
    }

    setSaving(true);
    setMessage(null);
    try {
      const created = await postCustomerAddress({
        label: form.label || "Principal",
        full_name: form.full_name || "",
        street: form.street,
        number: form.number,
        city: form.city,
        state: form.state,
        zip: form.zip,
        complement: form.complement || ""
      });
      setRows((prev) => [created, ...prev]);
      setForm(initialForm);
      setMessage("Endereco salvo com sucesso.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Nao foi possivel salvar o endereco.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6 pb-8">
      <section className="rounded-3xl border border-black/10 bg-white p-6 shadow-sm">
        <p className="text-xs uppercase tracking-[0.3em] text-bpGraphite/60">Enderecos</p>
        <h1 className="mt-3 font-display text-4xl text-bpBlack">Entrega sem friccao</h1>
        <p className="mt-3 text-sm text-bpGraphite/75">
          Cadastre seus enderecos e escolha o principal para checkout mais rapido.
        </p>
      </section>

      <section className="rounded-3xl border border-black/10 bg-white p-6 shadow-sm">
        <p className="text-sm font-semibold text-bpBlack">Novo endereco</p>
        <form onSubmit={handleCreate} className="mt-4 grid gap-3 md:grid-cols-2">
          <input
            value={form.label}
            onChange={(event) => setForm((prev) => ({ ...prev, label: event.target.value }))}
            placeholder="Etiqueta (Casa, Trabalho)"
            className="h-11 rounded-2xl border border-black/10 bg-white px-4 text-sm"
          />
          <input
            value={form.full_name}
            onChange={(event) => setForm((prev) => ({ ...prev, full_name: event.target.value }))}
            placeholder="Nome para recebimento"
            className="h-11 rounded-2xl border border-black/10 bg-white px-4 text-sm"
          />
          <input
            value={form.street}
            onChange={(event) => setForm((prev) => ({ ...prev, street: event.target.value }))}
            placeholder="Rua"
            className="h-11 rounded-2xl border border-black/10 bg-white px-4 text-sm"
          />
          <input
            value={form.number}
            onChange={(event) => setForm((prev) => ({ ...prev, number: event.target.value }))}
            placeholder="Numero"
            className="h-11 rounded-2xl border border-black/10 bg-white px-4 text-sm"
          />
          <input
            value={form.city}
            onChange={(event) => setForm((prev) => ({ ...prev, city: event.target.value }))}
            placeholder="Cidade"
            className="h-11 rounded-2xl border border-black/10 bg-white px-4 text-sm"
          />
          <input
            value={form.state}
            onChange={(event) => setForm((prev) => ({ ...prev, state: event.target.value.toUpperCase() }))}
            placeholder="Estado (UF)"
            className="h-11 rounded-2xl border border-black/10 bg-white px-4 text-sm"
          />
          <input
            value={form.zip}
            onChange={(event) => setForm((prev) => ({ ...prev, zip: event.target.value }))}
            placeholder="CEP"
            className="h-11 rounded-2xl border border-black/10 bg-white px-4 text-sm"
          />
          <input
            value={form.complement}
            onChange={(event) => setForm((prev) => ({ ...prev, complement: event.target.value }))}
            placeholder="Complemento"
            className="h-11 rounded-2xl border border-black/10 bg-white px-4 text-sm"
          />
          <div className="md:col-span-2">
            <button
              type="submit"
              disabled={saving}
              className="rounded-full border border-bpPink/50 bg-bpPink px-6 py-3 text-xs uppercase tracking-[0.2em] text-white disabled:opacity-60"
            >
              {saving ? "Salvando..." : "Salvar endereco"}
            </button>
          </div>
          {message ? <p className="md:col-span-2 text-sm text-bpPink">{message}</p> : null}
        </form>
      </section>

      <section className="rounded-3xl border border-black/10 bg-white p-6 shadow-sm">
        <p className="text-sm font-semibold text-bpBlack">Enderecos salvos</p>
        {loading ? (
          <p className="mt-4 text-sm text-bpGraphite/70">Carregando enderecos...</p>
        ) : rows.length === 0 ? (
          <p className="mt-4 text-sm text-bpGraphite/70">Nenhum endereco salvo.</p>
        ) : (
          <div className="mt-4 grid gap-3 md:grid-cols-2">
            {rows.map((row) => (
              <article key={row.id} className="rounded-2xl border border-black/10 p-4">
                <div className="flex items-center justify-between gap-2">
                  <p className="text-sm font-semibold text-bpBlackSoft">{row.label || "Endereco"}</p>
                  {row.is_default ? (
                    <span className="rounded-full border border-bpPink/40 bg-bpPink/10 px-2 py-1 text-[10px] uppercase tracking-[0.18em] text-bpBlack">
                      Principal
                    </span>
                  ) : null}
                </div>
                <p className="mt-2 text-sm text-bpGraphite/80">
                  {row.street}, {row.number} - {row.city}/{row.state}
                </p>
                <p className="text-xs text-bpGraphite/70">
                  CEP {row.zip}
                  {row.complement ? ` - ${row.complement}` : ""}
                </p>
              </article>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
