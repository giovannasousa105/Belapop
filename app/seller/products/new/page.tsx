"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { LuxuryButton } from "@/components/LuxuryButton";
import { useAuth } from "@/lib/AuthContext";
import { productRepository } from "@/lib/repositories/productRepository";
import { Product, ProductCategory, ProductImageTone } from "@/lib/types";
import { createUUID } from "@/lib/utils";

const categories: ProductCategory[] = [
  "Skincare",
  "Maquiagem",
  "Bem-estar",
  "Cabelos",
  "Acessórios",
  "Corpo"
];

const tones: ProductImageTone[] = ["rose", "blush", "noir", "plum"];

export default function NewProductPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [message, setMessage] = useState<string | null>(null);
  const [form, setForm] = useState({
    name: "",
    description: "",
    price: "",
    category: "Skincare",
    images: "",
    status: "draft",
    imageTone: "rose",
    weightKg: "0.3",
    widthCm: "12",
    heightCm: "6",
    lengthCm: "18"
  });

  const handleSubmit = async (
    statusOverride?: "draft" | "published" | "review" | "paused"
  ) => {
    if (!form.name || !form.description || !form.price || !user) {
      setMessage("Preencha nome, descrição e preço.");
      return;
    }

    if (!user.sellerProfile?.sellerId) {
      setMessage("Finalize o cadastro do lojista antes de criar produtos.");
      return;
    }


    const priceValue = Number(form.price);
    const weightKg = Number(form.weightKg);
    const widthCm = Number(form.widthCm);
    const heightCm = Number(form.heightCm);
    const lengthCm = Number(form.lengthCm);

    if (
      Number.isNaN(priceValue) ||
      Number.isNaN(weightKg) ||
      Number.isNaN(widthCm) ||
      Number.isNaN(heightCm) ||
      Number.isNaN(lengthCm)
    ) {
      setMessage("Informe valores numéricos válidos.");
      return;
    }

    const images = form.images
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean);

    const resolvedStatus =
      statusOverride === "published"
        ? "review"
        : (statusOverride ?? form.status);

    const newProduct: Product = {
      id: createUUID(),
      sellerId: user.sellerProfile.sellerId,
      name: form.name,
      description: form.description,
      price: priceValue,
      category: form.category as ProductCategory,
      images: images.length ? images : ["editorial-01", "editorial-02"],
      status: resolvedStatus as Product["status"],
      createdAt: new Date().toISOString(),
      imageTone: form.imageTone as ProductImageTone,
      weightKg,
      widthCm,
      heightCm,
      lengthCm
    };

    const result = await productRepository.upsert(newProduct);
    if (!result.ok) {
      setMessage(result.message ?? "NÃ£o foi possÃ­vel salvar o produto.");
      return;
    }
    router.push("/seller/products");
  };

  return (
    <div className="flex w-full flex-col gap-8">
      <div>
        <p className="text-xs uppercase tracking-[0.3em] text-bpGraphite/70">
          Novo produto
        </p>
        <h1 className="mt-2 font-display text-3xl text-bpBlack">
          Cadastro de produto
        </h1>
        <p className="mt-2 text-sm text-bpGraphite/80">
          Preencha os dados essenciais e defina o status de publicação.
        </p>
      </div>

      <form
        onSubmit={(event) => {
          event.preventDefault();
          handleSubmit();
        }}
        className="grid gap-4 rounded-3xl border border-black/10 bg-white p-8 shadow-sm md:grid-cols-2"
      >
        <input
          placeholder="Nome do produto"
          value={form.name}
          onChange={(event) => setForm({ ...form, name: event.target.value })}
          className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-bpBlackSoft placeholder:text-bpGraphite/60 md:col-span-2"
        />
        <textarea
          placeholder="Descrição institucional"
          value={form.description}
          onChange={(event) =>
            setForm({ ...form, description: event.target.value })
          }
          className="min-h-[120px] rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-bpBlackSoft placeholder:text-bpGraphite/60 md:col-span-2"
        />
        <input
          type="number"
          min="0"
          step="0.01"
          placeholder="Preço (ex.: 199)"
          value={form.price}
          onChange={(event) => setForm({ ...form, price: event.target.value })}
          className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-bpBlackSoft"
        />
        <select
          value={form.category}
          onChange={(event) =>
            setForm({ ...form, category: event.target.value })
          }
          className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-bpBlackSoft"
        >
          {categories.map((item) => (
            <option key={item} value={item}>
              {item}
            </option>
          ))}
        </select>
        <input
          type="number"
          min="0"
          step="0.01"
          placeholder="Peso (kg)"
          value={form.weightKg}
          onChange={(event) => setForm({ ...form, weightKg: event.target.value })}
          className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-bpBlackSoft"
        />
        <input
          type="number"
          min="0"
          step="0.1"
          placeholder="Largura (cm)"
          value={form.widthCm}
          onChange={(event) => setForm({ ...form, widthCm: event.target.value })}
          className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-bpBlackSoft"
        />
        <input
          type="number"
          min="0"
          step="0.1"
          placeholder="Altura (cm)"
          value={form.heightCm}
          onChange={(event) => setForm({ ...form, heightCm: event.target.value })}
          className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-bpBlackSoft"
        />
        <input
          type="number"
          min="0"
          step="0.1"
          placeholder="Comprimento (cm)"
          value={form.lengthCm}
          onChange={(event) => setForm({ ...form, lengthCm: event.target.value })}
          className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-bpBlackSoft"
        />
        <input
          placeholder="Imagens (separe por vírgula)"
          value={form.images}
          onChange={(event) => setForm({ ...form, images: event.target.value })}
          className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-bpBlackSoft placeholder:text-bpGraphite/60 md:col-span-2"
        />
        <select
          value={form.status}
          onChange={(event) =>
            setForm({ ...form, status: event.target.value })
          }
          className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-bpBlackSoft"
        >
          <option value="draft">Rascunho</option>
          <option value="review">Aguardando curadoria</option>
          <option value="paused">Pausado</option>
        </select>
        <select
          value={form.imageTone}
          onChange={(event) =>
            setForm({ ...form, imageTone: event.target.value })
          }
          className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-bpBlackSoft"
        >
          {tones.map((tone) => (
            <option key={tone} value={tone}>
              Tom {tone}
            </option>
          ))}
        </select>
        {message ? (
          <p className="text-xs text-bpPink md:col-span-2">{message}</p>
        ) : null}
        <div className="flex flex-wrap gap-3 md:col-span-2">
          <LuxuryButton tone="retail" size="lg" onClick={() => handleSubmit("draft")}>
            Salvar rascunho
          </LuxuryButton>
          <LuxuryButton tone="retail" size="lg" onClick={() => handleSubmit("published")}>
            Enviar para curadoria
          </LuxuryButton>
          <LuxuryButton tone="retail" variant="outline" size="lg" href="/seller/products">
            Cancelar
          </LuxuryButton>
        </div>
      </form>
    </div>
  );
}


