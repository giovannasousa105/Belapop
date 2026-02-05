"use client";

import { useState } from "react";

import { PageHeading } from "@/components/PageHeading";
import { LuxuryButton } from "@/components/LuxuryButton";

export default function AccountAddressesNewPage() {
  const [form, setForm] = useState({
    label: "",
    street: "",
    number: "",
    complement: "",
    city: "",
    state: "",
    zip: ""
  });

  const handleChange = (field: keyof typeof form, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    // Placeholder — integração futura
    alert("Endereço salvo (mock).");
  };

  return (
    <div className="space-y-6">
      <PageHeading
        title="Adicionar endereço"
        subtitle="Informe o CEP e o endereço para agilizar próximas compras."
      />
      <form
        onSubmit={handleSubmit}
        className="grid gap-4 rounded-3xl border border-black/10 bg-white p-6 shadow-sm md:grid-cols-2"
      >
        {[
          { label: "Nome do endereço", field: "label" },
          { label: "CEP", field: "zip" },
          { label: "Rua", field: "street" },
          { label: "Número", field: "number" },
          { label: "Complemento", field: "complement" },
          { label: "Cidade", field: "city" },
          { label: "Estado", field: "state" }
        ].map(({ label, field }) => (
          <label
            key={field}
            className="flex flex-col gap-2 text-sm text-noir-600"
          >
            {label}
            <input
              value={form[field as keyof typeof form]}
              onChange={(event) =>
                handleChange(field as keyof typeof form, event.target.value)
              }
              className="rounded-2xl border border-black/10 bg-noir-50 px-4 py-3 text-sm text-noir-900 focus:border-luxe-600 focus:outline-none"
            />
          </label>
        ))}
        <div className="md:col-span-2">
          <LuxuryButton type="submit" size="md" variant="primary">
            Salvar endereço
          </LuxuryButton>
        </div>
      </form>
    </div>
  );
}
