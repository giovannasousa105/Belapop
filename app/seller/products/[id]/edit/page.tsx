"use client";

import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { LuxuryButton } from "@/components/LuxuryButton";
import { useAuth } from "@/lib/AuthContext";
import { productRepository } from "@/lib/repositories/productRepository";
import { Product, ProductCategory, ProductImageTone } from "@/lib/types";

const categories: ProductCategory[] = [
  "Skincare",
  "Maquiagem",
  "Bem-estar",
  "Cabelos",
  "Acessórios",
  "Corpo"
];

const tones: ProductImageTone[] = ["rose", "blush", "noir", "plum"];

export default function EditProductPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const [product, setProduct] = useState<Product | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const productId = String(params?.id ?? "");

  useEffect(() => {
    let active = true;
    const load = async () => {
      const found = await productRepository.getById(productId);
      if (!active) return;
      if (!found) {
        setMessage("Produto não localizado.");
        return;
      }
      if (user && found.sellerId !== user.sellerProfile?.sellerId) {
        setMessage("Permissão insuficiente para editar este produto.");
        return;
      }
      setProduct(found);
    };
    void load();
    return () => {
      active = false;
    };
  }, [productId, user]);

  const handleSubmit = async (statusOverride?: "draft" | "published" | "review" | "paused") => {
    if (!product) return;
    if (!product.name || !product.description || !product.price) {
      setMessage("Preencha nome, descrição e preço.");
      return;
    }

    const resolvedStatus =
      statusOverride === "published"
        ? "review"
        : (statusOverride ?? product.status);

    const nextProduct: Product = {
      ...product,
      status: resolvedStatus as Product["status"]
    };

    const result = await productRepository.upsert(nextProduct);
    if (!result.ok) {
      setMessage("Não foi possível salvar.");
      return;
    }
    router.push("/seller/products");
  };

  if (!product) {
    return (
      <div className="mx-auto flex min-h-[60vh] w-full max-w-4xl items-center justify-center px-6">
        <p className="text-sm text-noir-600">{message ?? "Carregando..."}</p>
      </div>
    );
  }

  return (
    <div className="flex w-full flex-col gap-8">
      <div>
        <p className="text-xs uppercase tracking-[0.3em] text-noir-500">
          Editar produto
        </p>
        <h1 className="mt-2 font-display text-3xl text-noir-950">
          {product.name}
        </h1>
        <p className="mt-2 text-sm text-noir-600">
          Atualize informações e mantenha o padrão editorial da vitrine.
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
          value={product.name}
          onChange={(event) =>
            setProduct({ ...product, name: event.target.value })
          }
          className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-noir-900 md:col-span-2"
        />
        <textarea
          placeholder="Descrição institucional"
          value={product.description}
          onChange={(event) =>
            setProduct({ ...product, description: event.target.value })
          }
          className="min-h-[120px] rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-noir-900 md:col-span-2"
        />
        <input
          type="number"
          min="0"
          step="0.01"
          placeholder="Preço (ex.: 199)"
          value={product.price}
          onChange={(event) =>
            setProduct({ ...product, price: Number(event.target.value) })
          }
          className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-noir-900"
        />
        <select
          value={product.category}
          onChange={(event) =>
            setProduct({
              ...product,
              category: event.target.value as ProductCategory
            })
          }
          className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-noir-900"
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
          value={product.weightKg ?? 0}
          onChange={(event) =>
            setProduct({ ...product, weightKg: Number(event.target.value) })
          }
          className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-noir-900"
        />
        <input
          type="number"
          min="0"
          step="0.1"
          placeholder="Largura (cm)"
          value={product.widthCm ?? 0}
          onChange={(event) =>
            setProduct({ ...product, widthCm: Number(event.target.value) })
          }
          className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-noir-900"
        />
        <input
          type="number"
          min="0"
          step="0.1"
          placeholder="Altura (cm)"
          value={product.heightCm ?? 0}
          onChange={(event) =>
            setProduct({ ...product, heightCm: Number(event.target.value) })
          }
          className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-noir-900"
        />
        <input
          type="number"
          min="0"
          step="0.1"
          placeholder="Comprimento (cm)"
          value={product.lengthCm ?? 0}
          onChange={(event) =>
            setProduct({ ...product, lengthCm: Number(event.target.value) })
          }
          className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-noir-900"
        />
        <input
          placeholder="Imagens (separe por vírgula)"
          value={product.images.join(", ")}
          onChange={(event) =>
            setProduct({
              ...product,
              images: event.target.value
                .split(",")
                .map((item) => item.trim())
                .filter(Boolean)
            })
          }
          className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-noir-900 md:col-span-2"
        />
        <select
          value={product.status}
          onChange={(event) =>
            setProduct({
              ...product,
              status: event.target.value as Product["status"]
            })
          }
          className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-noir-900"
        >
          <option value="draft">Rascunho</option>
          <option value="review">Aguardando curadoria</option>
          <option value="paused">Pausado</option>
        </select>
        <select
          value={product.imageTone ?? "rose"}
          onChange={(event) =>
            setProduct({
              ...product,
              imageTone: event.target.value as ProductImageTone
            })
          }
          className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-noir-900"
        >
          {tones.map((tone) => (
            <option key={tone} value={tone}>
              Tom {tone}
            </option>
          ))}
        </select>
        {message ? (
          <p className="text-xs text-luxe-600 md:col-span-2">{message}</p>
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



